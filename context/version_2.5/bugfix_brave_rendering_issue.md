> NOTE: This file is a proposal to fix a known issue with Brave Browser. As of 12/7/2025, this has not been implemented and instead has been resolved by the user turning off "Shielding" in the browser.


# Bug Fix: Brave Browser Rendering Issue

## Problem
A rendering bug exists where specific elements (specifically the second item in a container, e.g., LFO 2) fail to render their headers or disappear entirely. This issue is specific to the **Brave Browser** and is caused by "Brave Shields" (ad-blocker) triggering a false positive.

The ad-blocker likely interprets the specific DOM hierarchy (e.g., `Container > Card:nth-child(2) > CardHeader`) as an advertisement or sponsored widget and hides it.

## Proposed Solution
Modify the DOM structure in `app/src/App.tsx` to break the specific CSS selector chain used by the blocklist, without altering the visual layout.

### Implementation Details
Wrap the modules in the affected row (LFOs, Amp, AudioOut) in a `div` with the Tailwind class `contents`.

*   **`display: contents`**: This CSS property makes the wrapper `div` effectively "invisible" to the layout engine. The children (`LFO`, `Amp`, etc.) will continue to participate in the parent's Flexbox layout (`gap`, `wrap`) exactly as they did before.
*   **DOM Structure Change**: This adds an extra layer to the DOM tree, changing the hierarchy from `Container > Card` to `Container > Wrapper > Card`. This structural change is sufficient to bypass the specific ad-blocker rule.

### Code Example (`app/src/App.tsx`)

**Current State:**
```tsx
<div className="flex flex-wrap justify-center gap-2">
  <LFO id="lfo-1" name="LFO 1" />
  <LFO id="lfo-2" name="LFO 2" />
  <LFO id="lfo-3" name="LFO 3" />
  <Amp id="amp" name="Amp" />
  <AudioOut id="speaker" />
</div>
```

**Proposed State:**
```tsx
<div className="flex flex-wrap justify-center gap-2">
  <div className="contents">
    <LFO id="lfo-1" name="LFO 1" />
  </div>
  <div className="contents">
    <LFO id="lfo-2" name="LFO 2" />
  </div>
  <div className="contents">
    <LFO id="lfo-3" name="LFO 3" />
  </div>
  <div className="contents">
    <Amp id="amp" name="Amp" />
  </div>
  <div className="contents">
    <AudioOut id="speaker" />
  </div>
</div>
```

*Note: Wrapping all items individually or wrapping the specific group in `contents` ensures the hierarchy is distinct enough to avoid the false positive.*
