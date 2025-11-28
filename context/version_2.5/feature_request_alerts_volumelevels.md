# Feature Request 

## Problem 
* Some source > dest connections can result in extreme volume level spikes that can cause potential hearing and/or speaker damage.

## Goal  
- Warn the user about the concerns when they make specific **Patch Bay** source > destination connections.

## Requirements
### Condition 1
If the user selects:
  - Source = 'osc-[n]' and Destination = 'amp' or 'speaker'

Then `trigger` the display of `AlertDialog` component with content:
  - `AlertDialogTitle`: Warning
  - `AlertDialogDescription`: Connecting the raw tone of an Oscillator directly to the Amp or Speaker can result in extreme volume levels. Either turn down the gain/volume levels before connecting the patch or consider adding a Filter module to reduce some of the Oscillator frequencies.
  - `AlertDialogCancel`: Cancel
  - `AlertDialogAction`: Add patch 

### Condition 2
If the user selects:
  - Source = 'lfo-[n]' or 'random' and Destination = 'any `gain` parameter'

Then `trigger` the display of `AlertDialog` component with content:
  - `AlertDialogTitle`: Warning
  - `AlertDialogDescription`: Modulation of any Gain/Volume parameter can result in extreme volume levels. Consider turning down the existing levels before connecting the patch.
  - `AlertDialogCancel`: Cancel
  - `AlertDialogAction`: Add patch 

> ! END OF DOCUMENT