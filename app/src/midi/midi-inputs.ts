import { isInputId, type InputId } from "./cc";
import { createSnapshotStore } from "./store";

type Input = { id: InputId; name: string };
type Selection = { kind: "none" } | { kind: "selected" | "disconnected"; input: Input };
type InputState =
  | { kind: "inactive" | "requesting" | "unavailable" | "blocked" }
  | { kind: "ready"; inputs: readonly Input[]; selection: Selection };

type Access = Pick<MIDIAccess, "addEventListener" | "removeEventListener" | "inputs">;

type InputCallbacks = {
  select: (id: InputId | null) => void;
  receive: (message: { input: InputId; data: unknown }) => void;
};

export class MidiInputs {
  private state = createSnapshotStore<InputState>({ kind: "inactive" });
  private access: Access | null = null;
  private request: symbol | null = null;
  private active: { port: MIDIInput; handler: MIDIInput["onmidimessage"] } | null = null;

  private callbacks: InputCallbacks;

  constructor(callbacks: InputCallbacks) {
    this.callbacks = callbacks;
  }

  getSnapshot = this.state.getSnapshot;
  subscribe = this.state.subscribe;

  async enable() {
    if (this.access || this.request) return;
    if (globalThis.isSecureContext === false || typeof navigator.requestMIDIAccess !== "function") {
      this.state.publish({ kind: "unavailable" });
      return;
    }

    const request = Symbol();
    this.request = request;
    this.state.publish({ kind: "requesting" });
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      if (this.request !== request) return;
      this.access = access;
      access.addEventListener("statechange", this.refresh);
      this.refresh();
    } catch {
      if (this.request === request) {
        this.access?.removeEventListener("statechange", this.refresh);
        this.access = null;
        this.state.publish({ kind: "blocked" });
      }
    } finally {
      if (this.request === request) this.request = null;
    }
  }

  private detach() {
    const connection = this.active;
    this.active = null;
    if (!connection) return;
    const { port, handler } = connection;
    if (port.onmidimessage === handler) port.onmidimessage = null;
    void port.close().catch(() => {
      /* The port may already have been unplugged. */
    });
  }

  private refresh = () => {
    if (!this.access) return;
    const connected: Input[] = [];
    const previous = this.getSnapshot();
    const current = this.active?.port;
    let stillConnected = false;
    this.access.inputs.forEach((port) => {
      if (port.state !== "connected" || !isInputId(port.id)) return;
      connected.push({ id: port.id, name: port.name?.trim() || "Unnamed MIDI input" });
      if (port === current) stillConnected = true;
    });

    // Distinguish identical devices in the selector without exposing browser-generated IDs.
    const inputs = connected.map((input) => {
      const matches = connected.filter(({ name }) => name === input.name);
      return matches.length < 2
        ? input
        : { ...input, name: `${input.name} (${matches.indexOf(input) + 1})` };
    });
    let selection: Selection = previous.kind === "ready" ? previous.selection : { kind: "none" };
    if (current && !stillConnected && selection.kind === "selected") {
      this.detach();
      this.callbacks.select(null);
      selection = { kind: "disconnected", input: selection.input };
    }
    if (
      previous.kind === "ready" &&
      selection === previous.selection &&
      inputs.length === previous.inputs.length &&
      inputs.every(
        (input, index) =>
          input.id === previous.inputs[index].id && input.name === previous.inputs[index].name,
      )
    )
      return;
    this.state.publish({ kind: "ready", inputs, selection });
  };

  select = (id: string) => {
    const state = this.getSnapshot();
    if (state.kind !== "ready" || !this.access) return;
    const input = state.inputs.find((candidate) => candidate.id === id);
    const port = input && this.access.inputs.get(input.id);
    if (!input || !port || port.state !== "connected" || this.active?.port === port) return;

    this.detach();
    const handler = (event: MIDIMessageEvent) => {
      if (this.active?.handler === handler && port.state === "connected") {
        this.callbacks.receive({ input: input.id, data: event.data });
      }
    };
    this.active = { port, handler };
    this.callbacks.select(input.id);
    this.state.publish({ ...state, selection: { kind: "selected", input } });
    port.onmidimessage = handler; // Web MIDI opens the input implicitly when setting this handler.
  };

  dispose = () => {
    this.request = null;
    this.access?.removeEventListener("statechange", this.refresh);
    this.access = null;
    this.detach();
    this.callbacks.select(null);
    if (this.getSnapshot().kind !== "inactive") this.state.publish({ kind: "inactive" });
  };
}
