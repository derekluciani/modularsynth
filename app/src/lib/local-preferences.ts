// A blocked localStorage must not prevent optional UI hints or the synth from rendering.
export function getLocalPreference(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setLocalPreference({ key, value }: { key: string; value: string }) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The current session can continue without remembering the preference.
  }
}
