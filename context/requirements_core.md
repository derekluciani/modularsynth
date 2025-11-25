# Requirements  

## Audio System  
* The synthesizer is composed of **independent audio modules**.  
* Modules are React components that register as an `AudioNode` within a single shared instance `const audioCtx = new AudioContext()` and managed inside an `AudioContextProvider`.
* Independent `AudioNode` and `AudioParam` can be connected via the **Source/Destination interface**.
* **AudioWorklet:** Custom processors (like the Random module) must be loaded asynchronously from a separate file (e.g., `/processors/random-processor.js`)

## Module Architecture
All modules are self-contained components that include audio logic and UI.
Each module must declare:  
* **Params:** The API defines the list of supported parameters for each `AudioNode` type.
* **Output:** The module's main `AudioNode` output (if applicable)
* **Input:** `AudioNode` inputs and exposed `AudioParam` 
* **Registration:** All modules must be registered using `registerModule(name, { inputs, outputs, params })`
* Include a shared base hook `useAudioModule(name, nodeDefinitions)` to standardize param updates, node access, and module registration
* A central `AudioContextProvider` manages:  
  * AudioContext lifecycle  
  * Module registry  
  * Patch state  
  * Connection/disconnection logic
  * Loading of AudioWorklet modules

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
- **Allowed ✔**
- Modulation signals **"sum"** together
- Values are **"clamped"** to valid parameter ranges 

## Connect/Disconnect Audio API
1. To connect a `AudioNode` → `AudioNode`, use `outputNode.connect(inputNode)`  
2. To connect a `AudioNode` → `AudioParam`, use `outputNode.connect(inputParam)`
3. To disconnect a `AudioNode` → `AudioNode`, use `outputNode.disconnect(inputNode)`  
4. To disconnect a `AudioNode` → `AudioParam`, use `outputNode.disconnect(inputParam)`   
* **Purpose:** Enables users to route module outputs to module inputs.
* **State:** All active connections are stored globally in React Context.

## Modules to Implement
| React Component | Internal Nodes                             | Purpose                        |
| --------------- | ------------------------------------------ | ------------------------------ |
| Oscillator 1-4  | OscillatorNode + GainNode                  | Tone generation + output level |
| Filter 1-2      | BiquadFilterNode                           | Tone shaping                   |
| LFO 1-2         | OscillatorNode + GainNode                  | Low-freq modulation            |
| Random 1        | AudioWorklet or noise + S&H                | Random modulation              |
| Delay 1         | DelayNode + GainNode feedback loop         | Echo effect                    |
| Amp             | GainNode                                   | Output volume control          |
| AudioOut        | StereoPannerNode + GainNode -> Destination | Mixer master output            |

## Module Parameters to Implement
The following table specifies required module parameters.
Note: _isOutputSource_ refers to whether this specific parameter/node can send signal. _isInputDestination_ refers to whether it can receive signal (modulation).
| Module | Parameter | Value Range | API Interface | isOutputSource | isInputDestination | UI |
|--------|-----------|-------------|---------------|--------------|--------------|--------------|
| Oscillator | Pitch (Hz) | 100–10,000 (integer, log scale) | `OscillatorNode.frequency` | False | True | Slider, Input |
| Oscillator | Shape | Sine, Square, Sawtooth, Triangle | `OscillatorNode.type` | False | False | Select |
| Oscillator | Level | 0–1.0 | `gainNode.gain` | False | True | Slider |
| LFO | Freq (Hz) | 0.1–20 (log scale) | `OscillatorNode.frequency` | False | True | Slider, Input |
| LFO | Shape | Sine, Square, Sawtooth, Triangle | `OscillatorNode.type` | False | False | Select |
| Filter | Cutoff (Hz) | 60–12,000 (integer, log scale) | `BiquadFilterNode.frequency` | False | True | Slider, Input |
| Filter | Resonance (Q) | 0.1–20 (log scale) | `BiquadFilterNode.Q` | False | True | Slider |
| Filter | Type | Lowpass, Bandpass, Highpass | `BiquadFilterNode.type` | False | False | Select |
| Random | Rate (Hz) | 0.1–20 (log scale) | `AudioWorklet` param (Internal Clock Speed) | False | True | Slider |
| Random | Level | 0–1.0 | Output scaling | False | True | Slider |
| Amp | Volume | 0–1.0 | `gainNode.gain` | False | True | Slider |
| Delay | Time | 0–2.0s | `DelayNode.delayTime` | False | True | Slider |
| Delay | Repeats | 0–0.9 | Feedback loop gain | False | True | Slider |
| AudioOut | Stereo Pan | -1 to +1 | `StereoPannerNode.pan` | False | True | Slider |
| AudioOut | Master Volume | 0–1.0 | `gainNode` connected to `audioCtx.destination` | False | False | Slider |

## Module Connection Patch Bay
The user will have the ability to connect/disconnect modules via an interactive **Patch Bay** (List of active connections). A 'Source' Select component will pair with a 'Destination' Select component.

**Sources (Outputs):** _(only AudioNodes can be sources)_
  - Osc 1, Osc 2, Osc 3, Osc 4
  - LFO 1, LFO 2
  - Filter 1, Filter 2
  - Random 1
  - Delay 1
  - Amp

**Destinations (Inputs):** _(can be AudioNodes OR AudioParams)_
- Nodes:
  - Osc 1, Osc 2, Osc 3, Osc 4 (FM input if applicable, or unused)
  - Filter 1, Filter 2
  - Delay 1
  - Amp
  - Audio Out
- Params:
  - Osc [1-4] Pitch, Osc [1-4] Level
  - LFO [1-2] Freq
  - Filter [1-2] Cutoff, Filter [1-2] Res
  - Random Rate, Random Level
  - Delay Time, Delay Repeats
  - Stereo Pan

### Exceptions
  * **Paired Source and Destination values cannot be the same** (eg. Osc 1 → Osc 1). If the user selects a Destination and it matches the Source, display the validation message: _"Source and destination cannot be the same"_. If the user changes the Source or Destination and the values no longer match, remove the validation message.

## Default Routing
These are the default connections that a user will expect to have when the app is launched:
* LFO 1 → Osc 1 Pitch
* Osc 1 → Filter 1
* Osc 2 → Filter 1 
* Filter 1 → Amp
* Amp → Destination (AudioOut)

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

## App Folder Structure 
- /public
  - processors/
    - random-processor.js _// AudioWorklet code_
- /src
  - components/
    - modules/
    - ui/
    - PatchBay.tsx _// UI for 'connections'_
  - context/
    - AudioContextProvider.tsx
  - audio/
    - patching.ts _// connect/disconnect logic_
    - nodes.ts _// node factory utilities_
    - worklets.ts _// worklet loading util_
    - utils.ts
  - styles/
    - tailwind.css
- App.tsx

# ! End of Document