import React, { useEffect, useRef, useState, useMemo } from "react";
import { useAudioContext } from '../../context/AudioContext';
import { useAudioModule } from "../../audio/useAudioModule";
import { linearToLog, logToLinear } from "../../audio/scales";
import { DEFAULT_PATCH } from "../../audio/defaultPatch";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Slider } from "../ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";

interface LFOProps {
  id: string;
  name: string;
}

interface LFOState {
  freq?: number;
  amount?: number;
  type?: OscillatorType;
}

export const LFO: React.FC<LFOProps> = ({ id, name }) => {
  const { audioCtx } = useAudioContext();
  const defaultValues =
    (DEFAULT_PATCH.modules[
      id as keyof typeof DEFAULT_PATCH.modules
    ] as unknown as LFOState) || {};

  const [freq, setFreq] = useState(defaultValues.freq ?? 1); // Hz
  const [amount, setAmount] = useState(defaultValues.amount ?? 0.5); // Amplitude
  const [type, setType] = useState<OscillatorType>(
    (defaultValues.type as OscillatorType) ?? "sine",
  );

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

  const [nodes, setNodes] = useState<{
    osc: OscillatorNode;
    gain: GainNode;
  } | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  useEffect(() => {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = amount;

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

  useEffect(() => {
    if (nodes && audioCtx) {
      nodes.gain.gain.setTargetAtTime(amount, audioCtx.currentTime, 0.01);
    }
  }, [amount, audioCtx, nodes]);

  // Refs for state access in moduleDef
  const freqRef = useRef(freq);
  const amountRef = useRef(amount);
  const typeRef = useRef(type);

  useEffect(() => {
    freqRef.current = freq;
  }, [freq]);
  useEffect(() => {
    amountRef.current = amount;
  }, [amount]);
  useEffect(() => {
    typeRef.current = type;
  }, [type]);

  const moduleDef = useMemo(
    () =>
      nodes
        ? {
          type: "LFO" as const,
          inputs: {
            frequency: nodes.osc.frequency,
          },
          outputs: {
            output: nodes.gain,
          },
          params: {
            frequency: nodes.osc.frequency,
            amount: nodes.gain.gain,
          },
          getState: () => ({
            freq: freqRef.current,
            amount: amountRef.current,
            type: typeRef.current,
          }),
          setState: (state: Record<string, unknown>) => {
            const s = state as unknown as LFOState;
            if (s.freq !== undefined) setFreq(s.freq);
            if (s.amount !== undefined) setAmount(s.amount);
            if (s.type !== undefined) setType(s.type);
          },
        }
        : null,
    [nodes],
  );
  useAudioModule(id, moduleDef);

  return (
    <Card className="grow">
      <CardHeader className="pb-3">
        <CardTitle className="text-zinc-100 flex justify-between items-center relative z-10 min-h-6">
          <span className="truncate">{name}</span>
          <div
            className="w-1 h-1 rounded-full bg-zinc-200 shrink-0"
            style={{
              animation: `pulse-led ${freq > 0 ? Math.min(1 / freq, 60) : 0}s infinite ease-in-out`,
            }}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Rate</Label>
            <span>{freq.toFixed(2)} Hz</span>
          </div>
          <Slider
            value={[logToLinear(freq, 0.1, 12)]}
            min={0}
            max={1}
            step={0.001}
            onValueChange={(v) => setFreq(linearToLog(v[0], 0.1, 12))}
            className="[&_.absolute]:bg-lfo"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Amount</Label>
            <span>
              {amount === 0
                ? "0"
                : amount < 1
                  ? amount.toFixed(3)
                  : Math.round(amount)}
            </span>
          </div>
          <Slider
            value={[amount === 0 ? 0 : logToLinear(amount, 0.001, 1000)]}
            min={0}
            max={1}
            step={0.001}
            onValueChange={(v) =>
              setAmount(v[0] === 0 ? 0 : linearToLog(v[0], 0.001, 1000))
            }
            className="[&_.absolute]:bg-lfo"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-zinc-400">Shape</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as OscillatorType)}
          >
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
