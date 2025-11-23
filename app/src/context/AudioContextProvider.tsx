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
  const [isWorkletLoaded, setIsWorkletLoaded] = useState(false);
  const [audioContextState, setAudioContextState] = useState<AudioContextState>('suspended');
  const [modules, setModules] = useState<Record<string, AudioModuleRegistryItem>>({});
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isDefaultPatchApplied, setIsDefaultPatchApplied] = useState(false);

  // Initialize AudioContext on first interaction or mount
  useEffect(() => {
    if (!audioCtxRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      setAudioContextState(ctx.state);

      ctx.onstatechange = () => {
        setAudioContextState(ctx.state);
      };

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

  const connect = useCallback((sourceId: string, sourceNodeName: string, destId:string, destInputName: string) => {
    const sourceModule = modules[sourceId];
    const destModule = modules[destId];

    if (!sourceModule || !destModule) {
      console.warn(`Cannot connect: module not found. Source: ${sourceId} (${!!sourceModule}), Dest: ${destId} (${!!destModule})`);
      return;
    }

    console.log(`Connecting ${sourceId}:${sourceNodeName} -> ${destId}:${destInputName}`);

    const isParam = !!destModule.params[destInputName];
    if (!isParam && !destModule.inputs[destInputName]) {
      console.error(`Destination input '${destInputName}' not found on module '${destId}'`);
      return;
    }

    const success = makeConnection(sourceModule, sourceNodeName, destModule, destInputName, isParam);

    if (success) {
      const newConnection: Connection = {
        id: `${sourceId}-${sourceNodeName}-${destId}-${destInputName}`,
        sourceModuleId: sourceId,
        sourceNodeName: sourceNodeName,
        destModuleId: destId,
        destInputName: destInputName,
        isParam
      };
      setConnections(prev => [...prev, newConnection]);
    }
  }, [modules]);

  const disconnect = useCallback((connectionId: string) => {
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
<<<<<<< HEAD
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
=======
    resetConnections();
    connect('lfo1', 'output', 'osc1', 'pitch');
    connect('osc1', 'output', 'filter1', 'input');
    connect('osc2', 'output', 'filter1', 'input');
    connect('filter1', 'output', 'amp1', 'input');
    connect('amp1', 'output', 'master', 'input');
  }, [connect, resetConnections]);

  useEffect(() => {
    if (isDefaultPatchApplied) {
      return;
    }
    const requiredModules = ['lfo1', 'osc1', 'osc2', 'filter1', 'amp1', 'master'];
    const allModulesRegistered = requiredModules.every(id => !!modules[id]);

    if (allModulesRegistered) {
      restoreDefaultPatch();
      setIsDefaultPatchApplied(true);
    }
  }, [modules, isDefaultPatchApplied, restoreDefaultPatch]);
>>>>>>> main

  const value: AudioContextType = useMemo(() => ({
    audioCtx: audioCtxRef.current,
    audioContextState,
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
<<<<<<< HEAD
  }), [isWorkletLoaded, modules, connections, registerModule, unregisterModule, connect, disconnect, resetConnections, restoreDefaultPatch, resumeContext]);
=======
  }), [audioContextState, isWorkletLoaded, modules, connections, registerModule, unregisterModule, connect, disconnect, resetConnections, restoreDefaultPatch, resumeContext]);
>>>>>>> main

  return (
    <AudioContextReact.Provider value={value}>
      {children}
    </AudioContextReact.Provider>
  );
};

