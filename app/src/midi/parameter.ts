import { linearToLog, logToLinear } from "../audio/scales";

export type TargetId = `${string}/${string}`;
export const isTargetId = (input: unknown): input is TargetId =>
  typeof input === "string" && /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(input);

export type Target = {
  id: TargetId;
  moduleId: string;
  moduleName: string;
  label: string;
};

export const targetName = (target: Target) => `${target.moduleName} ${target.label}`;

// Scale describes the existing slider's coordinate system, not the AudioParam's.
type Range = { min: number; max: number };
type SliderScale = Range & {
  step: number;
  fromSlider: (position: number) => number;
  toSlider: (value: number) => number;
};

export function linearSlider({ min, max, step }: Range & { step: number }): SliderScale {
  return { min, max, step, fromSlider: (position) => position, toSlider: (value) => value };
}

export function logarithmicSlider({
  min,
  max,
  zero = false,
}: Range & { zero?: boolean }): SliderScale {
  return {
    min: 0,
    max: 1,
    step: 0.001,
    fromSlider: (position) => (zero && position === 0 ? 0 : linearToLog(position, min, max)),
    toSlider: (value) => logToLinear(value, min, max),
  };
}

export type ParameterOptions = Omit<Target, "id"> & { parameterId: string; scale: SliderScale };

export function createParameterControl({
  options: { moduleId, moduleName, parameterId, label, scale },
  initialValue,
  setValue,
}: {
  options: ParameterOptions;
  initialValue: number;
  setValue: (value: number) => void;
}) {
  const target: Target = { id: `${moduleId}/${parameterId}`, moduleId, moduleName, label };
  let value = initialValue;
  let revision = 0;

  const write = (next: number) => {
    value = next;
    setValue(next);
  };

  return {
    target,
    getRevision: () => revision,
    getPosition: () =>
      Math.max(0, Math.min(1, (scale.toSlider(value) - scale.min) / (scale.max - scale.min))),
    setFromMidi(position: number) {
      const raw = scale.min + position * (scale.max - scale.min);
      // Match the slider's step grid, including exact endpoints and its decimal precision.
      const precision = (String(scale.step).split(".")[1] ?? "").length;
      const snapped = Math.round((raw - scale.min) / scale.step) * scale.step + scale.min;
      const bounded =
        position === 1 ? scale.max : Math.min(scale.max, Number(snapped.toFixed(precision)));
      write(scale.fromSlider(bounded));
    },
    setFromScreen(sliderPosition: number) {
      revision++;
      write(scale.fromSlider(sliderPosition));
    },
    setFromPatch: (next: number) => {
      // Even a patch that happens to contain the same value disarms pickup.
      revision++;
      write(next);
    },
    sliderProps: ({ value }: { value: number }) => ({
      min: scale.min,
      max: scale.max,
      step: scale.step,
      value: [scale.toSlider(value)],
      thumbLabel: targetName(target),
    }),
  };
}

export type ParameterControl = ReturnType<typeof createParameterControl>;
