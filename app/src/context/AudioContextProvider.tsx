import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { AudioContextType, AudioModuleRegistryItem, Connection, Patch } from '../audio/types';
import { makeConnection, breakConnection } from '../audio/patching';
import { DEFAULT_PATCH } from '../audio/defaultPatch';
import { AudioContextReact } from './AudioContext';

interface AudioContextProviderProps {
  children: ReactNode;
}

export const AudioContextProvider: React.FC<AudioContextProviderProps> = ({ children }) => {
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [isWorkletLoaded, setIsWorkletLoaded] = useState(false);
  const [modules, setModules] = useState<Record<string, AudioModuleRegistryItem>>({});
  const [connections, setConnections] = useState<Connection[]>([]);
  const hasInitializedRef = useRef(false);

  // Initialize AudioContext on first interaction or mount
  useEffect(() => {
    if (!audioCtx) {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      setAudioCtx(ctx);

      // Create global analyser node
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.connect(ctx.destination);
      setAnalyserNode(analyser);

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
      // Cleanup if necessary
    };
  }, [audioCtx]);

  const resumeContext = useCallback(async () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
  }, [audioCtx]);

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

  const loadPatch = useCallback((patch: Patch) => {
    // 1. Reset connections
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

    // 2. Restore module states
    if (patch.modules) {
      Object.entries(patch.modules).forEach(([id, state]) => {
        const mod = modules[id];
        if (mod && mod.setState) {
          mod.setState(state);
        }
      });
    }

    // 3. Restore connections
    setTimeout(() => {
      const newConnections: Connection[] = [];

      if (patch.connections) {
        patch.connections.forEach(c => {
          const sourceModule = modules[c.sourceId];
          const destModule = modules[c.destId];

          if (sourceModule && destModule) {
            const isParam = !!destModule.params[c.destInput];
            const success = makeConnection(sourceModule, c.sourceNode, destModule, c.destInput, isParam);

            if (success) {
              newConnections.push({
                id: `${c.sourceId}-${c.sourceNode}-${c.destId}-${c.destInput}`,
                sourceModuleId: c.sourceId,
                sourceNodeName: c.sourceNode,
                destModuleId: c.destId,
                destInputName: c.destInput,
                isParam
              });
            }
          }
        });
      }
      setConnections(newConnections);
    }, 50);
  }, [modules]);

  const restoreDefaultPatch = useCallback(() => {
    loadPatch(DEFAULT_PATCH);
  }, [loadPatch]);

  // Load default patch on mount
  useEffect(() => {
    if (!hasInitializedRef.current) {
      const timer = setTimeout(() => {
        restoreDefaultPatch();
        hasInitializedRef.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [restoreDefaultPatch]);

  const value: AudioContextType = useMemo(() => ({
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
    loadPatch
  }), [audioCtx, analyserNode, isWorkletLoaded, modules, connections, registerModule, unregisterModule, connect, disconnect, resetConnections, restoreDefaultPatch, resumeContext, loadPatch]);

  return (
    <AudioContextReact.Provider value={value}>
      {children}
    </AudioContextReact.Provider>
  );
};
