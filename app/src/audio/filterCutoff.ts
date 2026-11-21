export const FILTER_CUTOFF_MIN_HZ = 20;
const CUTOFF_SMOOTHING_SECONDS = 0.01;

export function createFilterCutoffControl({
  filter,
  initialCutoffHz,
}: {
  filter: BiquadFilterNode;
  initialCutoffHz: number;
}) {
  const context = filter.context;
  const cutoffSpanHz = context.sampleRate / 2 - FILTER_CUTOFF_MIN_HZ;
  const cutoffSum = context.createConstantSource();
  const normalize = context.createGain();
  const clamp = context.createWaveShaper();
  const toHertz = context.createGain();

  // The a-rate offset sums all cutoff cables (in Hz) with the smoothed knob value above the floor.
  cutoffSum.offset.value = initialCutoffHz - FILTER_CUTOFF_MIN_HZ;
  normalize.gain.value = 1 / cutoffSpanHz;
  // Clamp the summed cutoff to [20 Hz, Nyquist]. Hitting zero Hz can pop in a lowpass biquad.
  clamp.curve = new Float32Array([0, 0, 1]);
  toHertz.gain.value = cutoffSpanHz;
  filter.frequency.value = FILTER_CUTOFF_MIN_HZ;
  cutoffSum.connect(normalize).connect(clamp).connect(toHertz).connect(filter.frequency);
  cutoffSum.start();

  return {
    modulationInput: cutoffSum.offset,
    setCutoff(cutoffHz: number) {
      cutoffSum.offset.setTargetAtTime(
        cutoffHz - FILTER_CUTOFF_MIN_HZ,
        context.currentTime,
        CUTOFF_SMOOTHING_SECONDS,
      );
    },
    dispose() {
      cutoffSum.stop();
      cutoffSum.disconnect();
      normalize.disconnect();
      clamp.disconnect();
      toHertz.disconnect();
    },
  };
}
