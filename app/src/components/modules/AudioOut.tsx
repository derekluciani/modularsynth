import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { useAudioModule } from '../../audio/useAudioModule';
import { dbToGain } from '../../audio/scales';
import { DEFAULT_PATCH } from '../../audio/defaultPatch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioOutProps {
  id: string;
}

interface AudioOutState {
  volume?: number;
  pan?: number;
  isMuted?: boolean;
}

export const AudioOut: React.FC<AudioOutProps> = ({ id }) => {
  const { audioCtx, analyserNode } = useAudioContext();
  const defaultValues = (DEFAULT_PATCH.modules[id as keyof typeof DEFAULT_PATCH.modules] as unknown as AudioOutState) || {};

  const [volume, setVolume] = useState(defaultValues.volume ?? -6); // dB
  const [pan, setPan] = useState(defaultValues.pan ?? 0);
  const [isMuted, setIsMuted] = useState(defaultValues.isMuted ?? false);

  const [nodes, setNodes] = useState<{ panner: StereoPannerNode; gain: GainNode } | null>(null);
  const nodesRef = useRef<{ panner: StereoPannerNode; gain: GainNode } | null>(null);

  useEffect(() => {
    if (!audioCtx) return;

    // Create nodes
    const panner = audioCtx.createStereoPanner();
    const gain = audioCtx.createGain();

    // Connect graph: Input -> Panner -> Gain -> Analyser -> Destination
    panner.connect(gain);

    if (analyserNode) {
      gain.connect(analyserNode);
    } else {
      gain.connect(audioCtx.destination);
    }

    // Initial values
    panner.pan.value = pan;
    gain.gain.value = dbToGain(volume);

    // Connect graph: Input -> Panner -> Gain -> Destination
    // Connect graph: Input -> Panner -> Gain -> Analyser (which goes to Destination)
    // If we have access to the global analyser via context, we should use it.
    // However, the analyser is on the context object, but we need to access it here.
    // We can get it from useAudioContext().

    // We need to access the analyserNode from the hook, but it might not be in the destructured vars yet.
    // Let's update the destructuring first.

    // Wait, I can't update the destructuring here. I need to do it in a separate edit or assume I'll do it.
    // Actually, I should have updated the destructuring first.
    // But I can access it via audioCtx if I had attached it, but I didn't.
    // I added it to the context VALUE.

    // So I need to update the component to get 'analyserNode' from useAudioContext.

    // This tool call is for the connection logic. I will assume 'analyserNode' is available in scope
    // and I will update the destructuring in the next step or I should have done it in one go.
    // I'll do the destructuring update first in a separate tool call to be safe, or just do a multi-replace.

    // Let's use multi-replace for AudioOut.tsx to do both.
    // Aborting this single replace to use multi-replace.

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
      const targetVol = isMuted ? 0 : dbToGain(volume);
      nodes.gain.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.01);
    }
  }, [volume, isMuted, audioCtx, nodes]);

  // Refs for state access in moduleDef
  const volumeRef = useRef(volume);
  const panRef = useRef(pan);
  const isMutedRef = useRef(isMuted);

  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Memoize module definition
  const moduleDef = useMemo(() => nodes ? {
    type: 'AudioOut' as const,
    inputs: {
      'input': nodes.panner
    },
    outputs: {}, // No outputs, it's the final destination
    params: {
      'volume': nodes.gain.gain,
      'pan': nodes.panner.pan
    },
    getState: () => ({ volume: volumeRef.current, pan: panRef.current, isMuted: isMutedRef.current }),
    setState: (state: Record<string, unknown>) => {
      const s = state as unknown as AudioOutState;
      if (s.volume !== undefined) setVolume(s.volume);
      if (s.pan !== undefined) setPan(s.pan);
      if (s.isMuted !== undefined) setIsMuted(s.isMuted);
    }
  } : null, [nodes]);

  // Register module
  useAudioModule(id, moduleDef);

  return (
    <Card className="grow shadow-lg shadow-black/50 gap-0">
      <CardHeader className="border-zinc-800 bg-zinc-950/50">
        <CardTitle className="text-zinc-100 flex justify-between items-center">
          <span>Speaker</span>
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


        {/* Volume */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Master Volume</Label>
            <span>{volume} dB</span>
          </div>
          {/* Vertical Slider attempt or just horizontal? Requirements didn't specify orientation, sticking to horizontal for consistency with other modules for now */}
          <Slider
            value={[volume]}
            min={-60}
            max={0}
            step={0.5}
            onValueChange={(v) => setVolume(v[0])}
            className="[&_.absolute]:bg-speaker"
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
            className="[&_.absolute]:bg-speaker"
          />
        </div>
      </CardContent>
    </Card>
  );
};
