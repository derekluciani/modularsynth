export type ModuleType =
  | 'Oscillator'
  | 'Filter'
  | 'LFO'
  | 'Random'
  | 'Delay'
  | 'Amp'
  | 'AudioOut'
  | 'Distortion';

export interface AudioModuleRegistryItem {
  id: string;
  type: ModuleType;
  inputs: Record<string, AudioNode | AudioParam>;
  outputs: Record<string, AudioNode>;
  params: Record<string, AudioParam>;
  getState: () => Record<string, any>;
  setState: (state: Record<string, any>) => void;
}

export interface Connection {
  id: string;
  sourceModuleId: string;
  sourceNodeName: string; // e.g., 'output'
  destModuleId: string;
  destInputName: string; // e.g., 'input' or 'frequency'
  isParam: boolean; // true if destination is an AudioParam
}

export interface AudioContextType {
  audioCtx: AudioContext | null;
  analyserNode: AnalyserNode | null;
  isWorkletLoaded: boolean;
  modules: Record<string, AudioModuleRegistryItem>;
  connections: Connection[];
  registerModule: (id: string, data: AudioModuleRegistryItem) => void;
  unregisterModule: (id: string) => void;
  connect: (sourceId: string, sourceNode: string, destId: string, destInput: string) => void;
  disconnect: (connectionId: string) => void;
  resetConnections: () => void;
  restoreDefaultPatch: () => void;
  resumeContext: () => Promise<void>;
  loadPatch: (patch: any) => void;
}
