import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAudioContext } from '../../context/AudioContextProvider';
import { useAudioModule } from '../../audio/useAudioModule';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';

interface RandomProps {
  id: string;
  name: string;
}

export const Random: React.FC<RandomProps> = ({ id, name }) => {
  const { audioCtx, isWorkletLoaded } = useAudioContext();
  const [rate, setRate] = useState(1);
  const [level, setLevel] = useState(1);

  const [nodes, setNodes] = useState<{ worklet: AudioWorkletNode; gain: GainNode } | null>(null);
  const nodesRef = useRef<{ worklet: AudioWorkletNode; gain: GainNode } | null>(null);

  useEffect(() => {
    if (!audioCtx || !isWorkletLoaded) return;

    try {
      const worklet = new AudioWorkletNode(audioCtx, 'random-processor');
      const gainNode = audioCtx.createGain();

      // Parameters
      const rateParam = worklet.parameters.get('rate');
      if (rateParam) rateParam.value = rate;
      gainNode.gain.value = level;

      worklet.connect(gainNode);

      nodesRef.current = { worklet, gain: gainNode };
      setNodes({ worklet, gain: gainNode });

      return () => {
        worklet.disconnect();
        gainNode.disconnect();
      };
    } catch (err) {
      console.error("Failed to create Random worklet node", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioCtx, isWorkletLoaded]);

  useEffect(() => {
    if (nodes && audioCtx) {
      const rateParam = nodes.worklet.parameters.get('rate');
      if (rateParam) {
        rateParam.setTargetAtTime(rate, audioCtx.currentTime, 0.01);
      }
    }
  }, [rate, audioCtx, nodes]);

  useEffect(() => {
    if (nodes && audioCtx) {
      nodes.gain.gain.setTargetAtTime(level, audioCtx.currentTime, 0.01);
    }
  }, [level, audioCtx, nodes]);

  const moduleDef = useMemo(() => nodes ? {
    type: 'Random' as const,
    inputs: {
      'rate': nodes.worklet.parameters.get('rate') as AudioParam, // Allows modulating rate
    },
    outputs: {
      'output': nodes.gain
    },
    params: {
      'rate': nodes.worklet.parameters.get('rate') as AudioParam,
      'level': nodes.gain.gain
    }
  } : null, [nodes]);

  useAudioModule(id, moduleDef);

  return (
    <Card className="w-48 bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-zinc-100 flex justify-between items-center">
          <span>{name}</span>
          <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isWorkletLoaded && (
          <div className="text-red-500 text-xs">Processor loading...</div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Rate</Label>
            <span>{rate} Hz</span>
          </div>
          <Slider
            value={[rate]}
            min={0.1}
            max={20}
            step={0.1}
            onValueChange={(v) => setRate(v[0])}
            className="[&_.absolute]:bg-pink-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Level</Label>
            <span>{Math.round(level * 100)}%</span>
          </div>
          <Slider
            value={[level]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => setLevel(v[0])}
            className="[&_.absolute]:bg-pink-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};
