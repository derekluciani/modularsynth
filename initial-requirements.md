# LLM ALIGNMENT

## Objective
Build a fully functional, **React-based Modular Synthesizer App** according to the requirements written in this document.

## System Prompt / LLM Role & Expectations
* You are an expert software engineer and UI designer specializing in **audio software**, **Web Audio API**, and **React** UI.
* You will act as an **autonomous development agent**, responsible for planning, structuring, designing, building the entire app.
* You will produce code that is **complete, working code** – no pseudocode or stubs.
* You will structure the code architecture so that it can support module extensibility in the future.
* You will maintain a consistent **file/folder structure** throughout all outputs.
* You will consistenly apply semantic-first naming conventions in your code so it is easy for others to read.
* You will add **concise inline comments** explaining the purpose of key sections.
* You will execute all app refinement requests.

## Success Criteria
* Produce a functionally complete, performant, audio synthesizer application that runs smoothly in a modern web browser.
* Each audio module functions independently but supports patchable input/output routing.
* Parameter controls are logically organized, labeled and easy to use.
* User-controlled changes to parameter values must respond in real time.
* The synthesizer's initial state must be set to a "default patch" routing configuration that produces audible sound. Specs provided below.
* The app has a considered visual design system that demonstrates a clear and consistent hierarchy of applied styles.
* The app is always **runnable** with standard commands:
   `npm install`
   `npm run dev`  

# PROJECT REQUIREMENTS

## Tech Stack
* **Frontend Framework:** Vite + React
* **State Management:** React Context API
* **Audio Engine:** Web Audio API
* **UI Component Base:** Shadcn/ui
* **UI Styles:** Tailwind CSS (v4+)
* **UI Animation:** Framer Motion

## Sound Sources
* Oscillators are the only sound sources and are expected to produce a constant audio signal. The oscillator's frequency value determines its tone and does not require a trigger signal to initialize said tone.   

## Modules
Implement independent modules as React components:
1. Oscillator 1
2. Oscillator 2
3. Oscillator 3
4. Oscillator 4
5. Filter 1
6. Filter 2
7. Envelope 1
8. Envelope 2
9. LFO 1
10. LFO 2
11. Sample & Hold
12. Delay
13. Amplifier ("VCA")
14. Master Panning
14. Master Volume (Destination)

## Module Parameters
**Table data:**
| Module | Parameter | Values | API Notes | UI Component |
|---|---|---|---|---|
| Oscillator | Frequency | 100Hz–10kHz (Integers only, log scale) | Uses OscillatorNode.frequency | Slider |
| Oscillator | Wave Shape | Sine, Square, Sawtooth, Triangle | Uses OscillatorNode.type | Drop Menu |
| Filter | Cutoff Frequency | 60Hz-12kHz | Uses BiquadFilterNode.frequency.value | Slider |
| Filter | Resonance | ??? Q Factor | Uses ???| Slider |
| Filter | Type | Lowpass, Bandpass, Highpass | Uses BiquadFilterNode.type | Drop Menu |
| Envelope | Attack | 1ms–5s (log scale) | Controls GainNode.gain via setTargetAtTime or linearRampToValueAtTime | Slider |
| Envelope | Decay | 1ms–5s (log scale) | Same as Decay | Slider |
| Envelope | Sustain | 0-1 (linear scale)| Sets sustain level of gain | Slider |
| Envelope | Release | 1ms–5s (log scale) | Controls release curve | Slider |
| LFO | Frequency | 0.1Hz–20Hz (log scale) | Modulates assigned parameter via AudioParam automation | Slider |
| LFO | Wave Shape | Sine, Square, Sawtooth, Triangle | Generated via OscillatorNode | Drop Menu |
| Sample & Hold | Rate | 0.1-20Hz (log scale) | Implement with internal noise + AudioWorklet | Slider |
| Sample & Hold | Level | 0-1 (linear scale) | Output scaling | Slider |
| Delay | Time | 0-2s (linear scale) | Uses DelayNode.delayTime.value | Slider |
| Delay | Feedback | 0-0.9 (linear scale) | Add feedback path using GainNode | Slider |
| Amplifier | Volume | 0-1 (linear scale) | Final stage before AudioDestinationNode | Slider |
| Output Panning | Pan | -1(L) – +1(R) | Uses StereoPannerNode | Slider (Default to center position: 0) |
| Output Volume | Master Volume | 0-1 (linear scale) | Can only receive input source. Uses gainNode and AudioDestinationNode | Slider |

### Synthesizer "Default Values"
* Default module routing at app load:
     * Oscillator 1 → Filter 1 → Amplifier
     * Envelope 1 → Filter 1
     * Envelope 2 → Amplifier
     * LFO 1 → Filter 1
* Default parameter values:     
     * Set Oscillator 'Frequency' to '440Hz', 'Wave Shape' to 'Saw'.
     * Set Filter 'Cutoff Frequency' to '800Hz', 'Resonance' to **'???'**, 'Type' to 'Lowpass'  
     * Set all other module parameters to their mid point value.

## Global Controls
* "Edit Routing" button (function: Changes UI view, enabling the user to change module routing)
* "Edit Parameters" button (function: Changes UI view, enabling the user to change module parameters)
* "Restore Default" button (function: Replaces existing state back to "Default module routing")
* "Clear All" button (function: Removes all existing module routing)

