import { useEffect } from 'react';
import { useAudioContext } from '../context/AudioContextProvider';
import type { AudioModuleRegistryItem } from './types';

export const useAudioModule = (
  id: string, 
  definition: Omit<AudioModuleRegistryItem, 'id'> | null
) => {
  const { registerModule, unregisterModule } = useAudioContext();

  useEffect(() => {
    if (!definition) return;

    registerModule(id, {
      id,
      ...definition
    });

    return () => {
      unregisterModule(id);
    };
  }, [id, registerModule, unregisterModule, definition]);
};
