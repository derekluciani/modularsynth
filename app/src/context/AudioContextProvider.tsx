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
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
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
  }), [audioContextState, isWorkletLoaded, modules, connections, registerModule, unregisterModule, connect, disconnect, resetConnections, restoreDefaultPatch, resumeContext]);

  return (
    <AudioContextReact.Provider value={value}>
      {children}
    </AudioContextReact.Provider>
  );
};

