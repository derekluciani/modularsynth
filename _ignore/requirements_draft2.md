# This version captures the state BEFORE I gave to LLMs for feedback!

-----

# Requirements 

## Objective  
* Build a functional **React-based Modular Synthesizer App** according to the requirements defined in this document.

## Role & Expectations  
* You are an expert software engineer specializing in **audio software programming**, **Web Audio API** and **React UI**.  
* You will act as an **autonomous agent**, responsible for architecting and building the entire application.  
* You will produce **complete, functional code** — not pseudocode or placeholders.  
* You will implement an architecture that is flexible enough to handle **module extensibility** in the future.  
* You will maintain an organized **file structure**.  
* You will define **highly semantic** naming conventions for variables and objects.  
* You will add **concise inline comments** for clarity.  
* You will **request to run the app server** before doing so.
* You will execute all refinements if requested.   

## Success Criteria  
* The synthesizer is fully functional in modern browsers.  
* Each audio module functions independently and supports patchable input/output connections.  
* All module parameter values respond in real time.  
* The initial state of the synthesizer is loaded with the **default patch**. 
* The app runs with command: `npm run dev` 

## Tech Stack  
* **Frontend:** Vite + React  
* **State Management:** React Context API  
* **Audio Engine:** Web Audio API [(Read the Docs)](/Users/derekluciani/repo/modularsynth/WebAudioAPI.md)
* **UI Components:** shadcn/ui (TypeScript, Dark Mode)  
* **UI Styles:** Tailwind 4 (CSS Variables, 'Zinc' palette)  

## Audio System  
* The synthesizer is composed of **independent audio modules**.  
* Modules are React components that register as an `AudioNode` within a global `AudioContext`.
  * Create `const audioCtx = new AudioContext();`  
* Independent `AudioNode` and `AudioParam` can be connected via the **Source/Destination interface**.
* An audible tone is created by routing at least one `oscillatorNode` → `gainNode` → `AudioDestinationNode`.
* **AudioWorklet:**Custom processors (like the Random module) must be loaded asynchronously from a separate file (e.g., /processors/random-processor.js).

## Module List 
Implement each one of these modules:
| AudioNode const | React Component |
|-----------|-----------------|
| osc1 | Oscillator1 |
| osc2 | Oscillator2 |
| osc3 | Oscillator3 |
| osc4 | Oscillator4 |
| filter1 | Filter1 |
| filter2 | Filter2 |
| lfo1 | LFO1 |
| lfo2 | LFO2 |
| rand1 | Random1 |
| delay1 | Delay1 |
| amp | Amp |
| audioOut | AudioOut |


## Module Parameters
The following table specifies required module parameters: 
| Module | Parameter | Value Range | API Interface | isOutputSource | isInputDestination | UI |
|--------|-----------|-------------|---------------|--------------|--------------|--------------|
| Oscillator | Pitch (Hz) | 100–10,000 (integer, log scale) | `OscillatorNode.frequency` | True | True | Slider, Input |
| Oscillator | Shape | Sine, Square, Sawtooth, Triangle | `OscillatorNode.type` | False | False | Select |
| Oscillator | Level | 0–1.0 | `gainNode.gain` | True | True | Slider |
| LFO | Freq (Hz) | 0.1–20 (log scale) | `OscillatorNode.frequency` | True | True | Slider, Input |
| LFO | Shape | Sine, Square, Sawtooth, Triangle | `OscillatorNode.type` | False | False | Select |
| Filter | Cutoff (Hz) | 60–12,000 (integer, log scale) | `BiquadFilterNode.frequency` | True | True | Slider, Input |
| Filter | Resonance (Q) | 0.1–20 (log scale) | `BiquadFilterNode.Q` | True | True | Slider |
| Filter | Type | Lowpass, Bandpass, Highpass | `BiquadFilterNode.type` | False | False | Select |
| Random | Rate (Hz) | 0.1–20 (log scale) | aka "Sample & Hold" with White Noise as built-in audio source. Implement via `AudioWorklet` | True | True | Slider |
| Random | Level | 0–1.0 | Output scaling | True | True | Slider |
| Amp | Volume | 0–1.0 | `gainNode.gain` | True | True | Slider |
| Delay | Time | 0–2.0s | `DelayNode.delayTime` | True | True | Slider |
| Delay | Repeats | 0–0.9 | A loop sampled from `gainNode` source | True | True | Slider |
| AudioOut | Stereo Pan | -1 to +1 | `StereoPannerNode.pan` | False | True | Slider |
| AudioOut | Master Volume | 0–1.0 | `createGain`,`gainNode.connect(audioCtx.destination)` | False | False | Slider |

## Module Architecture
All modules are self-contained components that include audio logic and UI.
Each module must declare:  
* **Params:** The API defines the list of supported parameters for each `AudioNode` type.
* **Output:** `AudioNode` and `AudioParam` can be output sources.
* **Input:** `AudioNode` and `AudioParam` can be input destinations. 
* **Registration:** All modules must be registered using `registerModule(name, { inputs, outputs, params })`
* Include a shared base hook `useAudioModule(name, nodeDefinitions)` to standardize param updates, node access, and module registration
* A central `AudioContextProvider` manages:  
  * AudioContext lifecycle  
  * Module registry  
  * Patch state  
  * Connection/disconnection logic  

