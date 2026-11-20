import { decodeControlChange, MAX_CC_VALUE, sameSource, type InputId } from "./cc";
import { conflictsWith, type Assignment, type createMappingStorage } from "./mapping-storage";
import type { ParameterControl, Target, TargetId } from "./parameter";
import { createSnapshotStore } from "./store";

type LearnState =
  | { kind: "idle" | "choose-target" | "canceled" }
  | { kind: "capture"; target: TargetId }
  | { kind: "conflict"; next: Assignment; replaced: readonly Assignment[] }
  | { kind: "learned" | "removed"; assignment: Assignment };

type LearnSnapshot = {
  targets: readonly Target[];
  assignments: readonly Assignment[];
  learn: LearnState;
  persisted: boolean;
};

type Pickup = { revision: number } & (
  | { kind: "waiting"; position: number }
  | { kind: "following" }
);

export class MidiLearn {
  private input: InputId | null = null;
  private controls = new Map<TargetId, ParameterControl>();
  private pickups = new Map<TargetId, Pickup>();
  private state = createSnapshotStore<LearnSnapshot>({
    targets: [],
    assignments: [],
    learn: { kind: "idle" },
    persisted: true,
  });

  private storage: ReturnType<typeof createMappingStorage>;

  constructor(storage: ReturnType<typeof createMappingStorage>) {
    this.storage = storage;
  }

  getSnapshot = this.state.getSnapshot;
  subscribe = this.state.subscribe;

  private update(changes: Partial<LearnSnapshot>) {
    this.state.publish({ ...this.getSnapshot(), ...changes });
  }

  register(control: ParameterControl) {
    const { id } = control.target;
    this.controls.set(id, control);
    this.update({ targets: [...this.controls.values()].map(({ target }) => target) });
    return () => {
      if (this.controls.get(id) !== control) return;
      this.controls.delete(id);
      this.pickups.delete(id);
      const { learn } = this.getSnapshot();
      if (
        (learn.kind === "capture" && learn.target === id) ||
        (learn.kind === "conflict" && learn.next.target === id)
      )
        this.cancel();
      this.update({ targets: [...this.controls.values()].map(({ target }) => target) });
    };
  }

  selectInput = (input: InputId | null) => {
    this.input = input;
    this.pickups.clear();
    this.update({
      ...(input ? this.storage.read(input) : { assignments: [], persisted: true }),
      learn: { kind: "idle" },
    });
  };

  start = () => {
    if (this.input) this.update({ learn: { kind: "choose-target" } });
  };

  choose = (id: string) => {
    const { learn, targets } = this.getSnapshot();
    const target = targets.find((candidate) => candidate.id === id);
    if (target && (learn.kind === "choose-target" || learn.kind === "capture"))
      this.update({ learn: { kind: "capture", target: target.id } });
  };

  cancel = () => {
    const { kind } = this.getSnapshot().learn;
    if (kind === "choose-target" || kind === "capture" || kind === "conflict") {
      this.update({ learn: { kind: "canceled" } });
    }
  };

  confirm = () => {
    const { learn } = this.getSnapshot();
    if (learn.kind === "conflict") this.assign(learn.next);
  };

  private assign(assignment: Assignment) {
    if (!this.input) return;
    const kept = this.getSnapshot().assignments.filter((existing) => {
      if (!conflictsWith(existing, assignment)) return true;
      this.pickups.delete(existing.target);
      return false;
    });
    this.pickups.delete(assignment.target);
    this.update({
      ...this.storage.write(this.input, [...kept, assignment]),
      learn: { kind: "learned", assignment },
    });
  }

  remove(target: TargetId) {
    const { assignments } = this.getSnapshot();
    const assignment = assignments.find((existing) => existing.target === target);
    if (!this.input || !assignment) return;
    this.pickups.delete(target);
    this.update({
      ...this.storage.write(
        this.input,
        assignments.filter((existing) => existing !== assignment),
      ),
      learn: { kind: "removed", assignment },
    });
  }

  receive = ({ input, data }: { input: InputId; data: unknown }) => {
    if (input !== this.input) return;
    const message = decodeControlChange(data);
    if (!message) return;
    const { assignments, learn } = this.getSnapshot();
    if (learn.kind === "choose-target" || learn.kind === "conflict") return;
    if (learn.kind === "capture") {
      const next = { target: learn.target, channel: message.channel, cc: message.cc };
      const replaced = assignments.filter(
        (existing) =>
          conflictsWith(existing, next) &&
          (existing.target !== next.target || !sameSource(existing, next)),
      );
      if (replaced.length) this.update({ learn: { kind: "conflict", next, replaced } });
      else this.assign(next);
      return; // Never apply the CC that identified the source.
    }

    const assignment = assignments.find((existing) => sameSource(existing, message));
    if (!assignment) return;
    const control = this.controls.get(assignment.target);
    if (!control) return;

    const revision = control.getRevision();
    const last = this.pickups.get(assignment.target);
    const previous = last?.revision === revision ? last : undefined;
    const position = message.value / MAX_CC_VALUE;
    const target = control.getPosition();
    const close = Math.abs(position - target) <= 1 / MAX_CC_VALUE + Number.EPSILON;
    const crossed =
      previous?.kind === "waiting" && (previous.position - target) * (position - target) <= 0;
    if (previous?.kind === "following" || close || crossed) {
      this.pickups.set(assignment.target, { revision, kind: "following" });
      control.setFromMidi(position);
    } else {
      this.pickups.set(assignment.target, { revision, kind: "waiting", position });
    }
  };
}