## Module Patching System
* **Purpose:** User-controlled Output/Input signal routing between modules.
* **Connection:** A connection between two modules can be created by selecting a module as the destination from a source module's Output menu.
* **Disconnection:** Selecting 'None' from the source module's Output menu will disconnect the module's connection.
* **Connection Constraints:** A module's max # of outputs: 1. Max # of inputs: ≥1
* **API:** Uses Web Audio API connect() / disconnect().
* **State:** Connection data stored globally in Context
* **Visual Connection:** Connections between modules are visually represented with graphical ‘Patch Cables’. These cables are either SVG vector segments or Canvas lines meant to emulate the analog aesthetic of physical modules being patched together via electrical cables.

## Visual Design Preferences
* **Modules Layout:** "Bento-style" modular Grid, Responsive across small and large viewports.
<!-- * **Layout Density:** ‘Compact’, ‘Medium’, or ‘Spacious’. -->
* **Theme/Style:**
     * Dark Theme
     * Flat UI
     * Inspired by design aesthetic of Sequential Circuits Prophet Synthesizers
* **Color Palette:**
     * Monochromatic palette applied to synth modules
     * Vibrant color accents applied to patch wires.    
* **Image Reference:**
     * Image "name.png" in the "ref" directory captures the visual representation of all my listed preferences.

## App Sections
1. Header:
     * Title text "Modular synths have the right to normies"
     * Subtitle text "Play with me, I make cool sounds!"
2. Modular Synth: 
     Includes Modules only. Each module includes:
     * Module title
     * Input and Output patch connection points
     * Parameter controls
3. Global Controls       

## Architecture & Extensibility Requirements
* **Goal:** Ensure long-term flexibility for new modules and feature functionality.
* **Rules:**
* Each module is self-contained with UI + audio logic.
* All modules register via a shared AudioContextProvider:
  `registerModule(name, node, inputs, outputs)`
* New modules can be added with minimal setup.
* Include a base module hook (e.g., useAudioModule) for standardized parameter management.
* **Clear Folder Structure:**
  `/src`
  `└── components/`
       `└── modules/`
            `└── OscillatorModule.jsx`
            `└── FilterModule.jsx`
            `└── ...`
       `└── PatchWire.jsx`
       `└── ControlPanel.jsx`
       `└── Header.jsx`
  `└── context/`
       `└── AudioContextProvider.jsx`
  `└── audio/`
       `└── patching.js`
       `└── nodes.js`
       `└── utils.js`
  `└── styles/`
       `└── tailwind.css`
  `└── App.jsx`

## Suggested Development Workflow
1. Scaffold React + Tailwind project.
2. Implement global audio context and patch logic.
3. Build base reusable hooks.
4. Create module components and link them via context.
5. Implement patch wire UI.
6. Add Control Panel and Play/Stop logic.
7. Verify default patch playback.
8. Apply visual preferences or defaults.
9. Comment code for clarity and future extensibility.

# !END OF REQUIREMENTS 

(DO NOT IMPLEMENT ANYTHING BELOW THIS POINT)

<!-- ## Future Extensibility Ideas
* Add effects modules (Delay, Reverb)
* Save/load custom patches
* Add more presets to the "Default Patch" list
* Record/export audio (mp3)
* Add a sequencer or mod matrix
* Add note triggering via keyboard input
* Support MIDI CC mapping to parameters
* Selectable UI themes (Default: Dieter Ram) -->

<!-- modules:
| Oscillator | Note | C–B (100Hz–189Hz base octave) | Implement as a lookup table (values are defined in next section) | Drop Menu |
| Oscillator | Octave | x1, x2, x3 | Multiplies base pitch frequency (f × 2ⁿ) | Radio Group |
| Oscillator | Pulsewidth | Rate | 0.1–20 Hz (log scale) | Modulates width of Oscillator |  waveform | Slider |
| Noise | Level | 0-1 (linear scale) | Implement by creating a looping random buffer, type: White noise | Slider |
| Distortion | Gain | 0-1 (linear scale) | Uses WaveShaperNode curve shaping | Slider |
| Distortion | Level | 0-1 (linear scale) | Uses GainNode after distortion | Slider |

### Oscillator Note Parameters
* Pitch and Note are two separate parameters that sample from the same Frequency value range. Here is the conditional logic to be implemented:
     * If a selected Pitch value matches a Note value, and vis versa, both parameter values are displayed. (ie. Pitch: 141Hz, Note: F#)
     * If a selected Pitch value does not match a Note value, the Note value is set to 'null' and displayed as '--' . (ie. Pitch: 440Hz, Note: --)
     * If the app is in its initial/default state, then all Oscillator Pitch values are set to "440Hz" and Note values set to "null".
* **Note parameter values / Lookup table:**
| Semitone | Frequency | Value |
|---|---|---|
| Root | 100Hz | C |
| 1 | 106Hz | C# / Db |
| 2 | 112Hz | D |
| 3 | 119Hz | D# / Eb |
| 4 | 126Hz | E |
| 5 | 134Hz | F |
| 6 | 141Hz | F# |
| 7 | 150Hz | G |
| 8 | 159Hz | G# |
| 9 | 168Hz | A |
| 10 | 178Hz | A# |
| 11 | 189Hz | B |

<!-- * Show a dismissable tooltip anchored to the Oscillator 1 output connecton with message "Reconfigure the module connections to change the sound!" -->