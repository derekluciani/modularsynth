import React, { useEffect, useRef, useState, useMemo } from 'react';
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

  const [nodes, setNodes] = useState<{ panner: StereoPannerNode; gain: GainNode } | null>(null);
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
    // Connect graph: Input -> Panner -> Gain -> Destination
    panner.connect(gain);
    gain.connect(audioCtx.destination);

    nodesRef.current = { panner, gain };
    setNodes({ panner, gain });

    return () => {
      // Do NOT close the context here, it is shared!
      // audioCtxRef.current?.close();

      if (nodesRef.current) {
        nodesRef.current.gain.disconnect(); // Corrected from outputGain to gain
        nodesRef.current.panner.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioCtx]);

  // Handle updates
  useEffect(() => {
    if (nodes && audioCtx) {
      nodes.panner.pan.setTargetAtTime(pan, audioCtx.currentTime, 0.01);
    }
  }, [pan, audioCtx, nodes]);

  useEffect(() => {
    if (nodes && audioCtx) {
      const targetVol = isMuted ? 0 : volume;
      nodes.gain.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.01);
    }
  }, [volume, isMuted, audioCtx, nodes]);

  // Memoize module definition
  const moduleDef = useMemo(() => nodes ? {
    type: 'AudioOut' as const,
    inputs: {
      'input': nodes.panner
    },
    outputs: {}, // No outputs, it's the final destination
    params: {
      'pan': nodes.panner.pan
    }
  } : null, [nodes]);

  // Register module
  useAudioModule(id, moduleDef);

  return (
    <Card className="w-48 shadow-lg shadow-black/50">
      <CardHeader className="pb-3 border-b border-zinc-800 bg-zinc-950/50">
        <CardTitle className="text-zinc-100 flex justify-between items-center">
          <span>Speakers</span>
          <Button
            variant="outline"
            size="icon-lg"
            className={`${isMuted ? 'text-red-500' : 'text-green-500'}`}
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
          className="w-full text-xs"
          onClick={() => resumeContext()}
        >
          Re-trigger audio
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
            className="[&_.absolute]:bg-slate-500"
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
            className="[&_.absolute]:bg-slate-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};
