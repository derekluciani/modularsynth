import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAudioContext } from '../../context/AudioContextProvider';
import { useAudioModule } from '../../audio/useAudioModule';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

interface OscillatorProps {
  id: string;
  name: string;
}

export const Oscillator: React.FC<OscillatorProps> = ({ id, name }) => {
  const { audioCtx } = useAudioContext();
  const [freq, setFreq] = useState(440);
  const [type, setType] = useState<OscillatorType>('sawtooth');
  const [level, setLevel] = useState(0.5);

  const [nodes, setNodes] = useState<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  useEffect(() => {
    if (!audioCtx) return;

    // Create nodes
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Initial values
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = level;

    // Connect internal graph
    // Connect internal graph
    osc.connect(gain);
    osc.start();

    // Store nodes in state to trigger re-render and registration
    nodesRef.current = { osc, gain };
    setNodes({ osc, gain });

    return () => {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioCtx]); // Only re-run if ctx changes (mount)

  // Handle parameter updates
  useEffect(() => {
    if (nodes) {
      nodes.osc.type = type;
    }
  }, [type, nodes]);

  useEffect(() => {
    if (nodes && audioCtx) {
      // We use setTargetAtTime for smooth transitions if needed, or just direct assignment for UI control
      // Direct assignment is fine for this simple synth unless we get clicking
      nodes.osc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.01);
    }
  }, [freq, audioCtx, nodes]);

  useEffect(() => {
    if (nodes && audioCtx) {
      nodes.gain.gain.setTargetAtTime(level, audioCtx.currentTime, 0.01);
    }
  }, [level, audioCtx, nodes]);

  // Memoize module definition to prevent infinite loops
  const moduleDef = useMemo(() => nodes ? {
    type: 'Oscillator' as const,
    inputs: {
      // FM modulation usually goes to frequency
      'pitch': nodes.osc.frequency,
      'level': nodes.gain.gain
    },
    outputs: {
      'output': nodes.gain
    },
    params: {
      'pitch': nodes.osc.frequency,
      'level': nodes.gain.gain
    }
  } : null, [nodes]);

  // Register module
  useAudioModule(id, moduleDef);

  return (
    <Card className="w-64">
      <CardHeader className="pb-3">
        <CardTitle className="text-zinc-100 flex justify-between items-center">
          <span>{name}</span>
          {/* <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> */}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pitch */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Pitch</Label>
            <span>{freq} Hz</span>
          </div>
          <Slider
            value={[freq]}
            min={20}
            max={1000}
            step={1}
            // Logarithmic scale approximation for UI feel could be added here, 
            // but strictly mapping linear slider to linear state for now
            onValueChange={(v) => setFreq(v[0])}
            className="[&_.absolute]:bg-emerald-500"
          />
        </div>

        {/* Level */}
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
            className="[&_.absolute]:bg-emerald-500"
          />
        </div>

        {/* Shape */}
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
