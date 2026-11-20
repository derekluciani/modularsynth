import { afterEach, expect, it, vi } from "vite-plus/test";
import { createPatchConnections } from "./patching";
import type { AudioModuleRegistryItem } from "./types";

// Node does not provide a Web Audio graph. Record node/param calls for the routing tests.
class TestGainNode {
  readonly context: Pick<BaseAudioContext, "sampleRate">;
  gain = { value: 1 };
  onConnect = vi.fn();
  onDisconnect = vi.fn();
  connect = this.onConnect;
  disconnect = this.onDisconnect;

  constructor(context: Pick<BaseAudioContext, "sampleRate">) {
    this.context = context;
  }
}

afterEach(() => vi.unstubAllGlobals());

function setup() {
  const createIIRFilter = vi.fn(() => new TestGainNode(context));
  vi.stubGlobal("GainNode", TestGainNode);
  vi.stubGlobal(
    "OfflineAudioContext",
    class {
      sampleRate = 48000;
      createIIRFilter = createIIRFilter;
    },
  );
  const context = new OfflineAudioContext(1, 48000, 48000);
  const makeModule = (id: string, type: AudioModuleRegistryItem["type"]) => {
    const node = new GainNode(context);
    if (!(node instanceof TestGainNode)) throw new Error("Missing Web Audio test double");
    const module: AudioModuleRegistryItem = {
      id,
      type,
      inputs: { input: node },
      outputs: { output: node },
      params: {
        gain: node.gain,
        level: node.gain,
        volume: node.gain,
        pitch: node.gain,
        cutoff: node.gain,
      },
      getState: () => ({}),
      setState: vi.fn(),
    };
    return { module, node };
  };
  const cables = createPatchConnections();
  const connect = (
    sourceModule: AudioModuleRegistryItem,
    destModule: AudioModuleRegistryItem,
    destInputName: string,
  ) => cables.connect({ sourceModule, sourceNodeName: "output", destModule, destInputName });

  return { cables, connect, createIIRFilter, makeModule };
}

it.each([
  { sourceType: "LFO", destType: "Oscillator", port: "pitch" },
  { sourceType: "LFO", destType: "Amp", port: "input" },
  { sourceType: "LFO", destType: "Filter", port: "cutoff" },
  { sourceType: "Random", destType: "Oscillator", port: "level" },
  { sourceType: "Oscillator", destType: "Amp", port: "gain" },
] satisfies {
  sourceType: AudioModuleRegistryItem["type"];
  destType: AudioModuleRegistryItem["type"];
  port: string;
}[])("leaves $sourceType → $destType $port direct", ({ sourceType, destType, port }) => {
  const { cables, connect, createIIRFilter, makeModule } = setup();
  const source = makeModule("source", sourceType);
  const dest = makeModule("dest", destType);

  expect(connect(source.module, dest.module, port)).toBe(true);
  const endpoint = port === "input" ? dest.node : dest.node.gain;
  expect(source.node.onConnect).toHaveBeenCalledExactlyOnceWith(endpoint);
  expect(createIIRFilter).not.toHaveBeenCalled();

  cables.clear();
  expect(source.node.onDisconnect).toHaveBeenCalledExactlyOnceWith(endpoint);
});

it.each([
  { destType: "Oscillator", port: "level" },
  { destType: "Amp", port: "gain" },
  { destType: "AudioOut", port: "volume" },
] satisfies { destType: AudioModuleRegistryItem["type"]; port: string }[])(
  "smooths LFO → $destType $port without changing the intrinsic gain",
  ({ destType, port }) => {
    const { cables, connect, createIIRFilter, makeModule } = setup();
    const source = makeModule("lfo", "LFO");
    const dest = makeModule("dest", destType);
    dest.node.gain.value = 0.4;

    expect(connect(source.module, dest.module, port)).toBe(true);
    expect(connect(source.module, dest.module, port)).toBe(false);
    expect(createIIRFilter).toHaveBeenCalledTimes(1);
    const smoother = createIIRFilter.mock.results[0].value;
    expect(source.node.onConnect).toHaveBeenCalledExactlyOnceWith(smoother);
    expect(smoother.connect).toHaveBeenCalledExactlyOnceWith(dest.node.gain);
    expect(dest.node.gain.value).toBe(0.4);

    const [connection] = cables.getConnections();
    expect(cables.disconnect(connection.id)).toBe(true);
    expect(cables.disconnect(connection.id)).toBe(false);
    expect(source.node.onDisconnect).toHaveBeenCalledExactlyOnceWith(smoother);
    expect(smoother.disconnect).toHaveBeenCalledExactlyOnceWith();
  },
);

it("detaches only the selected cable and clears remaining routes for a fresh patch", () => {
  const { cables, connect, createIIRFilter, makeModule } = setup();
  const lfo1 = makeModule("lfo-1", "LFO");
  const lfo2 = makeModule("lfo-2", "LFO");
  const osc = makeModule("osc", "Oscillator");
  const amp = makeModule("amp", "Amp");

  connect(lfo1.module, osc.module, "level");
  connect(lfo1.module, amp.module, "gain");
  connect(lfo2.module, osc.module, "level");
  connect(lfo1.module, osc.module, "pitch");
  const [oscLevel, ampGain, otherLevel, pitch] = cables.getConnections();
  const [firstSmoother, ampSmoother, otherSmoother] = createIIRFilter.mock.results.map(
    ({ value }) => value,
  );

  cables.disconnect(oscLevel.id);
  expect(cables.getConnections()).toEqual([ampGain, otherLevel, pitch]);
  expect(lfo1.node.onDisconnect).toHaveBeenCalledExactlyOnceWith(firstSmoother);
  expect(ampSmoother.disconnect).not.toHaveBeenCalled();
  expect(lfo2.node.onDisconnect).not.toHaveBeenCalled();

  cables.removeModule("amp");
  expect(cables.getConnections()).toEqual([otherLevel, pitch]);
  expect(lfo1.node.onDisconnect).toHaveBeenNthCalledWith(2, ampSmoother);
  expect(ampSmoother.disconnect).toHaveBeenCalledExactlyOnceWith();

  cables.clear();
  expect(cables.getConnections()).toEqual([]);
  expect(lfo1.node.onDisconnect).toHaveBeenNthCalledWith(3, osc.node.gain);
  expect(lfo2.node.onDisconnect).toHaveBeenCalledExactlyOnceWith(otherSmoother);
  expect(otherSmoother.disconnect).toHaveBeenCalledExactlyOnceWith();

  expect(connect(lfo1.module, osc.module, "level")).toBe(true);
  expect(createIIRFilter).toHaveBeenCalledTimes(4);
  expect(cables.getConnections()).toEqual([oscLevel]);
  cables.clear();
});

it("detaches the smoother when unregistering a source already disconnected by module cleanup", () => {
  const { cables, connect, createIIRFilter, makeModule } = setup();
  const source = makeModule("lfo", "LFO");
  const dest = makeModule("amp", "Amp");
  connect(source.module, dest.module, "gain");
  source.node.onDisconnect.mockImplementation(() => {
    throw new DOMException("Already detached", "InvalidAccessError");
  });

  expect(cables.removeModule("lfo")).toBe(true);
  expect(createIIRFilter.mock.results[0].value.disconnect).toHaveBeenCalledExactlyOnceWith();
  expect(cables.getConnections()).toEqual([]);
});
