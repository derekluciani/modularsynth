import React, { useEffect, useRef, useState } from 'react';
import { useAudioContext } from '../../context/AudioContextProvider';
import { useAudioModule } from '../../audio/useAudioModule';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioOutProps {
  id: string;
}

export const AudioOut: React.FC<AudioOutProps> = ({ id }) => {
  const { audioCtx, resumeContext } = useAudioContext();
  const [volume, setVolume] = useState(0.75);
  const [pan, setPan] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const nodesRef = useRef<{ panner: StereoPannerNode; gain: GainNode } | null>(null);

  useEffect(() => {
    if (!audioCtx) return;

    // Create nodes
    const panner = audioCtx.createStereoPanner();
    const gain = audioCtx.createGain();

    // Initial values
    panner.pan.value = pan;
    gain.gain.value = volume;

    // Connect graph: Input -> Panner -> Gain -> Destination
    panner.connect(gain);
    gain.connect(audioCtx.destination);

    nodesRef.current = { panner, gain };

    return () => {
      panner.disconnect();
      gain.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioCtx]);

  // Handle updates
  useEffect(() => {
    if (nodesRef.current) {
      nodesRef.current.panner.pan.setTargetAtTime(pan, audioCtx!.currentTime, 0.01);
    }
  }, [pan, audioCtx]);

  useEffect(() => {
    if (nodesRef.current) {
      const targetVol = isMuted ? 0 : volume;
      nodesRef.current.gain.gain.setTargetAtTime(targetVol, audioCtx!.currentTime, 0.01);
    }
  }, [volume, isMuted, audioCtx]);

  // Register module
  useAudioModule(id, nodesRef.current ? {
    type: 'AudioOut',
    inputs: {
      'input': nodesRef.current.panner
    },
    outputs: {}, // No outputs, it's the final destination
    params: {
      'pan': nodesRef.current.panner.pan
    }
  } : null);

  return (
    <Card className="w-48 bg-zinc-900 border-zinc-800 shadow-lg shadow-black/50">
      <CardHeader className="pb-3 border-b border-zinc-800 bg-zinc-950/50">
        <CardTitle className="text-zinc-100 flex justify-between items-center">
          <span>Master</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-6 w-6 ${isMuted ? 'text-red-500' : 'text-green-500'}`}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Resume Context Button (if suspended) */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={() => resumeContext()}
        >
          Start / Resume
        </Button>

        {/* Volume */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Volume</Label>
            <span>{Math.round(volume * 100)}%</span>
          </div>
          {/* Vertical Slider attempt or just horizontal? Requirements didn't specify orientation, sticking to horizontal for consistency with other modules for now */}
          <Slider 
            value={[volume]} 
            min={0} 
            max={1} 
            step={0.01} 
            onValueChange={(v) => setVolume(v[0])}
            className="[&_.absolute]:bg-blue-500"
          />
        </div>

        {/* Pan */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Pan</Label>
            <span>{pan.toFixed(2)}</span>
          </div>
          <Slider 
            value={[pan]} 
            min={-1} 
            max={1} 
            step={0.1} 
            onValueChange={(v) => setPan(v[0])}
          />
        </div>
      </CardContent>
    </Card>
  );
};
