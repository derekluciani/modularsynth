import { createContext, useContext } from "react";
import type { MidiLearn } from "./midi-learn";

export const MidiLearnContext = createContext<MidiLearn | null>(null);

export function useMidiLearn() {
  const model = useContext(MidiLearnContext);
  if (!model) throw new Error("MIDI controls require a MidiLearnProvider");
  return model;
}
