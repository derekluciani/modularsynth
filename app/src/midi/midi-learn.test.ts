import { describe, expect, it, vi } from "vite-plus/test";
import { decodeControlChange, isInputId } from "./cc";
import { createMappingStorage } from "./mapping-storage";
import { MidiLearn } from "./midi-learn";
import { createParameterControl, linearSlider, logarithmicSlider } from "./parameter";

function inputId(value: string) {
  if (!isInputId(value)) throw new Error("Invalid test input ID");
  return value;
}

const first = inputId("controller-a");
const second = inputId("controller-b");
const cc = (value: number, controller = 17, status = 0xb0) =>
  Uint8Array.of(status, controller, value);
const linear = linearSlider({ min: 0, max: 1, step: 0.01 });

function memoryStorage() {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
  };
}

function setup(storage?: ReturnType<typeof createMappingStorage>) {
  const browser = memoryStorage();
  const model = new MidiLearn(storage ?? createMappingStorage(() => browser));
  function register(parameterId: string, initialValue = 0.5, scale = linear) {
    const setValue = vi.fn();
    const control = createParameterControl({
      options: { moduleId: "demo", moduleName: "Demo", parameterId, label: parameterId, scale },
      initialValue,
      setValue,
    });
    model.register(control);
    return { control, setValue, id: control.target.id };
  }
  const send = (value: number, controller = 17, status = 0xb0, input = first) =>
    model.receive({ input, data: cc(value, controller, status) });
  const choose = (id: string) => {
    model.start();
    model.choose(id);
  };
  model.selectInput(first);
  return { model, register, send, choose };
}

describe("MIDI CC decoding", () => {
  it("uses one-based MIDI channels and unsigned seven-bit control numbers and values", () => {
    expect(decodeControlChange(cc(0, 0))).toEqual({ channel: 1, cc: 0, value: 0 });
    expect(decodeControlChange(cc(127, 127, 0xbf))).toEqual({ channel: 16, cc: 127, value: 127 });
  });

  it("ignores malformed and non-CC messages", () => {
    for (const data of [
      null,
      [0xb0, 1, 2],
      Uint8Array.of(0xb0, 1),
      Uint8Array.of(0xb0, 1, 2, 3),
      cc(128),
      cc(3, 128),
      cc(3, 3, 0x90),
      cc(3, 3, 0xf0),
      cc(3, 3, 0x30),
    ]) {
      expect(decodeControlChange(data)).toBeNull();
    }
  });
});

describe("MIDI Learn", () => {
  it("uses only the selected device and separates identical CC numbers by channel", () => {
    const { model, register, send, choose } = setup();
    const low = register("low", 0);
    const high = register("high", 1);
    choose(low.id);
    send(0, 17, 0xb0, second);
    expect(model.getSnapshot().learn.kind).toBe("capture");
    send(0);
    choose(high.id);
    send(127, 17, 0xbf);
    expect(model.getSnapshot().assignments).toHaveLength(2);
    send(0, 17, 0xb0, second);
    expect(low.setValue).not.toHaveBeenCalled();
    send(0);
    expect(low.setValue).toHaveBeenCalledOnce();
    expect(high.setValue).not.toHaveBeenCalled();
    send(127, 17, 0xbf);
    expect(high.setValue).toHaveBeenCalledExactlyOnceWith(1);
    model.selectInput(second);
    expect(model.getSnapshot().assignments).toEqual([]);
    choose(low.id);
    send(0, 17, 0xb0, second);
    expect(model.getSnapshot().assignments).toHaveLength(1);
    model.selectInput(first);
    expect(model.getSnapshot().assignments).toHaveLength(2);
  });

  it("cancels capture/conflicts without changing assignments, then confirms both replacements and removes the result", () => {
    const { model, register, choose, send } = setup();
    const pitch = register("pitch");
    const level = register("level");
    model.start();
    send(64);
    expect(model.getSnapshot().learn.kind).toBe("choose-target");
    model.choose(pitch.id);
    model.cancel();
    send(64);
    expect(model.getSnapshot().assignments).toEqual([]);
    choose(pitch.id);
    send(64);
    choose(level.id);
    send(64, 18);
    const original = model.getSnapshot().assignments;
    choose(level.id);
    send(64);
    expect(model.getSnapshot().learn).toEqual({
      kind: "conflict",
      next: { channel: 1, cc: 17, target: level.id },
      replaced: original,
    });
    send(100, 18);
    model.cancel();
    expect(model.getSnapshot().assignments).toEqual(original);
    choose(level.id);
    send(64);
    model.confirm();
    expect(model.getSnapshot().assignments).toEqual([{ channel: 1, cc: 17, target: level.id }]);
    expect(pitch.setValue).not.toHaveBeenCalled();
    expect(level.setValue).not.toHaveBeenCalled(); // Capture must never apply the incoming value.
    model.remove(level.id);
    send(64);
    expect(model.getSnapshot().assignments).toEqual([]);
    expect(level.setValue).not.toHaveBeenCalled();
  });
});

