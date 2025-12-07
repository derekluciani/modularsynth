import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { useAudioModule } from '../../audio/useAudioModule';
import { DEFAULT_PATCH } from '../../audio/defaultPatch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

interface DistortionProps {
  id: string;
  name: string;
}

interface DistortionState {
  drive?: number;
  amount?: number;
  oversample?: OverSampleType;
}

function makeDistortionCurve(amount: number) {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;

  for (let i = 0; i < n_samples; ++i) {
    const x = i * 2 / n_samples - 1;
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

export const Distortion: React.FC<DistortionProps> = ({ id, name }) => {
  const { audioCtx } = useAudioContext();
  const defaultValues = (DEFAULT_PATCH.modules[id as keyof typeof DEFAULT_PATCH.modules] as unknown as DistortionState) || {};

  // Params
  const [drive, setDrive] = useState(defaultValues.drive ?? 0); // Pre-gain (0 to 5)
  const [amount, setAmount] = useState(defaultValues.amount ?? 0); // Curve amount (0 to 100)
  const [oversample, setOversample] = useState<OverSampleType>((defaultValues.oversample as OverSampleType) ?? 'none');

  const [nodes, setNodes] = useState<{ preGain: GainNode; shaper: WaveShaperNode; postGain: GainNode } | null>(null);
  const nodesRef = useRef<{ preGain: GainNode; shaper: WaveShaperNode; postGain: GainNode } | null>(null);

  // Initialize Nodes
  useEffect(() => {
    if (!audioCtx) return;

    const preGain = audioCtx.createGain();
    const shaper = audioCtx.createWaveShaper();
    const postGain = audioCtx.createGain();

    // Initial values
    preGain.gain.value = drive;
    shaper.curve = makeDistortionCurve(amount);
    shaper.oversample = oversample;
    postGain.gain.value = 1.0; // Unity output for now

    // Connect graph: Input -> PreGain -> Shaper -> PostGain -> Output
    preGain.connect(shaper);
    shaper.connect(postGain);

    const nodeSet = { preGain, shaper, postGain };
    nodesRef.current = nodeSet;
    setNodes(nodeSet);

    return () => {
      preGain.disconnect();
      shaper.disconnect();
      postGain.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioCtx]);

  // Update Params
  useEffect(() => {
    if (nodes && audioCtx) {
      nodes.preGain.gain.setTargetAtTime(drive, audioCtx.currentTime, 0.01);
    }
  }, [drive, audioCtx, nodes]);

  useEffect(() => {
    if (nodes) {
      nodes.shaper.curve = makeDistortionCurve(amount);
    }
  }, [amount, nodes]);

  useEffect(() => {
    if (nodes) {
      nodes.shaper.oversample = oversample;
    }
  }, [oversample, nodes]);

  // Refs for state access in moduleDef
  const driveRef = useRef(drive);
  const amountRef = useRef(amount);
  const oversampleRef = useRef(oversample);

  useEffect(() => { driveRef.current = drive; }, [drive]);
  useEffect(() => { amountRef.current = amount; }, [amount]);
  useEffect(() => { oversampleRef.current = oversample; }, [oversample]);

  // Register Module
  const moduleDef = useMemo(() => nodes ? {
    type: 'Distortion' as const,
    inputs: {
      'input': nodes.preGain
    },
    outputs: {
      'output': nodes.postGain
    },
    params: {
      'drive': nodes.preGain.gain
    },
    getState: () => ({ drive: driveRef.current, amount: amountRef.current, oversample: oversampleRef.current }),
    setState: (state: DistortionState) => {
      if (state.drive !== undefined) setDrive(state.drive);
      if (state.amount !== undefined) setAmount(state.amount);
      if (state.oversample !== undefined) setOversample(state.oversample);
    }
  } : null, [nodes]);

  useAudioModule(id, moduleDef);

  return (
    <Card className="grow">
      <CardHeader className="pb-3">
        <CardTitle className="text-zinc-100 flex justify-between items-center">
          <span>{name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drive Control */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Drive</Label>
            <span>{drive.toFixed(2)}</span>
          </div>
          <Slider
            value={[drive]}
            min={0}
            max={5}
            step={0.01}
            onValueChange={(v) => setDrive(v[0])}
            className="[&_.absolute]:bg-dist"
          />
        </div>

        {/* Amount Control */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Amount</Label>
            <span>{amount}</span>
          </div>
          <Slider
            value={[amount]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => setAmount(v[0])}
            className="[&_.absolute]:bg-dist"
          />
        </div>

        {/* Oversample Control */}
        <div className="space-y-2">
          <Label className="text-xs text-zinc-400">Oversample</Label>
          <Select value={oversample} onValueChange={(v) => setOversample(v as OverSampleType)}>
            <SelectTrigger className="h-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="2x">2x</SelectItem>
              <SelectItem value="4x">4x</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
