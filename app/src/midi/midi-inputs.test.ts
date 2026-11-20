import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { MidiInputs } from "./midi-inputs";
import { MidiLearn } from "./midi-learn";
import { createMappingStorage } from "./mapping-storage";
import { createParameterControl, linearSlider } from "./parameter";

function fakePort(id: string) {
  let listener: ((event: { data: Uint8Array }) => void) | null = null;
  const port = {
    id,
    name: `Controller ${id}`,
    state: "connected",
    connection: "closed",
    get onmidimessage() {
      return listener;
    },
    set onmidimessage(handler) {
      listener = handler;
      if (handler) this.connection = "open"; // Setting the handler implicitly opens the port.
    },
    open: vi.fn(() => {
      port.connection = "open";
      return Promise.resolve();
    }),
    close: vi.fn(() => {
      port.connection = "closed";
      return Promise.resolve();
    }),
    send(data: Uint8Array) {
      if (this.connection === "open") listener?.({ data });
    },
  };
  return port;
}

function deferred() {
  let resolve: (() => void) | undefined;
  const pending = new Promise<void>((done) => {
    resolve = done;
  });
  return { pending, finish: () => resolve?.() };
}

const statechange = new Event("statechange");
const message = { data: Uint8Array.of(0xb0, 17, 64) };

afterEach(() => vi.unstubAllGlobals());

