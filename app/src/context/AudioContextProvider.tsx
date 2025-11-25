import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { AudioContextType, AudioModuleRegistryItem, Connection } from '../audio/types';
import { makeConnection, breakConnection } from '../audio/patching';

const AudioContextReact = createContext<AudioContextType | null>(null);

export const useAudioContext = () => {
  const context = useContext(AudioContextReact);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioContextProvider');
  }
  return context;
};

interface AudioContextProviderProps {
  children: ReactNode;
}

export const AudioContextProvider: React.FC<AudioContextProviderProps> = ({ children }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isWorkletLoaded, setIsWorkletLoaded] = useState(false);
  const [modules, setModules] = useState<Record<string, AudioModuleRegistryItem>>({});
  const [connections, setConnections] = useState<Connection[]>([]);

  // Initialize AudioContext on first interaction or mount (but usually strict autoplay rules require user interaction)
  // We'll initialize it on mount but it will be suspended.
  useEffect(() => {
    if (!audioCtxRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Create global analyser node
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;

      // Load AudioWorklet
      const loadWorklet = async () => {
        try {
          await ctx.audioWorklet.addModule('/processors/random-processor.js');
          console.log('AudioWorklet loaded');
          setIsWorkletLoaded(true);
        } catch (error) {
          console.error('Failed to load AudioWorklet:', error);
        }
      };
      loadWorklet();
    }

    return () => {
      // In development (Strict Mode), this runs on immediate unmount, closing the context.
      // We should probably not close it here to avoid issues with hot reload / strict mode.
      // audioCtxRef.current?.close();
      // audioCtxRef.current = null;
    };
  }, []);

  const resumeContext = useCallback(async () => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
  }, []);

  const registerModule = useCallback((id: string, data: AudioModuleRegistryItem) => {
    setModules(prev => ({
      ...prev,
      [id]: data
    }));
  }, []);

  const unregisterModule = useCallback((id: string) => {
    setModules(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const connect = useCallback((sourceId: string, sourceNode: string, destId: string, destInput: string) => {
    const sourceModule = modules[sourceId];
    const destModule = modules[destId];

    if (!sourceModule || !destModule) {
      console.error('Cannot connect: module not found', { sourceId, destId });
      return;
    }

    // Determine if destination is param or node
    const isParam = !!destModule.params[destInput];
    // If not param, check inputs
    if (!isParam && !destModule.inputs[destInput]) {
      console.error(`Destination input '${destInput}' not found on module '${destId}'`);
      return;
    }

    const success = makeConnection(sourceModule, sourceNode, destModule, destInput, isParam);

    if (success) {
      const newConnection: Connection = {
        id: `${sourceId}-${sourceNode}-${destId}-${destInput}`,
        sourceModuleId: sourceId,
        sourceNodeName: sourceNode,
        destModuleId: destId,
        destInputName: destInput,
        isParam
      };
      setConnections(prev => [...prev, newConnection]);
    }
  }, [modules]);

  const disconnect = useCallback((connectionId: string) => {
    // finding the connection in the current state
    // but we need to break it using the current modules
    setConnections(prev => {
      const conn = prev.find(c => c.id === connectionId);
      if (!conn) return prev;

      const sourceModule = modules[conn.sourceModuleId];
      const destModule = modules[conn.destModuleId];

      if (sourceModule && destModule) {
        breakConnection(sourceModule, conn.sourceNodeName, destModule, conn.destInputName, conn.isParam);
      }

      return prev.filter(c => c.id !== connectionId);
    });
  }, [modules]);

  const resetConnections = useCallback(() => {
    setConnections(prev => {
      prev.forEach(c => {
        const sourceModule = modules[c.sourceModuleId];
        const destModule = modules[c.destModuleId];
        if (sourceModule && destModule) {
          breakConnection(sourceModule, c.sourceNodeName, destModule, c.destInputName, c.isParam);
        }
      });
      return [];
    });
  }, [modules]);

  const restoreDefaultPatch = useCallback(() => {
    // First reset existing connections
    resetConnections();

    // Wait a tick to ensure state update? 
    // Actually, since setConnections is async, we should probably chain this or just do it directly.
    // But we can't easily chain state updates like that without effects.
    // However, we can just calculate the new connections and set them.
    // But we also need to make the physical audio connections.

    // Let's define the default patch
    // * LFO 1 → Osc 1 Pitch
    // * Osc 1 → Filter 1
    // * Osc 2 → Filter 1 
    // * Filter 1 → Amp
    // * Amp → Destination (AudioOut)

    const defaults = [
      { sourceId: 'lfo-1', sourceNode: 'output', destId: 'osc-1', destInput: 'pitch' },
      { sourceId: 'osc-1', sourceNode: 'output', destId: 'filter-1', destInput: 'input' },
      { sourceId: 'osc-2', sourceNode: 'output', destId: 'filter-1', destInput: 'input' },
      { sourceId: 'filter-1', sourceNode: 'output', destId: 'amp-1', destInput: 'input' },
      { sourceId: 'amp-1', sourceNode: 'output', destId: 'master', destInput: 'input' }
    ];

    // We need to wait for resetConnections to clear the physical connections?
    // resetConnections iterates over 'connections' state.
    // If we call connect() immediately, it might conflict if we don't clear first.
    // But 'connect' uses 'modules' state, which is stable.
    // The issue is 'connections' state.

    // Let's do it in a timeout to allow the reset to propagate? 
    // Or better, just manually break everything and then make new ones in one go.

    // 1. Break all current connections
    connections.forEach(c => {
      const sourceModule = modules[c.sourceModuleId];
      const destModule = modules[c.destModuleId];
      if (sourceModule && destModule) {
        breakConnection(sourceModule, c.sourceNodeName, destModule, c.destInputName, c.isParam);
      }
    });

    // 2. Make new connections
    const newConnections: Connection[] = [];

    defaults.forEach(d => {
      const sourceModule = modules[d.sourceId];
      const destModule = modules[d.destId];

      if (sourceModule && destModule) {
        // Check if param or node
        const isParam = !!destModule.params[d.destInput];

        const success = makeConnection(sourceModule, d.sourceNode, destModule, d.destInput, isParam);

        if (success) {
          newConnections.push({
            id: `${d.sourceId}-${d.sourceNode}-${d.destId}-${d.destInput}`,
            sourceModuleId: d.sourceId,
            sourceNodeName: d.sourceNode,
            destModuleId: d.destId,
            destInputName: d.destInput,
            isParam
          });
        }
      } else {
        console.warn(`Could not make default connection: ${d.sourceId} -> ${d.destId} (Module not found)`);
      }
    });

    setConnections(newConnections);

  }, [connections, modules]);

  const value: AudioContextType = useMemo(() => ({
    audioCtx: audioCtxRef.current,
    analyserNode: analyserRef.current,
    isWorkletLoaded,
    modules,
    connections,
    registerModule,
    unregisterModule,
    connect,
    disconnect,
    resetConnections,
    restoreDefaultPatch,
    resumeContext
  }), [isWorkletLoaded, modules, connections, registerModule, unregisterModule, connect, disconnect, resetConnections, restoreDefaultPatch, resumeContext]);

  return (
    <AudioContextReact.Provider value={value}>
      {children}
    </AudioContextReact.Provider>
  );
};