## Connect/Disconnect Audio API
1. To connect a `AudioNode` → `AudioNode`, use `outputNode.connect(inputNode)`  
2. To connect a `AudioNode` → `AudioParam`, use `outputNode.connect(inputParam)`
3. To connect a `AudioParam` → `AudioParam`, use `outputParam.connect(inputParam)`
4. To connect a `AudioParam` → `AudioNode`, use `outputParam.connect(inputNode)`
5. To disconnect a `AudioNode` → `AudioNode`, use `outputNode.disconnect(inputNode)`  
6. To disconnect a `AudioNode` → `AudioParam`, use `outputNode.disconnect(inputParam)`
7. To disconnect a `AudioParam` → `AudioParam`, use `outputParam.disconnect(inputParam)`
8. To disconnect a `AudioParam` → `AudioNode`, use `outputParam.disconnect(inputNode)`     
* **Purpose:** Enables users to route module outputs to module inputs.
* **State:** All active connections are stored globally in React Context.

## Connect/Disconnect UI
The user will have the ability to connect/disconnect `AudioNode` modules and `AudioParams` through the interactive **"patch matrix"** component. A 'Source' Select component will pair with a 'Destination' Select component. Here are all the possible options for each Select. 

**Sources:**
- AudioNode
  - Osc 1
  - Osc 2
  - Osc 3
  - Osc 4
  - LFO 1
  - LFO 2
  - Filter 1
  - Filter 2
  - Random 1
  - Delay 1
  - Amp

**Destinations:**
- AudioNode
  - Osc 1
  - Osc 2
  - Osc 3
  - Osc 4
  - LFO 1
  - LFO 2
  - Filter 1
  - Filter 2
  - Random 1
  - Delay 1
  - Amp
  - AudioOut
- AudioParam
  - Osc 1 Pitch
  - Osc 1 Level
  - Osc 2 Pitch
  - Osc 2 Level
  - Osc 3 Pitch
  - Osc 3 Level
  - Osc 4 Pitch
  - Osc 4 Level
  - LFO 1 Freq
  - LFO 2 Freq
  - Filter 1 Cutoff
  - Filter 1 Res
  - Filter 2 Cutoff
  - Filter 1 Res
  - Random Rate
  - Random Level
  - Delay Time
  - Delay Repeats
  - Stereo Pan

### Exceptions
  * **Paired Source and Destination values cannot be the same** (eg. Osc 1 → Osc 1). If the user selects a Destination and it matches the Source, display the validation message: _"Source and destination cannot be the same"_. If the user changes the Source or Destination and the values no longer match, remove the validation message.

### UI
- Create a button that appears next to an established Source/Destination pairing. This button will enable the user to easily "Remove connection". When clicked, the button disapears and the values within both input fields reset to the default placeholder.  


## Default Routing
These are the default connections that a user will expect to have in place when the app is launched:
* LFO 1 → Osc 1 Pitch
* Osc 1 → Filter 1
* Osc 2 → Filter 1 
* Filter 1 → Amp
* Amp → Destination

### UI
- Create a button that enables the user to "_restore default patch_". When clicked, all existing connection values reset to the match the 'Default Routing' values.

## Default Parameter Values
These are the expected default values:  
* LFO 1:  
  * Pitch: **10Hz**  
  * Shape: **Sine**
* Osc 2:  
  * Pitch: **440Hz**   
  * Shape: **Sawtooth**  
* Filter 1:  
  * Cutoff: **800Hz**  
  * Resonance (Q): **1.0**  
  * Type: **Lowpass**  
* All other module parameters: **midpoint of the value range**

## Folder Structure 
- /src
  - components/
    - modules/
      - Oscillator.tsx
      - ...
    - primitives/ _// move shadcn components here_
      - Slider.tsx
      - ...
  - context/
    - AudioContextProvider.tsx
  - audio/
    - patching.ts _// connect/disconnect logic_
    - nodes.ts _// node factory utilities_
    - utils.ts
  - styles/
    - tailwind.css
- App.tsx

# Development Process & Checklist
Please implement each step and mark each one with an '[x]' once they are completed:

[ ] Review all information in this document  
[ ] Scaffold Vite + React + Tailwind + shadcn/ui [(Follow this installation process)](/Users/derekluciani/repo/modularsynth/scaffoldShadcnTailwind4.md)  
[ ] Create suggested folder structure and move files if necessary   
[ ] Implement global AudioContextProvider & patching engine  
[ ] Build reusable hooks (`useAudioModule`)  
[ ] Implement all module components
[ ] Register modules in context  
[ ] Verify default routing produces audible sound  
[ ] Apply design system + bento layout  
[ ] Add global actions
[ ] Review **Success Criteria**

# ! End of Document

<!-- | Envelope | Attack | 1ms–5s (log scale) | Stage 1 param ramp control | False | Slider |
| Envelope | Decay | 1ms–5s (log scale) | Stage 2 param ramp control | False | Slider |
| Envelope | Sustain | 0–1.0 | Stage 3 param level sustain control | False | Slider |
| Envelope | Release | 1ms–5s (log scale) | Stage 4 param level ramp control | False | Slider | -->




