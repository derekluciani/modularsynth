import { useState, type ReactNode } from "react";
import { createMappingStorage } from "./mapping-storage";
import { MidiLearn } from "./midi-learn";
import { MidiLearnContext } from "./MidiLearnContext";

export function MidiLearnProvider({ children }: { children: ReactNode }) {
  const [model] = useState(() => new MidiLearn(createMappingStorage(() => window.localStorage)));
  return <MidiLearnContext.Provider value={model}>{children}</MidiLearnContext.Provider>;
}
