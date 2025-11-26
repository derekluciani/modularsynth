# Preset Management System

## Goal
Implement a scalable system to save, load, import, and export synthesizer patches. This moves away from hard-coded default values and allows users to manage their own presets.

## User Review Required
> [!IMPORTANT]
> **State Management Refactor**: To support saving/loading, each module component must expose its internal state (knob positions, etc.) to the central `AudioContext`. I will update the `AudioModuleRegistryItem` interface and all module components to support `getState()` and `setState()` methods.

## Proposed Changes

### Core Architecture
#### [MODIFY] [types.ts](file:///Users/derekluciani/repo/modularsynth/app/src/audio/types.ts)
- Update `AudioModuleRegistryItem` to include:
    - `getState: () => Record<string, any>`
    - `setState: (state: Record<string, any>) => void`

#### [MODIFY] [useAudioModule.ts](file:///Users/derekluciani/repo/modularsynth/app/src/audio/useAudioModule.ts)
- Update hook to accept `getState` and `setState` functions and pass them to `registerModule`.

### Module Components
Update **ALL** modules (`Oscillator`, `Filter`, `LFO`, `Random`, `Delay`, `Distortion`, `Amp`, `AudioOut`) to:
1.  Define their state shape.
2.  Implement `getState` to return current values.
3.  Implement `setState` to update React state (and thus UI and AudioParams).
4.  Pass these to `useAudioModule`.

### Preset Management Logic
#### [NEW] [PresetManager.tsx](file:///Users/derekluciani/repo/modularsynth/app/src/components/PresetManager.tsx)
- **UI**:
    - "Save Patch" button -> Name Input Dialog.
    - "Load Patch" dropdown menu (LIFO order).
    - "Export Patch" button -> Downloads `patch.json`.
    - "Import Patch" button (File Input) -> Loads patch from file.
- **Logic**:
    - `savePatch`: Iterates `modules` to call `getState()`, collects `connections`, saves to `localStorage`.
    - `loadPatch`: Clears current patch, restores `connections`, iterates `modules` to call `setState()`.
    - `exportPatch`: Serializes current patch to JSON file.
    - `importPatch`: Parses JSON, validates, and calls `loadPatch`. Handles errors as per requirements.

### Application Integration
#### [MODIFY] [App.tsx](file:///Users/derekluciani/repo/modularsynth/app/src/App.tsx)
- Add `<PresetManager />` to the header area.

## Verification Plan

### Manual Verification
1.  **Save/Load**:
    - Modify patch (change knobs, make connections).
    - Save as "Test Preset".
    - Refresh page (or reset).
    - Load "Test Preset".
    - Verify all knobs and connections are restored.
2.  **LIFO Order**:
    - Save "Preset 1", then "Preset 2".
    - Check Load menu: "Preset 2" should be top/first.
3.  **Import/Export**:
    - Export "Test Preset" to file.
    - Reset app.
    - Import file.
    - Verify patch plays immediately and state is correct.
4.  **Error Handling**:
    - Try to import a corrupt JSON file.
    - Verify error message: "The file failed to load..."
5.  **Regression Testing**:
    - Ensure all other app functionality (audio engine, existing controls) is unchanged and works as expected.
