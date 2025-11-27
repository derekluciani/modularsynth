import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAudioContext } from '../../context/AudioContextProvider';
import { useAudioModule } from '../../audio/useAudioModule';
import { DEFAULT_PATCH } from '../../audio/defaultPatch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';

interface AmpProps {
  id: string;
  name: string;
}

export const Amp: React.FC<AmpProps> = ({ id, name }) => {
  const { audioCtx } = useAudioContext();
  const defaultValues = (DEFAULT_PATCH.modules[id as keyof typeof DEFAULT_PATCH.modules] as any) || {};

  const [gain, setGain] = useState(defaultValues.gain ?? 0.5);

  const [nodes, setNodes] = useState<{ gain: GainNode } | null>(null);
  const nodesRef = useRef<{ gain: GainNode } | null>(null);

  useEffect(() => {
    if (!audioCtx) return;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = gain;

    nodesRef.current = { gain: gainNode };
    setNodes({ gain: gainNode });

    return () => {
      gainNode.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioCtx]);

  useEffect(() => {
    if (nodes && audioCtx) {
      nodes.gain.gain.setTargetAtTime(gain, audioCtx.currentTime, 0.01);
    }
  }, [gain, audioCtx, nodes]);

  // Refs for state access in moduleDef
  const gainRef = useRef(gain);
  useEffect(() => { gainRef.current = gain; }, [gain]);

  const moduleDef = useMemo(() => nodes ? {
    type: 'Amp' as const,
    inputs: {
      'input': nodes.gain,
      'gain': nodes.gain.gain // Modulation input for AM / tremolo
    },
    outputs: {
      'output': nodes.gain
    },
    params: {
      'gain': nodes.gain.gain
    },
    getState: () => ({ gain: gainRef.current }),
    setState: (state: any) => {
      if (state.gain !== undefined) setGain(state.gain);
    }
  } : null, [nodes]);

  useAudioModule(id, moduleDef);

  return (
    <Card className="w-48">
      <CardHeader className="pb-3">
        <CardTitle className="text-zinc-100 flex justify-between items-center">
          <span>{name}</span>
          {/* <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" /> */}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Output Gain</Label>
            <span>{Math.round(gain * 100)}%</span>
          </div>
          <Slider
            value={[gain]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => setGain(v[0])}
            className="[&_.absolute]:bg-zinc-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};
