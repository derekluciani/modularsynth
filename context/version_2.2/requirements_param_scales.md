> NOTE: This file was an input for the implementation of app version (v2.2), completed by Gemini3Pro/Antigravity.

# **Logarithmic vs. Linear Param Value Scaling**
- Human perception of pitch _frequency_, _amplitude_, or _time constants_ is _logarithmic_.
    - Example: Going from pitch frequency 100→200 Hz (1 octave) should feel the same as going 1000→2000 Hz
- Linear is simply an amplitude multiplier.

Apply the 'Scale Type' functions for each module param:

| Module                        | Param                                     | Scale Type          |
| ----------------------------- | ------------------------------------------| ------------------- |
| Oscillator                    | Pitch Freq                                | **Log**             |
| Oscillator                    | Level (amplitude gain)                    | **Linear**          |
| LFO                           | Rate Freq                                 | **Log**             |
| Filter                        | Cutoff Freq                               | **Log**             |
| Filter                        | Resonance Q                               | **Log**             |
| Random                        | Rate Freq                                 | **Log**             |
| Random                        | Level (amplitude gain)                    | **Linear**          |
| Distortion                    | Drive (amplitude gain)                    | **Linear**          |
| Distortion                    | Amount (amplitude gain)                   | **Linear**          |
| Delay                         | Time                                      | **Log**             |
| Delay                         | Feedback                                  | **Linear**          |
| Amp                           | Output Gain (amplitude gain)              | **Linear**          |
| AudioOut                      | Panning                                   | **Linear**          |
| AudioOut                      | Master Volume* (dB gain)                  | **Log**             |

* *'Master Volume' new values:
    - min=-60dB
    - max=0dB
    - default=-6dB 
    - step=0.5dB 
