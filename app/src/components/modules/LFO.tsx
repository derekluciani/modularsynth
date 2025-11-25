import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAudioContext } from '../../context/AudioContextProvider';
import { useAudioModule } from '../../audio/useAudioModule';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

interface LFOProps {
  id: string;
  name: string;
}

export const LFO: React.FC<LFOProps> = ({ id, name }) => {
  const { audioCtx } = useAudioContext();
  const [freq, setFreq] = useState(5); // Hz
  const [type, setType] = useState<OscillatorType>('sine');

  // LFOs typically output a signal between -1 and 1.
  // We need a gain node to potentially scale this, but usually the LFO module itself just outputs the raw wave
  // and the destination (modulation target) or an attenuator handles depth.
  // However, standard practice in some modular synths is to have an output level.
  // The requirements say: "LFO 1-2: OscillatorNode + GainNode". 
  // But the parameters list only shows Freq and Shape.
  // Let's check if there is an 'Amount' or 'Level' param for LFO in requirements... 
  // Requirement table: LFO | Freq (Hz) | Shape. No Level.
  // But "LFO 1-2 | OscillatorNode + GainNode" implies a gain node is used, likely for standardizing output or buffering?
  // We'll just use a unity gain node as output to be safe and consistent.

  const [nodes, setNodes] = useState<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  useEffect(() => {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 1.0; // Full output by default

    // Connect internal graph
    osc.connect(gain);
    osc.start();

    nodesRef.current = { osc, gain };
    setNodes({ osc, gain });

    return () => {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioCtx]);

  useEffect(() => {
    if (nodes) {
      nodes.osc.type = type;
    }
  }, [type, nodes]);

  useEffect(() => {
    if (nodes && audioCtx) {
      nodes.osc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.01);
    }
  }, [freq, audioCtx, nodes]);

  const moduleDef = useMemo(() => nodes ? {
    type: 'LFO' as const,
    inputs: {
      'frequency': nodes.osc.frequency
    },
    outputs: {
      'output': nodes.gain
    },
    params: {
      'frequency': nodes.osc.frequency
    }
  } : null, [nodes]);

  useAudioModule(id, moduleDef);

  return (
    <Card className="w-48">
      <CardHeader className="pb-3">
        <CardTitle className="text-zinc-100 flex justify-between items-center">
          <span>{name}</span>
          {/* <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" /> */}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Rate</Label>
            <span>{freq} Hz</span>
          </div>
          <Slider
            value={[freq]}
            min={0.01}
            max={10}
            step={0.01}
            onValueChange={(v) => setFreq(v[0])}
            className="[&_.absolute]:bg-cyan-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-zinc-400">Shape</Label>
          <Select value={type} onValueChange={(v) => setType(v as OscillatorType)}>
            <SelectTrigger className="h-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
              <SelectItem value="sine">Sine</SelectItem>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="sawtooth">Sawtooth</SelectItem>
              <SelectItem value="triangle">Triangle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
