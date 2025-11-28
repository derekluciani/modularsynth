import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAudioContext } from '../../context/AudioContextProvider';
import { useAudioModule } from '../../audio/useAudioModule';
import { linearToLog, logToLinear } from '../../audio/scales';
import { DEFAULT_PATCH } from '../../audio/defaultPatch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';

interface DelayProps {
  id: string;
  name: string;
}

export const Delay: React.FC<DelayProps> = ({ id, name }) => {
  const { audioCtx } = useAudioContext();
  const defaultValues = (DEFAULT_PATCH.modules[id as keyof typeof DEFAULT_PATCH.modules] as any) || {};

  const [time, setTime] = useState(defaultValues.time ?? 0.3);
  const [feedback, setFeedback] = useState(defaultValues.feedback ?? 0.4);

  const [nodes, setNodes] = useState<{ delay: DelayNode; feedbackGain: GainNode; inputGain: GainNode; outputGain: GainNode } | null>(null);
  const nodesRef = useRef<{ delay: DelayNode; feedbackGain: GainNode; inputGain: GainNode; outputGain: GainNode } | null>(null);

  useEffect(() => {
    if (!audioCtx) return;

    // Standard delay structure:
    // Input -> InputGain -> OutputGain -> Output
    //             |
    //             v
    //           Delay -> FeedbackGain -> (back to InputGain input)
    //             |
    //             v
    //           (mix to output)

    const inputGain = audioCtx.createGain();
    const outputGain = audioCtx.createGain();
    const delayNode = audioCtx.createDelay(5.0); // Max delay 5s
    const feedbackGain = audioCtx.createGain();

    delayNode.delayTime.value = time;
    feedbackGain.gain.value = feedback;

    // Routing
    inputGain.connect(outputGain); // Dry signal (optional? usually delay module is wet only or wet/dry mix. Let's assume this module outputs Wet + Dry or just Wet?)
    // Requirement says: "DelayNode + GainNode feedback loop"
    // Usually a Delay module in a modular synth outputs the wet signal, or has a Mix knob.
    // Requirements do not specify Mix knob.
    // Let's implement a standard "Input passes through, and Delay adds to it" or just "Delay line".
    // If we just output the delay line, user must mix it themselves.
    // But usually "Delay" module implies an effect unit.
    // Let's route Input -> Delay -> Output. And Input -> Output (Dry).
    // Actually, if we want a true modular delay, we often just want the delayed signal. 
    // But for simplicity and typical usage without a mixer module:
    // Let's do: Input -> Output (Direct) AND Input -> Delay -> Output.
    // Wait, if we chain Osc -> Delay -> AudioOut, we expect to hear the Osc AND the echo.

    // Wiring:
    inputGain.connect(delayNode);
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode); // Feedback loop

    delayNode.connect(outputGain);
    inputGain.connect(outputGain); // Dry signal pass-through

    nodesRef.current = { delay: delayNode, feedbackGain, inputGain, outputGain };
    setNodes({ delay: delayNode, feedbackGain, inputGain, outputGain });

    return () => {
      inputGain.disconnect();
      outputGain.disconnect();
      delayNode.disconnect();
      feedbackGain.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioCtx]);

  useEffect(() => {
    if (nodes && audioCtx) {
      nodes.delay.delayTime.setTargetAtTime(time, audioCtx.currentTime, 0.01);
    }
  }, [time, audioCtx, nodes]);

  useEffect(() => {
    if (nodes && audioCtx) {
      nodes.feedbackGain.gain.setTargetAtTime(feedback, audioCtx.currentTime, 0.01);
    }
  }, [feedback, audioCtx, nodes]);

  // Refs for state access in moduleDef
  const timeRef = useRef(time);
  const feedbackRef = useRef(feedback);

  useEffect(() => { timeRef.current = time; }, [time]);
  useEffect(() => { feedbackRef.current = feedback; }, [feedback]);

  const moduleDef = useMemo(() => nodes ? {
    type: 'Delay' as const,
    inputs: {
      'input': nodes.inputGain,
      'time': nodes.delay.delayTime,
      'feedback': nodes.feedbackGain.gain
    },
    outputs: {
      'output': nodes.outputGain
    },
    params: {
      'time': nodes.delay.delayTime,
      'feedback': nodes.feedbackGain.gain
    },
    getState: () => ({ time: timeRef.current, feedback: feedbackRef.current }),
    setState: (state: any) => {
      if (state.time !== undefined) setTime(state.time);
      if (state.feedback !== undefined) setFeedback(state.feedback);
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
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Time</Label>
            <span>{time.toFixed(2)} s</span>
          </div>
          <Slider
            value={[logToLinear(time, 0.01, 2.0)]}
            min={0}
            max={1}
            step={0.001}
            onValueChange={(v) => setTime(linearToLog(v[0], 0.01, 2.0))}
            className="[&_.absolute]:bg-blue-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Feedback</Label>
            <span>{feedback.toFixed(2)}</span>
          </div>
          <Slider
            value={[feedback]}
            min={0}
            max={0.9}
            step={0.01}
            onValueChange={(v) => setFeedback(v[0])}
            className="[&_.absolute]:bg-blue-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};
