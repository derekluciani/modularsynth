import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useMidiLearn } from "../midi/MidiLearnContext";
import { MidiInputs } from "../midi/midi-inputs";
import { targetName, type Target, type TargetId } from "../midi/parameter";
import type { CcSource } from "../midi/cc";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

const focusStyle =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-300";
const buttonStyle = `bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100 ${focusStyle}`;
const selectStyle = `w-full min-w-0 bg-zinc-950 border-zinc-700 text-zinc-100 data-[placeholder]:text-zinc-400 ${focusStyle}`;
const menuStyle =
  "bg-zinc-950 border-zinc-700 text-zinc-100 max-w-(--radix-select-content-available-width)";

const describeSource = ({ channel, cc }: CcSource) => `Channel ${channel}, CC ${cc}`;

function describeInput(state: ReturnType<MidiInputs["getSnapshot"]>) {
  switch (state.kind) {
    case "inactive":
      return "";
    case "requesting":
      return "";
    case "unavailable":
      return "Web MIDI is unavailable. Use a browser that supports Web MIDI on a secure page.";
    case "blocked":
      return "MIDI access was blocked. Check your browser’s site permissions and try Enable MIDI again.";
    case "ready":
      switch (state.selection.kind) {
        case "disconnected":
          return `${state.selection.input.name} disconnected. Assignments are kept. Select an input to continue.${state.inputs.length ? "" : " No MIDI inputs are connected."}`;
        case "selected": {
          const selected = state.selection.input;
          return `Listening to ${state.inputs.find(({ id }) => id === selected.id)?.name ?? selected.name}.`;
        }
        case "none":
          return state.inputs.length
            ? "Select a MIDI input to start."
            : "No MIDI inputs are connected. Connect a controller to continue.";
        default: {
          const exhaustive: never = state.selection;
          return exhaustive;
        }
      }
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}

export function MidiControls({ children }: { children: ReactNode }) {
  const model = useMidiLearn();
  const panelId = useId();
  const inputId = useId();
  const targetId = useId();
  const statusId = useId();
  const headerButton = useRef<HTMLButtonElement>(null);
  const inputTrigger = useRef<HTMLButtonElement>(null);
  const learnButton = useRef<HTMLButtonElement>(null);
  const targetTrigger = useRef<HTMLButtonElement>(null);
  const learnSteps = useRef<HTMLDivElement>(null);
  const selectedInputControls = useRef<HTMLDivElement>(null);
  const dialogInvoker = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [inputs] = useState(
    () => new MidiInputs({ select: model.selectInput, receive: model.receive }),
  );
  const inputState = useSyncExternalStore(inputs.subscribe, inputs.getSnapshot);
  const { targets, assignments, learn, persisted } = useSyncExternalStore(
    model.subscribe,
    model.getSnapshot,
  );
  useEffect(() => {
    // Restore focus before a hardware-driven transition hides a focused control.
    let previous = model.getSnapshot().learn.kind;
    const unsubscribeLearn = model.subscribe(() => {
      const { kind } = model.getSnapshot().learn;
      if (previous === "capture") {
        const focused = document.activeElement;
        if (kind === "learned" && learnSteps.current?.contains(focused))
          learnButton.current?.focus();
        if (kind === "conflict") {
          dialogInvoker.current =
            focused instanceof HTMLElement && !learnSteps.current?.contains(focused)
              ? focused
              : null;
        }
      }
      previous = kind;
    });
    const unsubscribeInputs = inputs.subscribe(() => {
      const state = inputs.getSnapshot();
      if (state.kind !== "ready") return;
      const focused = document.activeElement;
      const removed =
        state.selection.kind === "disconnected" && selectedInputControls.current?.contains(focused);
      if (!state.inputs.length && (removed || focused === inputTrigger.current))
        headerButton.current?.focus();
      else if (removed) inputTrigger.current?.focus();
    });
    return () => {
      unsubscribeLearn();
      unsubscribeInputs();
      inputs.dispose();
    };
  }, [inputs, model]);
  useLayoutEffect(() => {
    if (learn.kind === "choose-target") targetTrigger.current?.focus();
  }, [learn.kind]);

  const ready = inputState.kind === "ready";
  const selected =
    ready && inputState.selection.kind === "selected" ? inputState.selection.input : null;
  const picking =
    learn.kind === "choose-target" || learn.kind === "capture" || learn.kind === "conflict";
  const targetGroups = new Map<string, [Target, ...Target[]]>();
  for (const target of targets) {
    const group = targetGroups.get(target.moduleId);
    if (group) group.push(target);
    else targetGroups.set(target.moduleId, [target]);
  }
  const describeTarget = (id: TargetId) => {
    const target = targets.find((entry) => entry.id === id);
    return target ? targetName(target) : `Unavailable parameter (${id})`;
  };
  const describeAssignment = (assignment: (typeof assignments)[number]) =>
    `${describeSource(assignment)} to ${describeTarget(assignment.target)}`;
  const learnStatus = (() => {
    switch (learn.kind) {
      case "idle":
      case "conflict":
        return ""; // The modal announces its own title and description.
      case "choose-target":
        return "Step 1 of 2: Choose a synth parameter.";
      case "capture":
        return `Step 2 of 2: Move a MIDI knob or fader for ${describeTarget(learn.target)}.`;
      case "learned":
        return `Assigned ${describeAssignment(learn.assignment)}.`;
      case "removed":
        return `Removed assignment for ${describeTarget(learn.assignment.target)}.`;
      case "canceled":
        return "MIDI Learn canceled. Assignments unchanged.";
      default: {
        const exhaustive: never = learn;
        return exhaustive;
      }
    }
  })();
  const inputStatus = describeInput(inputState);
  const storageStatus = persisted
    ? ""
    : "Browser storage is unavailable. MIDI assignments will last for this session only.";

  const closePanel = () => {
    model.cancel();
    setOpen(false);
    headerButton.current?.focus();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <Button
          ref={headerButton}
          type="button"
          variant="outline"
          size="sm"
          className={buttonStyle}
          aria-expanded={open}
          aria-controls={panelId}
          aria-disabled={inputState.kind === "requesting" || undefined}
          onClick={() => {
            if (inputState.kind === "requesting") return;
            if (ready && open) {
              closePanel();
              return;
            }
            setOpen(true);
            if (!ready) void inputs.enable();
          }}
        >
          {ready ? "MIDI" : "Enable MIDI"}
        </Button>
      </div>
      <p role="status" className="sr-only">
        {inputStatus} {open && learnStatus} {open && storageStatus}
      </p>
      <section
        id={panelId}
        hidden={!open}
        className="w-full min-w-0 space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-100 shadow-lg"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">MIDI Learn</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={buttonStyle}
            onClick={closePanel}
          >
            Close<span className="sr-only"> MIDI panel</span>
          </Button>
        </div>
        <p id={statusId} className="wrap-anywhere text-zinc-300">
          {inputState.kind === "requesting" ? "Waiting for MIDI permission…" : inputStatus}
        </p>
        {ready && (
          <div className="grid max-w-md gap-2">
            <Label htmlFor={inputId}>MIDI input</Label>
            <Select
              value={selected?.id ?? ""}
              onValueChange={inputs.select}
              disabled={!inputState.inputs.length}
            >
              <SelectTrigger
                ref={inputTrigger}
                id={inputId}
                aria-describedby={statusId}
                className={selectStyle}
              >
                <SelectValue placeholder="Select an input" />
              </SelectTrigger>
              <SelectContent className={menuStyle} align="start">
                {inputState.inputs.map((input) => (
                  <SelectItem key={input.id} value={input.id} className="wrap-anywhere">
                    {input.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {selected && (
          <div ref={selectedInputControls} className="space-y-4">
            <div className="space-y-2">
              <Button
                ref={learnButton}
                type="button"
                variant="outline"
                size="sm"
                className={buttonStyle}
                aria-disabled={picking || undefined}
                onClick={() => {
                  if (!picking) model.start();
                }}
              >
                Learn<span className="sr-only"> MIDI assignment</span>
              </Button>
              <p className="text-zinc-300">
                {learnStatus ||
                  "Learn or rebind an assignment by choosing a parameter, then moving a MIDI knob or fader."}
              </p>
              <div ref={learnSteps} hidden={!picking} className="max-w-md space-y-2">
                <Label htmlFor={targetId}>Synth parameter</Label>
                <Select
                  value={
                    learn.kind === "capture"
                      ? learn.target
                      : learn.kind === "conflict"
                        ? learn.next.target
                        : ""
                  }
                  onValueChange={model.choose}
                >
                  <SelectTrigger id={targetId} ref={targetTrigger} className={selectStyle}>
                    <SelectValue placeholder="Select a parameter" />
                  </SelectTrigger>
                  <SelectContent className={menuStyle} align="start">
                    {[...targetGroups].map(([moduleId, group]) => (
                      <SelectGroup key={moduleId}>
                        <SelectLabel className="text-zinc-400">{group[0].moduleName}</SelectLabel>
                        {group.map((target) => (
                          <SelectItem key={target.id} value={target.id}>
                            {targetName(target)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={buttonStyle}
                  onClick={() => {
                    learnButton.current?.focus();
                    model.cancel();
                  }}
                >
                  Cancel<span className="sr-only"> MIDI Learn</span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Assignments</h3>
              {storageStatus && <p className="text-zinc-300">{storageStatus}</p>}
              {assignments.length === 0 ? (
                <p className="text-zinc-400">No assignments for this input yet.</p>
              ) : (
                <>
                  <p className="text-zinc-400">
                    Move a mapped control to meet or pass the on-screen position before it takes
                    over.
                  </p>
                  <ul className="divide-y divide-zinc-800">
                    {assignments.map((assignment) => (
                      <li
                        key={assignment.target}
                        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2"
                      >
                        <div className="min-w-0 wrap-anywhere">
                          <p>{describeTarget(assignment.target)}</p>
                          <p className="text-xs text-zinc-400">{describeSource(assignment)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={buttonStyle}
                          onClick={() => {
                            learnButton.current?.focus();
                            model.remove(assignment.target);
                          }}
                        >
                          Remove
                          <span className="sr-only">
                            {" "}
                            assignment for {describeTarget(assignment.target)}
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
      </section>
      <AlertDialog
        open={learn.kind === "conflict"}
        onOpenChange={(next) => {
          if (!next) model.cancel();
        }}
      >
        <AlertDialogContent
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain border-zinc-700 bg-zinc-950 text-zinc-100"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const invoker = dialogInvoker.current;
            dialogInvoker.current = null;
            const fallback =
              learnButton.current ??
              (inputTrigger.current?.disabled ? null : inputTrigger.current) ??
              headerButton.current;
            if (invoker && invoker !== document.body && invoker.isConnected) invoker.focus();
            else fallback?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Replace MIDI assignments?</AlertDialogTitle>
            <AlertDialogDescription className="wrap-anywhere text-zinc-300">
              {learn.kind === "conflict" &&
                `Assign ${describeAssignment(learn.next)}. This replaces: ${learn.replaced.map(describeAssignment).join("; ")}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={buttonStyle}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={`bg-zinc-100 text-zinc-950 hover:bg-zinc-200 ${focusStyle}`}
              onClick={model.confirm}
            >
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
