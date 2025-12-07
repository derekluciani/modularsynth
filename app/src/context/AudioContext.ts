import { createContext, useContext } from 'react';
import type { AudioContextType } from '../audio/types';

export const AudioContextReact = createContext<AudioContextType | null>(null);

export const useAudioContext = () => {
    const context = useContext(AudioContextReact);
    if (!context) {
        throw new Error('useAudioContext must be used within an AudioContextProvider');
    }
    return context;
};
