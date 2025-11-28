# Feature Request 

## Problem 
* The number of options listed in the existing 'Destination' Select UI is unecessarily long and repeditive.

## Goal  
* Reduce the number of options and length of concatenated strings.

## Requirements
* Import the 'SelectGroup' UI component as a way to organize the options into two groups: Inputs, Params. See code snippet examples below that illustrate the difference between current state and proposed state.

### Current state:
```tsx
const inputs = Object.keys(mod.inputs).map(inputName => ({
  id: modId,
  input: inputName,
  type: 'input',
  label: `${modId} > ${inputName} (Input)`
}));
const params = Object.keys(mod.params).map(paramName => ({
  id: modId,
  input: paramName,
  type: 'param',
  label: `${modId} > ${paramName} (Param)`
}));
```
```tsx
<SelectContent> // Note: this block is pseudocode
  {destOptions
    <SelectItem>
      {opt.label}
    </SelectItem>
  }
</SelectContent>
```

Example `SelectContent` Groupings:
  - lfo-1 > frequency (Input)
  - ...
  - master > pan (Param)

### Proposed state:
  ```tsx
  const inputs = Object.keys(mod.inputs).map(inputName => ({
    id: modId,
    input: inputName,
    type: 'input',
    label: `${modId}` // ${inputName} (Input) are not shown.
  }));
  const params = Object.keys(mod.params).map(paramName => ({
    id: modId,
    input: paramName,
    type: 'param',
    label: `${modId} ${paramName}` // (Param) is not shown.
  }));
  ```
  ```tsx
  <SelectContent> // Note: this block is pseudocode
    <SelectGroup>
      <SelectLabel>Inputs</SelectLabel>
        {destOptions
          <SelectItem>
            {opt.label}
          </SelectItem>
        }
    </SelectGroup>
  </SelectContent>
  ```
Example `SelectContent` Groupings:
  - Inputs
    - lfo-1
    - ...
    - master
  - Params
    - lfo-1 frequency
    - ...
    - master pan

> ! END OF DOCUMENT