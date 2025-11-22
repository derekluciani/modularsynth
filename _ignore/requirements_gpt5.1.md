# Requirements (v2)

## Objective
Build a functional **React-based Modular Synthesizer App** using the Web Audio API with patchable module connections and real-time parameter modulation.

## Key Principles
✔ Modular audio engine  
✔ Summing-based modulation routing  
✔ Visual patching matrix  
✔ Clear extensibility to support future modules  
✔ Organized and maintainable architecture  

## Success Criteria
- App runs with: `npm run dev`
- Default patch generates audible sound
- Modules can be connected/disconnected dynamically
- All parameter changes update audio in real time
- Summed modulation routing works without instability (clamped to safe range)

## Tech Stack
- **Frontend**: Vite + React + TypeScript
- **UI Components**: shadcn/ui (Dark Mode)
- **Styles**: Tailwind CSS (v4, Zinc palette)
- **Audio Engine**: Web Audio API

## Audio Architecture

### Global AudioContext
- Single shared instance: `const audioCtx = new AudioContext()`
- Managed inside an `AudioContextProvider`
- Auto-resumes on first user interaction
- Responsible for:
  - Module registry
  - Connection/disconnection logic
  - Patch state management

## Routing Rules

### Supported Connections
| Source | Destination | Allowed | Behavior |
|--------|-------------|---------|---------|
| AudioNode | AudioNode | ✔ | Standard signal flow |
| AudioNode | AudioParam | ✔ | Modulation signal |
| AudioParam | Anything | ❌ | Not supported |

> AudioNodes generate/control sound.  
> AudioParams can **only** receive.

### Multiple Modulations
- **Allowed**
- Modulation signals **sum**
- Values are **clamped** to valid parameter ranges

### Circular Connections
❌ Prevent circular routing at connection time  
(show validation message)

## Module System

All modules follow a shared pattern:

```ts
interface AudioModule {
  id: string; // e.g., osc1
  nodes: Record<string, AudioNode>;
  params: Record<string, AudioParam | { node: AudioNode; param: AudioParam }>;
  inputs: AudioNode[];  
  outputs: AudioNode[];
}
```

Modules must register:
```ts
registerModule(id, AudioModule)
```

A shared hook:
```ts
useAudioModule(id, definition)
```

Handles:
- Param updates
- Node access
- Cleanup on unmount
- Registration with global context

## Modules to Implement
| React Component | Internal Nodes                             | Purpose                        |
| --------------- | ------------------------------------------ | ------------------------------ |
| Oscillator1-4   | OscillatorNode + GainNode                  | Tone generation + output level |
| Filter1-2       | BiquadFilterNode                           | Tone shaping                   |
| LFO1-2          | OscillatorNode + GainNode                  | Low-freq modulation            |
| Random1         | AudioWorklet or noise + S&H                | Random modulation              |
| Delay1          | DelayNode + GainNode feedback loop         | Echo effect                    |
| Amp             | GainNode                                   | Output volume control          |
| AudioOut        | StereoPannerNode + GainNode -> Destination | Mixer master output            |

## Module Parameter Definitions
| Module     | Parameter          | Range                       | Web Audio Target           | UI             |
| ---------- | ------------------ | --------------------------- | -------------------------- | -------------- |
| Oscillator | Pitch (Hz)         | 100–10,000 (log)            | OscillatorNode.frequency   | Slider + Input |
| Oscillator | Waveform           | sine, square, saw, tri      | OscillatorNode.type        | Select         |
| Oscillator | Level              | 0–1                         | GainNode.gain              | Slider         |
| LFO        | Rate (Hz)          | 0.1–20 (log)                | OscillatorNode.frequency   | Slider         |
| LFO        | Shape              | sine, square, saw, tri      | OscillatorNode.type        | Select         |
| Filter     | Cutoff (Hz)        | 60–12,000 (log)             | BiquadFilterNode.frequency | Slider         |
| Filter     | Resonance (Q)      | 0.1–20                      | BiquadFilterNode.Q         | Slider         |
| Filter     | Type               | lowpass, bandpass, highpass | BiquadFilterNode.type      | Select         |
| Random     | Rate (Hz)          | 0.1–20                      | Internal S&H clock         | Slider         |
| Random     | Level              | 0–1                         | Output scaling             | Slider         |
| Amp        | Volume             | 0–1                         | GainNode.gain              | Slider         |
| Delay      | Time               | 0–2s                        | DelayNode.delayTime        | Slider         |
| Delay      | Repeats (Feedback) | 0–0.9                       | GainNode.gain              | Slider         |
| AudioOut   | Stereo Pan         | -1 to 1                     | StereoPannerNode.pan       | Slider         |
| AudioOut   | Master Volume      | 0–1                         | GainNode.gain              | Slider         |

## Patch Matrix UI
- Select Source AudioNode
- Select Destination AudioNode or AudioParam
- "Remove Connection" button per row
- Disable invalid connections
- Prevent Source == Destination
- Show helpful validation messages

## Patch Representation Schema
```ts
interface PatchConnection {
  id: string; // uuid
  source: string;
  destination: string;
  param?: string; // present when modulating AudioParam
}
```

## Default Patch at Launch
| Connection        |
| ----------------- |
| LFO1 → Osc1 Pitch |
| Osc1 → Filter1    |
| Osc2 → Filter1    |
| Filter1 → Amp     |
| Amp → AudioOut    |

## Default Module Parameter Values
- LFO1 Rate: 10 Hz
- Osc2 Pitch: 440 Hz
- Filter1 Cutoff: 800 Hz
- Filter1 Resonance: 1.0
- All others: UI midpoint (log-mapped where applicable)

## Folder Structure
- /src
  - /components
    - /modules
    - /primitives (shadcn)
- /context
  - AudioContextProvider.tsx
- /audio
  - nodes.ts
  - patch.ts
  - utils.ts
  - styles/
  - tailwind.css
- App.tsx

## Development Checklist
Please implement each step and mark each one with an '[x]' once they are completed:
 
[ ] Scaffold environment: Vite + React + Tailwind + shadcn/ui [(Follow this installation process)](/Users/derekluciani/repo/modularsynth/scaffoldShadcnTailwind4.md)  
[ ] Implement AudioContextProvider
[ ] Implement global AudioContextProvider & patching engine  
[ ] Build useAudioModule
[ ] Implement modules (w/ node definitions)
[ ] Build patch matrix UI
[ ] Validate default patch produces sound 
[ ] Apply design
[ ] Validate against **Success Criteria**

