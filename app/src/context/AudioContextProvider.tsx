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
  const [modules, setModules] = useState<Record<string, AudioModuleRegistryItem>>({});
  const [connections, setConnections] = useState<Connection[]>([]);

  // Initialize AudioContext on first interaction or mount (but usually strict autoplay rules require user interaction)
  // We'll initialize it on mount but it will be suspended.
  useEffect(() => {
    if (!audioCtxRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

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

  const value: AudioContextType = useMemo(() => ({
    audioCtx: audioCtxRef.current,
    isWorkletLoaded,
    modules,
    connections,
    registerModule,
    unregisterModule,
    connect,
    disconnect,
    resetConnections,
    resumeContext
  }), [isWorkletLoaded, modules, connections, registerModule, unregisterModule, connect, disconnect, resetConnections, resumeContext]);

  return (
    <AudioContextReact.Provider value={value}>
      {children}
    </AudioContextReact.Provider>
  );
};