describe("device mapping storage", () => {
  it("round-trips assignments in a fresh session and leaves other keys intact", () => {
    const browser = memoryStorage();
    browser.setItem("synth_presets", "[]");
    const { model, register, choose, send } = setup(createMappingStorage(() => browser));
    const level = register("level");
    choose(level.id);
    send(64);
    model.selectInput(second);
    choose(level.id);
    send(63, 19, 0xbf, second);
    const restored = createMappingStorage(() => browser);
    expect(restored.read(first)).toEqual({
      persisted: true,
      assignments: [{ target: level.id, channel: 1, cc: 17 }],
    });
    expect(restored.read(second)).toEqual({
      persisted: true,
      assignments: [{ target: level.id, channel: 16, cc: 19 }],
    });
    expect(browser.getItem("synth_presets")).toBe("[]");
  });

  it("handles unreadable JSON, invalid rows and nonunique stored sources/targets", () => {
    const browser = memoryStorage();
    browser.setItem(`modular-synth.midi.v1:${first}`, "{");
    browser.setItem(
      `modular-synth.midi.v1:${second}`,
      JSON.stringify([
        null,
        { target: "no delimiter", channel: 1, cc: 10 },
        { target: "a/b", channel: 17, cc: 10 },
        { target: "a/c", channel: 1, cc: 128 },
        { target: "a/d", channel: 1, cc: 10 },
        { target: "a/d", channel: 2, cc: 10 },
        { target: "b/d", channel: 1, cc: 10 },
        { target: "b/d", channel: 2, cc: 10 },
      ]),
    );
    const storage = createMappingStorage(() => browser);
    expect(storage.read(first)).toEqual({ persisted: true, assignments: [] });
    expect(storage.read(second).assignments).toEqual([
      { target: "a/d", channel: 1, cc: 10 },
      { target: "b/d", channel: 2, cc: 10 },
    ]);
  });

  it("retains in-memory edits across device selection when storage access throws", () => {
    const storage = createMappingStorage(() => {
      throw new Error("storage denied");
    });
    const { model, register, choose, send } = setup(storage);
    expect(model.getSnapshot().persisted).toBe(false);
    const level = register("level");
    choose(level.id);
    send(64);
    model.selectInput(second);
    model.selectInput(first);
    expect(model.getSnapshot().persisted).toBe(false);
    expect(model.getSnapshot().assignments).toHaveLength(1);
    send(64);
    expect(level.setValue).toHaveBeenCalledExactlyOnceWith(0.5);
  });
});

describe("MIDI pickup and slider conversion", () => {
  it.each([
    [20, 100, 0.79],
    [110, 30, 0.24],
  ])(
    "waits on the first far event and catches on crossing in either direction",
    (start, end, expected) => {
      const { register, choose, send } = setup();
      const level = register("level");
      choose(level.id);
      send(64);
      send(start);
      expect(level.setValue).not.toHaveBeenCalled();
      send(end);
      expect(level.setValue).toHaveBeenCalledExactlyOnceWith(expected);
      send(127);
      expect(level.setValue).toHaveBeenLastCalledWith(1);
    },
  );

  it("catches the first post-learn event exactly one step away and resets on rebind and reselection", () => {
    const { model, register, choose, send } = setup();
    const level = register("level", 0);
    choose(level.id);
    send(64);
    send(1);
    expect(level.setValue).toHaveBeenCalledExactlyOnceWith(0.01);
    send(104);
    expect(level.setValue).toHaveBeenLastCalledWith(0.82);
    choose(level.id);
    send(104);
    send(0);
    expect(level.setValue).toHaveBeenCalledTimes(2);
    send(104);
    expect(level.setValue).toHaveBeenCalledTimes(3);
    model.selectInput(second);
    model.selectInput(first);
    send(0);
    expect(level.setValue).toHaveBeenCalledTimes(3);
  });

  it("resets only the affected target on screen edits and even same-value patch loads", () => {
    const { register, choose, send } = setup();
    const level = register("level");
    const gain = register("gain");
    choose(level.id);
    send(64);
    choose(gain.id);
    send(64, 18);
    send(64);
    send(64, 18);
    send(100);
    level.control.setFromPatch(0.79);
    level.setValue.mockClear();
    send(20);
    expect(level.setValue).not.toHaveBeenCalled();
    send(110);
    expect(level.setValue).toHaveBeenCalledExactlyOnceWith(0.87);
    level.control.setFromScreen(0.3);
    level.setValue.mockClear();
    send(100);
    expect(level.setValue).not.toHaveBeenCalled();
    send(38);
    expect(level.setValue).toHaveBeenCalledExactlyOnceWith(0.3);
    send(127, 18);
    expect(gain.setValue).toHaveBeenLastCalledWith(1);
  });

  it("uses the slider range, step and logarithmic mapping including true zero", () => {
    const { register, choose, send } = setup();
    const volume = register("volume", -30, linearSlider({ min: -60, max: 0, step: 0.5 }));
    const frequency = register("cutoff", 200, logarithmicSlider({ min: 20, max: 2000 }));
    const amount = register("amount", 0, logarithmicSlider({ min: 0.001, max: 1000, zero: true }));
    choose(volume.id);
    send(64);
    send(64);
    expect(volume.setValue).toHaveBeenCalledExactlyOnceWith(-30);
    send(32);
    expect(volume.setValue).toHaveBeenLastCalledWith(-45);
    send(127);
    expect(volume.setValue).toHaveBeenLastCalledWith(0);
    choose(frequency.id);
    send(64, 18);
    send(64, 18);
    expect(frequency.setValue.mock.lastCall?.[0]).toBeCloseTo(20 * 100 ** 0.504);
    expect(frequency.control.getPosition()).toBeCloseTo(0.504);
    choose(amount.id);
    send(0, 19);
    send(0, 19);
    expect(amount.setValue).toHaveBeenCalledExactlyOnceWith(0);
    send(1, 19);
    expect(amount.setValue.mock.lastCall?.[0]).toBeGreaterThan(0.001);
    send(127, 19);
    expect(amount.setValue).toHaveBeenLastCalledWith(1000);
  });
});
