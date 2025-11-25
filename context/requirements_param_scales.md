# **Logarithmic vs. Linear**
- Human perception of pitch _frequency_, _amplitude_, or _time constants_ is _logarithmic_. Example: Going from pitch frequency 100→200 Hz (1 octave) should feel the same as going 1000→2000 Hz.

Apply the scaling function for each module parameter, listed below:

| Module                        | Param                                     | Value Scale         |
| ----------------------------- | ------------------------------------------| ------------------- |
| Oscillator                    | Pitch Freq                                | **Log**             |
| LFO                           | Freq                                      | **Log**             |
| Filter                        | Cutoff Freq                               | **Log**             |
| Filter                        | Q                                         | **Log**             |
| Random                        | Rate Freq                                 | **Log**             | *ASK 
| Distortion                    | ---------                                 | **Log**             | *ASK
| Delay                         | Time (≥1s range)                          | **Log**             |
| Misc                          | Gain, Volume, Level (Amplitude 0.0–1.0)   | **Linear**          |
| Misc                          | Gain (dB)                                 | **Log**          |
| AudioOut                      | Panning                                   | **Linear**          |


<!-- | Delay                    | Time (≤1s range)                          | **Linear**          | -->
<!-- | AudioOut                 | Crossfade                                 | **Linear**          | -->
<!-- | Distortion drive         | Linear                                    | **Linear**          | -->
<!-- | Envelope                 | ADSR                                      | **Log**             | -->