describe("Web MIDI input lifecycle", () => {
  it("opens only on request and detaches on switch, unplug and teardown without silently reselecting", async () => {
    const first = fakePort("a");
    const second = fakePort("b");
    const ports = new Map([
      [first.id, first],
      [second.id, second],
    ]);
    const access = Object.assign(new EventTarget(), { inputs: ports });
    const requestMIDIAccess = vi.fn(() => Promise.resolve(access));
    vi.stubGlobal("navigator", { requestMIDIAccess });
    const browser = { getItem: () => null, setItem: vi.fn() };
    const model = new MidiLearn(createMappingStorage(() => browser));
    const changed = vi.fn();
    const level = createParameterControl({
      options: {
        moduleId: "osc-1",
        moduleName: "Oscillator 1",
        parameterId: "level",
        label: "Level",
        scale: linearSlider({ min: 0, max: 1, step: 0.01 }),
      },
      initialValue: 0.5,
      setValue: changed,
    });
    const unregister = model.register(level);
    const inputs = new MidiInputs({ select: model.selectInput, receive: model.receive });
    try {
      expect(requestMIDIAccess).not.toHaveBeenCalled();
      await inputs.enable();
      expect(requestMIDIAccess).toHaveBeenCalledExactlyOnceWith({ sysex: false });
      expect(inputs.getSnapshot()).toMatchObject({
        kind: "ready",
        selection: { kind: "none" },
        inputs: [{ id: "a" }, { id: "b" }],
      });
      expect(first.onmidimessage).toBeNull();
      await inputs.select("a");
      const stale = first.onmidimessage;
      expect(stale).toBeTypeOf("function");
      expect(second.onmidimessage).toBeNull();
      model.start();
      model.choose(level.target.id);
      stale?.(message);
      expect(model.getSnapshot().assignments).toHaveLength(1);
      expect(changed).not.toHaveBeenCalled();
      await inputs.select("b");
      expect(first.onmidimessage).toBeNull();
      expect(first.close).toHaveBeenCalledOnce();
      expect(second.onmidimessage).toBeTypeOf("function");
      model.start();
      model.choose(level.target.id);
      stale?.(message);
      expect(model.getSnapshot().learn.kind).toBe("capture");
      second.state = "disconnected";
      access.dispatchEvent(statechange);
      expect(second.onmidimessage).toBeNull();
      expect(model.getSnapshot().learn.kind).toBe("idle");
      expect(inputs.getSnapshot()).toMatchObject({
        selection: { kind: "disconnected", input: { id: "b" } },
        inputs: [{ id: "a" }],
      });
      second.state = "connected";
      access.dispatchEvent(statechange);
      expect(inputs.getSnapshot()).toMatchObject({
        selection: { kind: "disconnected" },
        inputs: [{ id: "a" }, { id: "b" }],
      });
      expect(first.onmidimessage).toBeNull();
      expect(second.onmidimessage).toBeNull();
      await inputs.select("a");
      stale?.(message); // An earlier listener on the same port cannot send into a new selection.
      expect(changed).not.toHaveBeenCalled();
      const current = first.onmidimessage;
      current?.(message);
      expect(changed).toHaveBeenCalledExactlyOnceWith(0.5);
      inputs.dispose();
      expect(first.onmidimessage).toBeNull();
      await Promise.resolve();
      expect(first.close).toHaveBeenCalledTimes(2);
      ports.clear();
      access.dispatchEvent(statechange);
      expect(inputs.getSnapshot()).toEqual({ kind: "inactive" });
      current?.(message);
      expect(changed).toHaveBeenCalledOnce();
    } finally {
      inputs.dispose();
      unregister();
    }
  });

  it("waits for a delayed close before reopening the same port on A→B→A", async () => {
    const first = fakePort("a");
    const second = fakePort("b");
    const closing = deferred();
    first.close.mockImplementationOnce(() =>
      closing.pending.then(() => {
        first.connection = "closed";
      }),
    );
    const access = Object.assign(new EventTarget(), {
      inputs: new Map([
        [first.id, first],
        [second.id, second],
      ]),
    });
    vi.stubGlobal("navigator", { requestMIDIAccess: () => Promise.resolve(access) });
    const receive = vi.fn();
    const inputs = new MidiInputs({ select: vi.fn(), receive });
    try {
      await inputs.enable();
      await inputs.select("a");
      await inputs.select("b");
      expect(first.close).toHaveBeenCalledOnce();
      expect(first.connection).toBe("open"); // Blink still reports open during close.
      const reopening = inputs.select("a");
      await Promise.resolve();
      expect(inputs.getSnapshot()).toMatchObject({
        selection: { kind: "opening", input: { id: "a" } },
      });
      expect(first.open).toHaveBeenCalledOnce();
      expect(first.onmidimessage).toBeNull();
      first.send(message.data);
      second.send(message.data);
      expect(receive).not.toHaveBeenCalled();

      closing.finish();
      await reopening;
      expect(first.open).toHaveBeenCalledTimes(2);
      expect(inputs.getSnapshot()).toMatchObject({
        selection: { kind: "selected", input: { id: "a" } },
      });
      second.send(message.data);
      first.send(message.data);
      expect(receive).toHaveBeenCalledExactlyOnceWith({ input: "a", data: message.data });
    } finally {
      closing.finish();
      inputs.dispose();
    }
  });

  it.each(["switch", "disconnect", "dispose"])(
    "ignores a pending open after %s",
    async (action) => {
      const first = fakePort("a");
      const second = fakePort("b");
      const opening = deferred();
      first.open.mockImplementationOnce(() => opening.pending);
      const access = Object.assign(new EventTarget(), {
        inputs: new Map([
          [first.id, first],
          [second.id, second],
        ]),
      });
      vi.stubGlobal("navigator", { requestMIDIAccess: () => Promise.resolve(access) });
      const select = vi.fn();
      const inputs = new MidiInputs({ select, receive: vi.fn() });
      try {
        await inputs.enable();
        const pending = inputs.select("a");
        await Promise.resolve();
        expect(first.open).toHaveBeenCalledOnce();
        if (action === "switch") await inputs.select("b");
        else if (action === "disconnect") {
          first.state = "disconnected";
          access.dispatchEvent(statechange);
          expect(inputs.getSnapshot()).toMatchObject({ selection: { kind: "disconnected" } });
        } else inputs.dispose();
        const snapshot = inputs.getSnapshot();
        expect(first.close).not.toHaveBeenCalled();
        opening.finish();
        await pending;
        expect(first.onmidimessage).toBeNull();
        expect(first.close).toHaveBeenCalledOnce();
        expect(select).not.toHaveBeenCalledWith("a");
        expect(inputs.getSnapshot()).toBe(snapshot);
      } finally {
        opening.finish();
        inputs.dispose();
      }
    },
  );

  it("lets the user retry after an open failure even if cleanup rejects", async () => {
    const port = fakePort("a");
    port.open.mockRejectedValueOnce(new Error("could not open"));
    port.close.mockRejectedValueOnce(new Error("could not close"));
    const access = Object.assign(new EventTarget(), { inputs: new Map([[port.id, port]]) });
    vi.stubGlobal("navigator", { requestMIDIAccess: () => Promise.resolve(access) });
    const inputs = new MidiInputs({ select: vi.fn(), receive: vi.fn() });
    try {
      await inputs.enable();
      await inputs.select("a");
      expect(inputs.getSnapshot()).toMatchObject({ selection: { kind: "failed" } });
      expect(port.onmidimessage).toBeNull();
      await inputs.select("a");
      expect(inputs.getSnapshot()).toMatchObject({ selection: { kind: "selected" } });
      expect(port.onmidimessage).toBeTypeOf("function");
    } finally {
      inputs.dispose();
    }
  });

  it("reports unsupported, blocked and empty access and permits an explicit retry", async () => {
    const inputs = new MidiInputs({ select: vi.fn(), receive: vi.fn() });
    vi.stubGlobal("navigator", {});
    await inputs.enable();
    expect(inputs.getSnapshot()).toEqual({ kind: "unavailable" });
    const requestMIDIAccess = vi
      .fn()
      .mockRejectedValueOnce(new Error("permission denied"))
      .mockResolvedValueOnce(Object.assign(new EventTarget(), { inputs: new Map() }));
    vi.stubGlobal("navigator", { requestMIDIAccess });
    await inputs.enable();
    expect(inputs.getSnapshot()).toEqual({ kind: "blocked" });
    await inputs.enable();
    expect(inputs.getSnapshot()).toEqual({
      kind: "ready",
      inputs: [],
      selection: { kind: "none" },
    });
    inputs.dispose();
  });

  it("ignores a permission request that resolves after teardown", async () => {
    const access = Object.assign(new EventTarget(), { inputs: new Map() });
    const addListener = vi.spyOn(access, "addEventListener");
    vi.stubGlobal("navigator", { requestMIDIAccess: () => Promise.resolve(access) });
    const inputs = new MidiInputs({ select: vi.fn(), receive: vi.fn() });
    const enabling = inputs.enable();
    inputs.dispose();
    await enabling;
    expect(addListener).not.toHaveBeenCalled();
    expect(inputs.getSnapshot()).toEqual({ kind: "inactive" });
  });
});
