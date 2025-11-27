import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAudioContext } from '../../context/AudioContextProvider';
import { useAudioModule } from '../../audio/useAudioModule';
import { linearToLog, logToLinear } from '../../audio/scales';
import { DEFAULT_PATCH } from '../../audio/defaultPatch';
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
  const defaultValues = (DEFAULT_PATCH.modules[id as keyof typeof DEFAULT_PATCH.modules] as any) || {};

  const [cutoff, setCutoff] = useState(defaultValues.cutoff ?? 1000);
  const [res, setRes] = useState(defaultValues.res ?? 1);
  const [type, setType] = useState<BiquadFilterType>((defaultValues.type as BiquadFilterType) ?? 'lowpass');

  const [nodes, setNodes] = useState<{ filter: BiquadFilterNode } | null>(null);
  const nodesRef = useRef<{ filter: BiquadFilterNode } | null>(null);

  useEffect(() => {
    if (!audioCtx) return;

    const filter = audioCtx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = cutoff;
    filter.Q.value = res;

    nodesRef.current = { filter };
    setNodes({ filter });

    return () => {
      filter.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioCtx]);

  useEffect(() => {
    if (nodes) {
      nodes.filter.type = type;
    }
  }, [type, nodes]);

  useEffect(() => {
    if (nodes && audioCtx) {
      nodes.filter.frequency.setTargetAtTime(cutoff, audioCtx.currentTime, 0.01);
    }
  }, [cutoff, audioCtx, nodes]);

  useEffect(() => {
    if (nodes && audioCtx) {
      nodes.filter.Q.setTargetAtTime(res, audioCtx.currentTime, 0.01);
    }
  }, [res, audioCtx, nodes]);

  // Refs for state access in moduleDef
  const cutoffRef = useRef(cutoff);
  const resRef = useRef(res);
  const typeRef = useRef(type);

  useEffect(() => { cutoffRef.current = cutoff; }, [cutoff]);
  useEffect(() => { resRef.current = res; }, [res]);
  useEffect(() => { typeRef.current = type; }, [type]);

  const moduleDef = useMemo(() => nodes ? {
    type: 'Filter' as const,
    inputs: {
      'input': nodes.filter,
      'cutoff': nodes.filter.frequency,
      'resonance': nodes.filter.Q
    },
    outputs: {
      'output': nodes.filter
    },
    params: {
      'cutoff': nodes.filter.frequency,
      'resonance': nodes.filter.Q
    },
    getState: () => ({ cutoff: cutoffRef.current, res: resRef.current, type: typeRef.current }),
    setState: (state: any) => {
      if (state.cutoff !== undefined) setCutoff(state.cutoff);
      if (state.res !== undefined) setRes(state.res);
      if (state.type !== undefined) setType(state.type);
    }
  } : null, [nodes]);

  useAudioModule(id, moduleDef);

  return (
    <Card className="w-64">
      <CardHeader className="pb-3">
        <CardTitle className="text-zinc-100 flex justify-between items-center">
          <span>{name}</span>
          {/* <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" /> */}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Cutoff</Label>
            <span>{Math.round(cutoff)} Hz</span>
          </div>
          <Slider
            value={[logToLinear(cutoff, 20, 20000)]}
            min={0}
            max={1}
            step={0.001}
            onValueChange={(v) => setCutoff(linearToLog(v[0], 20, 20000))}
            className="[&_.absolute]:bg-purple-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Resonance</Label>
            <span>{res.toFixed(2)}</span>
          </div>
          <Slider
            value={[logToLinear(res, 0.1, 20)]}
            min={0}
            max={1}
            step={0.001}
            onValueChange={(v) => setRes(linearToLog(v[0], 0.1, 20))}
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
