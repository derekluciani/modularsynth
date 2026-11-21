import { createFilterCutoffControl } from "./filterCutoff";
import { createPatchConnections } from "./patching";
import type { AudioModuleRegistryItem } from "./types";

const SAMPLE_RATE = 48000;

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function render({
  cutoffHz,
  modsHz = [],
  modulationRateHz = 0,
  raw = false,
  removeFirstCable = false,
  rate = SAMPLE_RATE,
  targetHz,
}: {
  cutoffHz: number;
  modsHz?: number[];
  modulationRateHz?: number;
  raw?: boolean;
  removeFirstCable?: boolean;
  rate?: number;
  targetHz?: number;
}) {
  const context = new OfflineAudioContext(1, rate, rate);
  const carrier = context.createOscillator();
  carrier.type = "sawtooth";
  carrier.frequency.value = 32.03189;
  const carrierGain = context.createGain();
  carrierGain.gain.value = 0.68;
  const filter = context.createBiquadFilter();
  filter.Q.value = 0.1;
  carrier.connect(carrierGain).connect(filter).connect(context.destination);
  carrier.start();

  filter.frequency.value = cutoffHz;
  const control = raw ? null : createFilterCutoffControl({ filter, initialCutoffHz: cutoffHz });
  const state = { getState: () => ({}), setState: () => {} };
  const destModule: AudioModuleRegistryItem = {
    id: "filter-1",
    type: "Filter",
    inputs: { input: filter },
    outputs: { output: filter },
    params: { cutoff: control?.modulationInput ?? filter.frequency },
    ...state,
  };
  const cables = createPatchConnections();
  const modulators = modsHz.map((depthHz, index) => {
    const modulation = modulationRateHz
      ? new OscillatorNode(context, { frequency: modulationRateHz })
      : new ConstantSourceNode(context, { offset: 1 });
    const depth = context.createGain();
    depth.gain.value = depthHz;
    modulation.connect(depth);
    modulation.start();
    const sourceModule: AudioModuleRegistryItem = {
      id: `mod-${index}`,
      type: modulationRateHz ? "LFO" : "Random",
      outputs: { output: depth },
      inputs: {},
      params: {},
      ...state,
    };
    assert(
      cables.connect({
        sourceModule,
        sourceNodeName: "output",
        destModule,
        destInputName: "cutoff",
      }),
      "Cutoff cable should connect",
    );
    return modulation;
  });
  if (removeFirstCable) {
    const [first] = cables.getConnections();
    assert(cables.disconnect(first.id), "Cutoff cable should disconnect");
  }
  if (targetHz !== undefined) {
    if (control) control.setCutoff(targetHz);
    else filter.frequency.setTargetAtTime(targetHz, 0, 0.01);
  }
  try {
    return (await context.startRendering()).getChannelData(0);
  } finally {
    cables.clear();
    control?.dispose();
    modulators.forEach((modulator) => modulator.stop());
    carrier.stop();
  }
}

function maxJump(samples: Float32Array) {
  let jump = 0;
  for (let i = SAMPLE_RATE / 10; i < samples.length; i++) {
    jump = Math.max(jump, Math.abs(samples[i] - samples[i - 1]));
  }
  return jump;
}

// Run in a Chromium tab on the Vite dev server (see README).
export async function runFilterCutoffRegression() {
  // Minimal reproducer: the lowpass already pops before the downstream Delay and Amp.
  const sweep = { modsHz: [221.81964], modulationRateHz: 3.713486 };
  const patched = await Promise.all(
    [20, 80, 150, 219.80117].map(async (cutoffHz) => {
      const samples = await render({ cutoffHz, ...sweep });
      const jump = maxJump(samples);
      const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample ** 2, 0) / samples.length);
      assert(
        jump < 0.06 && rms > 0.1,
        `Unexpected cut-off sweep at ${cutoffHz} Hz: ${jump}, ${rms}`,
      );
      return { cutoffHz, jump, rms };
    }),
  );

  const cases = [
    { label: "unpatched", input: { cutoffHz: 300 }, expected: { cutoffHz: 300 } },
    {
      label: "smoothed cutoff updates",
      input: { cutoffHz: 300, targetHz: 1400 },
      expected: { cutoffHz: 300, targetHz: 1400 },
    },
    {
      label: "sample-accurate modulation above the floor",
      input: { cutoffHz: 250, modsHz: [200], modulationRateHz: 1379 },
      expected: { cutoffHz: 250, modsHz: [200], modulationRateHz: 1379 },
    },
    {
      label: "sum opposing sources before clamping",
      input: { cutoffHz: 300, modsHz: [-600, 500] },
      expected: { cutoffHz: 200 },
    },
    {
      label: "clamp a negative sum to 20 Hz",
      input: { cutoffHz: 300, modsHz: [-600, 200] },
      expected: { cutoffHz: 20 },
    },
    {
      label: "remove only the selected cutoff cable",
      input: { cutoffHz: 300, modsHz: [-600, 200], removeFirstCable: true },
      expected: { cutoffHz: 500 },
    },
    {
      label: "allow modulation above the slider maximum up to Nyquist",
      input: { cutoffHz: 19500, modsHz: [3000] },
      expected: { cutoffHz: 22500 },
    },
    {
      label: "saturate past Nyquist at 44.1 kHz",
      input: { cutoffHz: 19500, modsHz: [18000], rate: 44100 },
      expected: { cutoffHz: 22050, rate: 44100 },
    },
  ];
  const matchingReference = await Promise.all(
    cases.map(async ({ label, input, expected }) => {
      const samples = await render(input);
      const reference = await render({ ...expected, raw: true });
      const maxDifference = samples.reduce(
        (max, sample, i) => Math.max(max, Math.abs(sample - reference[i])),
        0,
      );
      assert(maxDifference < 0.0001, `${label}: difference from native filter ${maxDifference}`);
      return { label, maxDifference };
    }),
  );
  return { patched, matchingReference };
}
