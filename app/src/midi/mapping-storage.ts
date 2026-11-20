import { isControlNumber, isMidiChannel, sameSource, type CcSource, type InputId } from "./cc";
import { isTargetId, type TargetId } from "./parameter";

export type Assignment = CcSource & { target: TargetId };
type DeviceMappings = { assignments: readonly Assignment[]; persisted: boolean };

export const conflictsWith = (existing: Assignment, next: Assignment) =>
  existing.target === next.target || sameSource(existing, next);

function parseAssignments(json: string | null): Assignment[] {
  const stored: unknown = json === null ? [] : JSON.parse(json);
  if (!Array.isArray(stored)) return [];

  const parsed: Assignment[] = [];
  for (const row of stored) {
    const input: unknown = row;
    if (
      typeof input !== "object" ||
      input === null ||
      !("target" in input) ||
      !("channel" in input) ||
      !("cc" in input)
    )
      continue;
    const { target, channel, cc } = input;
    if (!isTargetId(target) || !isMidiChannel(channel) || !isControlNumber(cc)) continue;
    const assignment = { target, channel, cc };
    if (!parsed.some((existing) => conflictsWith(existing, assignment))) parsed.push(assignment);
  }
  return parsed;
}

// Each input gets its own key. A session cache preserves edits when local storage is unavailable.
export function createMappingStorage(getStorage: () => Pick<Storage, "getItem" | "setItem">) {
  const cache = new Map<InputId, DeviceMappings>();
  const key = (id: InputId) => `modular-synth.midi.v1:${id}`;
  return {
    read(id: InputId): DeviceMappings {
      const cached = cache.get(id);
      if (cached) return cached;
      let data: DeviceMappings;
      try {
        const json = getStorage().getItem(key(id));
        let assignments: Assignment[];
        try {
          assignments = parseAssignments(json);
        } catch {
          assignments = [];
        }
        data = { assignments, persisted: true };
      } catch {
        data = { assignments: [], persisted: false };
      }
      cache.set(id, data);
      return data;
    },
    write(id: InputId, assignments: readonly Assignment[]): DeviceMappings {
      let persisted = false;
      try {
        getStorage().setItem(key(id), JSON.stringify(assignments));
        persisted = true;
      } catch {
        // In-memory assignments still work for the rest of the session.
      }
      const data = { assignments, persisted };
      cache.set(id, data);
      return data;
    },
  };
}
