import React, { useEffect, useRef, useState } from 'react';
import { useAudioContext } from '../../context/AudioContextProvider';
import { useAudioModule } from '../../audio/useAudioModule';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

interface FilterProps {
  id: string;
  name: string;
}

export const Filter: React.FC<FilterProps> = ({ id, name }) => {
  const { audioCtx } = useAudioContext();
  const [cutoff, setCutoff] = useState(1000);
  const [res, setRes] = useState(1);
  const [type, setType] = useState<BiquadFilterType>('lowpass');

  const nodesRef = useRef<{ filter: BiquadFilterNode } | null>(null);

  useEffect(() => {
    if (!audioCtx) return;

    const filter = audioCtx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = cutoff;
    filter.Q.value = res;

    nodesRef.current = { filter };

    return () => {
      filter.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioCtx]);

  useEffect(() => {
    if (nodesRef.current) {
      nodesRef.current.filter.type = type;
    }
  }, [type]);

  useEffect(() => {
    if (nodesRef.current) {
      nodesRef.current.filter.frequency.setTargetAtTime(cutoff, audioCtx!.currentTime, 0.01);
    }
  }, [cutoff, audioCtx]);

  useEffect(() => {
    if (nodesRef.current) {
      nodesRef.current.filter.Q.setTargetAtTime(res, audioCtx!.currentTime, 0.01);
    }
  }, [res, audioCtx]);

  useAudioModule(id, nodesRef.current ? {
    type: 'Filter',
    inputs: {
      'input': nodesRef.current.filter,
      'cutoff': nodesRef.current.filter.frequency,
      'resonance': nodesRef.current.filter.Q
    },
    outputs: {
      'output': nodesRef.current.filter
    },
    params: {
      'cutoff': nodesRef.current.filter.frequency,
      'resonance': nodesRef.current.filter.Q
    }
  } : null);

  return (
    <Card className="w-64 bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-zinc-100 flex justify-between items-center">
          <span>{name}</span>
          <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Cutoff</Label>
            <span>{cutoff} Hz</span>
          </div>
          <Slider 
            value={[cutoff]} 
            min={60} 
            max={12000} 
            step={10}
            onValueChange={(v) => setCutoff(v[0])}
            className="[&_.absolute]:bg-purple-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Resonance</Label>
            <span>{res.toFixed(1)}</span>
          </div>
          <Slider 
            value={[res]} 
            min={0.1} 
            max={20} 
            step={0.1}
            onValueChange={(v) => setRes(v[0])}
            className="[&_.absolute]:bg-purple-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-zinc-400">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as BiquadFilterType)}>
            <SelectTrigger className="h-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
              <SelectItem value="lowpass">Lowpass</SelectItem>
              <SelectItem value="bandpass">Bandpass</SelectItem>
              <SelectItem value="highpass">Highpass</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
