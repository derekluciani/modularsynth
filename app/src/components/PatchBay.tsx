import React, { useState } from "react";
import { useAudioContext } from "../context/AudioContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "./ui/select";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
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

export const PatchBay: React.FC = () => {
  const { modules, connections, connect, disconnect } = useAudioContext();

  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [selectedDestId, setSelectedDestId] = useState<string>("");
  const [selectedDestInput, setSelectedDestInput] = useState<string>("");

  // Alert Dialog State
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertContent, setAlertContent] = useState({
    title: "",
    description: "",
  });
  const [pendingConnection, setPendingConnection] = useState<{
    sourceId: string;
    sourceNode: string;
    destId: string;
    destInput: string;
  } | null>(null);

  // Filtering sources: Only audio nodes (Osc, LFO, etc.) can be sources.
  // Actually, useAudioModule outputs define valid sources.
  const sourceOptions = Object.entries(modules).flatMap(([modId, mod]) =>
    Object.keys(mod.outputs).map((nodeName) => ({
      id: modId,
      node: nodeName,
      label: `${modId}`,
    })),
  );

  // Filtering destinations: Inputs and Params
  const destInputs = Object.entries(modules).flatMap(([modId, mod]) => {
    const paramKeys = new Set(Object.keys(mod.params));
    // Only include inputs that are NOT in params (i.e. pure audio inputs)
    const audioInputs = Object.keys(mod.inputs).filter(
      (k) => !paramKeys.has(k),
    );

    return audioInputs.map((inputName) => ({
      id: modId,
      input: inputName,
      type: "input",
      // If module has only one audio input, use just the module ID as label
      label: audioInputs.length === 1 ? `${modId}` : `${modId} ${inputName}`,
    }));
  });

  const destParams = Object.entries(modules).flatMap(([modId, mod]) =>
    Object.keys(mod.params).map((paramName) => ({
      id: modId,
      input: paramName,
      type: "param",
      label: `${modId} ${paramName}`,
    })),
  );

  const handleConnect = () => {
    if (!selectedSourceId || !selectedDestId || !selectedDestInput) return;

    const [sourceId, sourceNode] = selectedSourceId.split(":");

    // Check for risky connections
    const isOscSource = sourceId.startsWith("osc-");
    const isAmpOrSpeakerDest =
      selectedDestId === "amp" || selectedDestId === "speaker";
    const isAudioInput = destInputs.some(
      (d) => d.id === selectedDestId && d.input === selectedDestInput,
    ); // Ensure it's an audio input, not a param

    const isLfoOrRandomSource =
      sourceId.startsWith("lfo-") || sourceId === "random";
    const isGainParamDest = ["gain", "level", "volume"].includes(
      selectedDestInput,
    );

    if (isOscSource && isAmpOrSpeakerDest && isAudioInput) {
      setAlertContent({
        title: "Warning",
        description:
          "Connecting the raw tone of an Oscillator directly to the Amp or Speaker can result in extreme volume levels. Either turn down the gain/volume levels before connecting the patch or consider adding a Filter module to reduce some of the Oscillator frequencies.",
      });
      setPendingConnection({
        sourceId,
        sourceNode,
        destId: selectedDestId,
        destInput: selectedDestInput,
      });
      setIsAlertOpen(true);
      return;
    }

    if (isLfoOrRandomSource && isGainParamDest) {
      setAlertContent({
        title: "Warning",
        description:
          "Modulation of any Gain/Volume parameter can result in extreme volume levels. Consider turning down the existing levels before connecting the patch.",
      });
      setPendingConnection({
        sourceId,
        sourceNode,
        destId: selectedDestId,
        destInput: selectedDestInput,
      });
      setIsAlertOpen(true);
      return;
    }

    // Safe connection
    connect(sourceId, sourceNode, selectedDestId, selectedDestInput);
    resetSelection();
  };

  const confirmConnection = () => {
    if (pendingConnection) {
      connect(
        pendingConnection.sourceId,
        pendingConnection.sourceNode,
        pendingConnection.destId,
        pendingConnection.destInput,
      );
      setPendingConnection(null);
    }
    setIsAlertOpen(false);
    resetSelection();
  };

  const cancelConnection = () => {
    setPendingConnection(null);
    setIsAlertOpen(false);
  };

  const resetSelection = () => {
    setSelectedSourceId("");
    setSelectedDestId("");
    setSelectedDestInput("");
  };

  const isSelfPatch =
    selectedSourceId &&
    selectedDestId &&
    selectedSourceId.split(":")[0] === selectedDestId;

  return (
    <Card className="grow max-w-2xl bg-zinc-950 border-zinc-800 shadow-lg gap-1">
      <CardHeader className="border-zinc-800 pb-4 gap-0">
        <CardTitle className="text-lg text-zinc-100">Patch Bay</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Connection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-zinc-400 mb-2">
              Source
            </label>
            <Select
              value={selectedSourceId}
              onValueChange={(val) => setSelectedSourceId(val)}
            >
              <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 text-zinc-200">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200 max-h-100">
                {sourceOptions.map((opt) => (
                  <SelectItem
                    key={`${opt.id}:${opt.node}`}
                    value={`${opt.id}:${opt.node}`}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-zinc-400 mb-2">
              Destination
            </label>
            <Select
              value={
                selectedDestId ? `${selectedDestId}:${selectedDestInput}` : ""
              }
              onValueChange={(val) => {
                const [modId, inputName] = val.split(":");
                setSelectedDestId(modId);
                setSelectedDestInput(inputName);
              }}
            >
              <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 text-zinc-200">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200 max-h-100">
                {destInputs.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Module</SelectLabel>
                    {destInputs.map((opt) => (
                      <SelectItem
                        key={`${opt.id}:${opt.input}`}
                        value={`${opt.id}:${opt.input}`}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {destParams.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Parameter</SelectLabel>
                    {destParams.map((opt) => (
                      <SelectItem
                        key={`${opt.id}:${opt.input}`}
                        value={`${opt.id}:${opt.input}`}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleConnect}
            disabled={
              !selectedSourceId || !selectedDestId || (isSelfPatch as boolean)
            }
            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
          >
            Add Patch
          </Button>
        </div>

        {isSelfPatch && (
          <div className="text-red-500 text-xs font-medium">
            Source and destination cannot be the same module.
          </div>
        )}

        {/* Active Connections List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-300">
            Active Connections
          </h3>
          {connections.length === 0 ? (
            <div className="text-zinc-600 text-sm italic py-4 text-center border border-dashed border-zinc-800 rounded">
              No active patches. Connect modules or 'Load' a patch.
            </div>
          ) : (
            <div className="grid gap-2">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-3 rounded bg-zinc-950 border border-zinc-700/50 group transition-colors"
                >
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-zinc-300 font-mono">
                      {conn.sourceModuleId}
                    </span>
                    <span className="text-zinc-500">→</span>
                    <span className="text-zinc-300 font-mono">
                      {conn.destModuleId}
                    </span>
                    <span className="text-zinc-600 text-xs">
                      ({conn.destInputName})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => disconnect(conn.id)}
                    className="h-6 w-6 text-zinc-500 hover:text-red-400 hover:bg-zinc-700/50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {alertContent.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {alertContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={cancelConnection}
              className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmConnection}
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            >
              Add Patch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
