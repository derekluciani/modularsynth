> START OF MODULE REQUIREMENTS

# Distortion Module

## Overview
The Distortion module applies non-linear distortion to the audio signal using the Web Audio API `WaveshaperNode`. It provides parameters for controlling the distortion amount (curve shape) and input drive, allowing for effects ranging from subtle saturation to aggressive clipping.

## Internal Node Structure
`[Input] -> PreGain (Drive) -> WaveShaperNode (Distortion) -> PostGain (Output Level) -> [Output]`

*   **PreGain (`GainNode`):** Controls the input level feeding the waveshaper. Increasing this "drives" the signal harder against the distortion curve.
*   **WaveShaperNode:** Applies the distortion curve.
*   **PostGain (`GainNode`):** Compensates for volume changes or sets the final output level. (Fixed at 1.0 initially, or exposed if needed. For simplicity, we'll just expose PreGain as 'drive').

## Module Registration
*   **Type:** `'Distortion'` (Need to update `ModuleType` in `types.ts`)
*   **Inputs:** 
    *   `input`: `PreGain` node
*   **Outputs:**
    *   `output`: `PostGain` node
*   **Params:**
    *   `drive`: `PreGain.gain` (Allows modulation of the drive amount)

## Module Registration
| React Component | Internal Nodes                           | Purpose                       |
|-----------------|------------------------------------------|-------------------------------|
| Distortion      | PreGain, WaveShaperNode, PostGain        | Waveform clipping, saturation |

## Parameter Registration
| Module     | Parameter       | Value Range        | Value Default    | Value Type       | API Interface               | isOutputSource   | isInputDestination | UI               |
|------------|-----------------|--------------------|------------------|------------------|-----------------------------|------------------|--------------------|------------------|
| Distortion | Drive           | 0.0 - 5.0          | 1.0              | Float            | `PreGain.gain`              | False            | True               | Slider           |
| Distortion | Amount          | 0 - 100            | 50               | Int              | `WaveShaperNode.curve`      | False            | False              | Slider           |
| Distortion | Oversample      | 'none', '2x', '4x' | '4x'             | String           | `WaveShaperNode.oversample` | False            | False              | Select           |

## Distortion Curve Algorithm
We will use the standard distortion curve algorithm from the Web Audio API documentation:

```javascript
function makeDistortionCurve(amount) {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  
  for (let i = 0; i < n_samples; ++i) {
    const x = i * 2 / n_samples - 1;
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
  }
  return curve;
}
```

## Development Process & Task Checklist
Please implement each task below and mark each one with an '[x]' once they are completed.  
- [ ] Update `ModuleType` in `app/src/audio/types.ts` to include `'Distortion'`
- [ ] Create `app/src/components/modules/Distortion.tsx`
  - Implement `makeDistortionCurve` utility
  - Setup nodes (`Gain`, `WaveShaper`, `Gain`)
  - Use `useAudioModule` hook to register inputs/outputs/params
  - Implement UI with Sliders for Drive/Amount and Select for Oversample
- [ ] Add `Distortion` to `app/src/App.tsx` (e.g., in the Effects row)
- [ ] Verify: Ensure the module is functionally complete and connects with other modules  
- [ ] Verify: Ensure all other module fuctionality is unchanged

> END OF MODULE REQUIREMENTS