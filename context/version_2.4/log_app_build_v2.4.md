> NOTE: This file is the implementation recap of app version (v2.4), completed by Gemini3Pro/Antigravity.

# Performance Optimization Recap

## Problem
The application was experiencing significant latency when adjusting real-time parameters (e.g., moving sliders). This lag affected both the UI responsiveness and the audio engine's smoothness.

## Investigation
An analysis of the codebase revealed a performance bottleneck in how audio modules communicated with the global `AudioContext`.

1.  **Module Registration**: Each audio module (like `Oscillator`, `Filter`) registers itself with the `AudioContextProvider` using the `useAudioModule` hook.
2.  **Unstable Dependencies**: The `moduleDef` object, which defines the module's inputs, outputs, and state handling, was being memoized with `useMemo`. However, its dependency array included state variables (e.g., `freq`, `cutoff`).
3.  **Re-registration Loop**: Every time a user adjusted a parameter:
    - The component state updated.
    - `moduleDef` was re-created because its dependencies changed.
    - `useAudioModule` detected a new `moduleDef` and triggered a re-registration.
    - `AudioContextProvider` updated its `modules` state, causing the **entire application** to re-render.

## Solution
To fix this, we needed to stabilize `moduleDef` so it wouldn't change on every parameter update, while still allowing `getState` to access the latest values.

We implemented the **Ref Pattern**:
1.  **Refs for State**: We introduced `useRef` hooks to hold the current value of each state variable (e.g., `freqRef`, `cutoffRef`).
2.  **Syncing Refs**: We used `useEffect` to keep these refs in sync with the state.
3.  **Stable `moduleDef`**: We updated `moduleDef.getState` to read from these refs instead of the state variables directly.
4.  **Optimized Memoization**: We removed the state variables from the `useMemo` dependency array.

## Implementation Details
This pattern was applied to all audio modules:
- `Oscillator.tsx`
- `Filter.tsx`
- `Amp.tsx`
- `LFO.tsx`
- `Delay.tsx`
- `Distortion.tsx`
- `AudioOut.tsx`
- `Random.tsx`

### Example Code Change
```tsx
// Before
const moduleDef = useMemo(() => ({
  // ...
  getState: () => ({ freq }), // Depends on 'freq'
}), [freq]); // Re-runs when 'freq' changes

// After
const freqRef = useRef(freq);
useEffect(() => { freqRef.current = freq; }, [freq]);

const moduleDef = useMemo(() => ({
  // ...
  getState: () => ({ freq: freqRef.current }), // Reads from ref
}), []); // No state dependencies, stable across updates
```

## Outcome
The `moduleDef` object is now stable and does not change when parameters are adjusted. This prevents `useAudioModule` from re-registering the module, breaking the chain of global re-renders. The application now handles real-time parameter changes efficiently with no perceptible latency.
