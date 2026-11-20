import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import type {
  AudioContextType,
  AudioModuleRegistryItem,
  Connection,
  Patch,
  SerializedConnection,
} from "../audio/types";
import { createPatchConnections } from "../audio/patching";
import { DEFAULT_PATCH } from "../audio/defaultPatch";
import { AudioContextReact } from "./AudioContext";

interface AudioContextProviderProps {
  children: ReactNode;
}

export const AudioContextProvider: React.FC<AudioContextProviderProps> = ({ children }) => {
  const [audioGraph, setAudioGraph] = useState<{
    audioCtx: AudioContext;
    analyserNode: AnalyserNode;
  } | null>(null);
  const audioCtx = audioGraph?.audioCtx ?? null;
  const analyserNode = audioGraph?.analyserNode ?? null;
  const [isWorkletLoaded, setIsWorkletLoaded] = useState(false);
  const [modules, setModules] = useState<Record<string, AudioModuleRegistryItem>>({});
  const modulesRef = useRef(modules);
  // Own live cables separately from the connection snapshot rendered by React.
  const [patchConnections] = useState(createPatchConnections);
  const [connections, setConnections] = useState<Connection[]>([]);
  const pendingPatchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.connect(ctx.destination);

    // oxlint-disable-next-line react/set-state-in-effect -- Publish the external audio graph created on mount without waiting for the worklet.
    setAudioGraph({ audioCtx: ctx, analyserNode: analyser });

    let disposed = false;
    const loadWorklet = async () => {
      try {
        await ctx.audioWorklet.addModule("/processors/random-processor.js");
        if (!disposed) setIsWorkletLoaded(true);
      } catch (error) {
        if (!disposed) console.error("Failed to load AudioWorklet:", error);
      }
    };
    void loadWorklet();

    return () => {
      disposed = true;
      clearTimeout(pendingPatchRef.current);
      patchConnections.clear();
      void ctx.close().catch((error) => console.error("Failed to close AudioContext:", error));
    };
  }, [patchConnections]);

  const resumeContext = useCallback(async () => {
    if (audioCtx && audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
  }, [audioCtx]);

  const registerModule = useCallback((id: string, data: AudioModuleRegistryItem) => {
    modulesRef.current = { ...modulesRef.current, [id]: data };
    setModules(modulesRef.current);
  }, []);

  const unregisterModule = useCallback(
    (id: string) => {
      const next = { ...modulesRef.current };
      delete next[id];
      modulesRef.current = next;
      setModules(next);
      if (patchConnections.removeModule(id)) {
        setConnections(patchConnections.getConnections());
      }
    },
    [patchConnections],
  );

  const connectCable = useCallback(
    ({ sourceId, sourceNode, destId, destInput }: SerializedConnection) => {
      const sourceModule = modulesRef.current[sourceId];
      const destModule = modulesRef.current[destId];
      if (!sourceModule || !destModule) return false;

      return patchConnections.connect({
        sourceModule,
        sourceNodeName: sourceNode,
        destModule,
        destInputName: destInput,
      });
    },
    [patchConnections],
  );

  const connect = useCallback(
    (sourceId: string, sourceNode: string, destId: string, destInput: string) => {
      if (connectCable({ sourceId, sourceNode, destId, destInput })) {
        setConnections(patchConnections.getConnections());
      }
    },
    [connectCable, patchConnections],
  );

  const disconnect = useCallback(
    (connectionId: string) => {
      if (patchConnections.disconnect(connectionId)) {
        setConnections(patchConnections.getConnections());
      }
    },
    [patchConnections],
  );

  const resetConnections = useCallback(() => {
    clearTimeout(pendingPatchRef.current);
    pendingPatchRef.current = undefined;
    patchConnections.clear();
    setConnections([]);
  }, [patchConnections]);

  const loadPatch = useCallback(
    (patch: Patch) => {
      resetConnections();

      for (const [id, state] of Object.entries(patch.modules ?? {})) {
        modulesRef.current[id]?.setState?.(state);
      }

      // Preserve the delay for module parameters to update before restoring cables.
      pendingPatchRef.current = setTimeout(() => {
        pendingPatchRef.current = undefined;
        patch.connections?.forEach(connectCable);
        setConnections(patchConnections.getConnections());
      }, 50);
    },
    [connectCable, patchConnections, resetConnections],
  );

  const restoreDefaultPatch = useCallback(() => {
    loadPatch(DEFAULT_PATCH);
  }, [loadPatch]);

  // Load the default patch after the initial module registrations settle.
  useEffect(() => {
    if (!hasInitializedRef.current) {
      const timer = setTimeout(() => {
        restoreDefaultPatch();
        hasInitializedRef.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [modules, restoreDefaultPatch]);

  const value: AudioContextType = useMemo(
    () => ({
      audioCtx,
      analyserNode,
      isWorkletLoaded,
      modules,
      connections,
      registerModule,
      unregisterModule,
      connect,
      disconnect,
      resetConnections,
      restoreDefaultPatch,
      resumeContext,
      loadPatch,
    }),
    [
      audioCtx,
      analyserNode,
      isWorkletLoaded,
      modules,
      connections,
      registerModule,
      unregisterModule,
      connect,
      disconnect,
      resetConnections,
      restoreDefaultPatch,
      resumeContext,
      loadPatch,
    ],
  );

  return <AudioContextReact.Provider value={value}>{children}</AudioContextReact.Provider>;
};
