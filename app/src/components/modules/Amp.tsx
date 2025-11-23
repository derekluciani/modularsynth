<<<<<<< HEAD
import React, { useEffect, useRef, useState, useMemo } from 'react';
=======
import React, { useEffect, useState, useMemo } from 'react';
>>>>>>> main
import { useAudioContext } from '../../context/AudioContextProvider';
import { useAudioModule } from '../../audio/useAudioModule';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';

interface AmpProps {
  id: string;
  name: string;
}

export const Amp: React.FC<AmpProps> = ({ id, name }) => {
  const { audioCtx } = useAudioContext();
  const [gain, setGain] = useState(0.5);

  const [nodes, setNodes] = useState<{ gain: GainNode } | null>(null);
<<<<<<< HEAD
  const nodesRef = useRef<{ gain: GainNode } | null>(null);
=======
>>>>>>> main

  useEffect(() => {
    if (!audioCtx) return;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = gain;

<<<<<<< HEAD
    nodesRef.current = { gain: gainNode };
=======
>>>>>>> main
    setNodes({ gain: gainNode });

    return () => {
      gainNode.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioCtx]);

  useEffect(() => {
<<<<<<< HEAD
    if (nodes && audioCtx) {
      nodes.gain.gain.setTargetAtTime(gain, audioCtx.currentTime, 0.01);
    }
  }, [gain, audioCtx, nodes]);

  const moduleDef = useMemo(() => nodes ? {
    type: 'Amp' as const,
=======
    if (nodes) {
      nodes.gain.gain.setTargetAtTime(gain, audioCtx!.currentTime, 0.01);
    }
  }, [gain, audioCtx, nodes]);

  const moduleDefinition = useMemo(() => nodes ? {
    type: 'Amp',
>>>>>>> main
    inputs: {
      'input': nodes.gain,
      'gain': nodes.gain.gain // Modulation input for AM / tremolo
    },
    outputs: {
      'output': nodes.gain
    },
    params: {
      'gain': nodes.gain.gain
    }
  } : null, [nodes]);

<<<<<<< HEAD
  useAudioModule(id, moduleDef);
=======
  useAudioModule(id, moduleDefinition as any);
>>>>>>> main

  return (
    <Card className="w-48 bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-zinc-100 flex justify-between items-center">
          <span>{name}</span>
          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Volume</Label>
            <span>{Math.round(gain * 100)}%</span>
          </div>
          <Slider
            value={[gain]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => setGain(v[0])}
            className="[&_.absolute]:bg-amber-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};
