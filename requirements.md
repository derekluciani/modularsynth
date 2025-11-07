# LLM ALIGNMENT

## Objective
Build a fully functional, **React-based Modular Synthesizer App** according to the requirements written in this document.

## System Prompt / LLM Role & Expectations
* You are an expert software engineer and UI designer specializing in **audio software**, **Web Audio API**, and **React** UI.
* You will act as an **autonomous development agent**, responsible for planning, structuring, designing, building the entire app.
* You will produce code that is **complete, working code** – no pseudocode or stubs.
* You will structure the code architecture so that it can support module extensibility.
* You will maintain a consistent **file/folder structure** throughout all outputs.
* You will consistenly apply semantic naming conventions so your code is easy to read.
* You will add **concise inline comments** explaining the purpose of key sections.
* You will execute all requested app refinements.

## Success Criteria
* Produce a functionally complete, modular audio synthesizer application that runs in a modern web browser.
* Each audio module functions independently but supports patchable input/output routing.
* Parameter controls are logically organized, labeled and easy to use.
* User changes to parameter controls must respond in real time.
* The initial state of the app has the synthesizer set to a pre-configured "default patch" routing that produces audible sound. Specs provided below.
* The appearance of the app has a considered design system that demonstrates a clear and consistent hierarchy of applied styles.
* The app is always **runnable** with standard commands:
   `npm install`
   `npm run dev`  

# PROJECT REQUIREMENTS

## Tech Stack
* **Frontend Framework:** Vite + React UI Components
* **State Management:** React Context API
* **Audio Engine:** Web Audio API
* **Styling:** Tailwind CSS
* **UI Animation:** Framer Motion

## Sound Sources
* Oscillators are the only sound sources and are expected to produce a constant audio signal and can only be interrupted by the global controls.   

## Modules
Implement independent modules as React components:
1. Oscillator 1
2. Oscillator 2
3. Filter 1
5. Envelope 1
6. Envelope 2
7. LFO 1
8. LFO 2
9. Noise
10. Sample & Hold
11. Overdrive
12. Delay
13. Amplifier (Master Volume Output)

## Module Parameters
**Table data:**
| Module | Parameter | Value | API Notes | UI Type |
|---|---|---|---|---|
| Oscillator | Pitch | 100Hz–10kHz | uses OscillatorNode | Numeric Input |
| Oscillator | Note | C–B (12 notes/1 octave starting at C/100hz–B/188.77hz) | Implement a lookup table for all 12-note frequency values | Drop Menu |
| Oscillator | Wave Shape | Square, Saw, Triangle, Sine  | N/A | Drop Menu |
| Oscillator | Pulsewidth | Rate | Modulates Oscillator waveform width | Slider |
| Filter | Cutoff | High Pass, Band Pass, Low Pass | Uses BiquadFilterNode | Drop Menu |
| Filter | Frequency | ??? | ??? | Slider |
| Envelope | Attack | 0-100 | Controls GainNode | Slider |
| Envelope | Decay | 0-100 | Controls GainNode | Slider |
| Envelope | Sustain | 0-100 | Controls GainNode | Slider |
| Envelope | Release | 0-100 | Controls GainNode | Slider |
| LFO | Frequency | 0.1Hz–20Hz | Modulates target params | Slider |
| LFO | Wave Shape | Square, Saw, Triangle, Sine  | Modulates target params | Drop Menu |
| Sample & Hold | Rate | Random modulation produced by integrated noise module (hidden from user) | Slider |
| Distortion | Gain | 0-100 | uses WaveShaperNode | Slider |
| Distortion | Level | 0-100 | uses GainNode | Slider |
| Amplifier | Volume | 0-100 | uses GainNode, AudioDestinationNode | Slider |
| Amplifier | Mute | True, False | controls active/inactive state of Amplifier module| Checkbox |

## Module Patching System
* **Purpose:** User-controlled signal routing between modules.
* **Visual Wires:** Interactive ‘Patch Wires’ simulate the realistic method of connecting voltage-controlled analog modules.
* **Connection:** Clicking an Output → then an Input creates a connection between two modules.
* **Disconnection:** Clicking an Output or Input with an existing connection removes it.
* **API:** Uses Web Audio API connect() / disconnect().
* **State:** Connection data stored globally in Context.
* **UI:** SVG or Canvas lines.

### "Default Patch" Routing
* Default routing at app load:
     * Oscillator 1 → Filter 1 → Envelope 1 → Overdrive → Amplifier
     * LFO 1 → Filter 1
     * Envelope 1 → Filter 1
* Oscillator 1 pitch parameter set to 440Hz, wave shape parameter set to Saw.
* Set all other module parameters to their mid point value.
* Show a dismissable tooltip anchored to the Oscillator 1 output connecton with message "Reconfigure the module connections to change the sound!"

## Global Controls
Includes:
* "Play/Stop" button (start/suspend AudioContext)
* "Reset Synth" button (restore "Default Patch" routing)

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

# END OF REQUIREMENTS ---------------------------------------------------------------------- 

<!-- ## Future Extensibility Ideas (DO NOT IMPLEMENT)
* Add effects modules (Delay, Reverb)
* Save/load custom patches
* Add more presets to the "Default Patch" list
* Record/export audio (mp3)
* Add a sequencer or mod matrix
* Add note triggering via keyboard input
* Support MIDI CC mapping to parameters -->