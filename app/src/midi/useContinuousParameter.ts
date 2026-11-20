import { useEffect, useState } from "react";
import { createParameterControl, type ParameterOptions } from "./parameter";
import { useMidiLearn } from "./MidiLearnContext";

// The module owns this state. Screen, MIDI and patch values all use its existing audio effects.
export function useContinuousParameter(options: ParameterOptions, initialValue: number) {
  const model = useMidiLearn();
  const [value, setValue] = useState(initialValue);
  const [control] = useState(() => createParameterControl({ options, initialValue, setValue }));
  useEffect(() => model.register(control), [control, model]);
  return {
    value,
    setFromPatch: control.setFromPatch,
    slider: {
      ...control.sliderProps({ value }),
      onValueChange: ([sliderPosition]: number[]) => {
        if (sliderPosition !== undefined) control.setFromScreen(sliderPosition);
      },
    },
  };
}
