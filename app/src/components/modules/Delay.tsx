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

interface DelayProps {
  id: string;
  name: string;
}

export const Delay: React.FC<DelayProps> = ({ id, name }) => {
  const { audioCtx } = useAudioContext();
  const [time, setTime] = useState(0.5);
  const [feedback, setFeedback] = useState(0.3);

  const [nodes, setNodes] = useState<{ delay: DelayNode; feedbackGain: GainNode; inputGain: GainNode; outputGain: GainNode } | null>(null);
<<<<<<< HEAD
  const nodesRef = useRef<{ delay: DelayNode; feedbackGain: GainNode; inputGain: GainNode; outputGain: GainNode } | null>(null);
=======
>>>>>>> main

  useEffect(() => {
    if (!audioCtx) return;

    const inputGain = audioCtx.createGain();
    const outputGain = audioCtx.createGain();
    const delayNode = audioCtx.createDelay(5.0); // Max delay 5s
    const feedbackGain = audioCtx.createGain();

    delayNode.delayTime.value = time;
    feedbackGain.gain.value = feedback;

    // Routing
<<<<<<< HEAD
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

=======
    // Input -> Output (Dry)
    inputGain.connect(outputGain);
    
    // Input -> Delay -> Output (Wet)
    inputGain.connect(delayNode);
>>>>>>> main
    delayNode.connect(outputGain);
    
    // Feedback Loop: Delay -> FeedbackGain -> Delay
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode); 

<<<<<<< HEAD
    nodesRef.current = { delay: delayNode, feedbackGain, inputGain, outputGain };
=======
>>>>>>> main
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
<<<<<<< HEAD
    if (nodes && audioCtx) {
      nodes.delay.delayTime.setTargetAtTime(time, audioCtx.currentTime, 0.01);
=======
    if (nodes) {
      nodes.delay.delayTime.setTargetAtTime(time, audioCtx!.currentTime, 0.01);
>>>>>>> main
    }
  }, [time, audioCtx, nodes]);

  useEffect(() => {
<<<<<<< HEAD
    if (nodes && audioCtx) {
      nodes.feedbackGain.gain.setTargetAtTime(feedback, audioCtx.currentTime, 0.01);
    }
  }, [feedback, audioCtx, nodes]);

  const moduleDef = useMemo(() => nodes ? {
    type: 'Delay' as const,
=======
    if (nodes) {
      nodes.feedbackGain.gain.setTargetAtTime(feedback, audioCtx!.currentTime, 0.01);
    }
  }, [feedback, audioCtx, nodes]);

  const moduleDefinition = useMemo(() => nodes ? {
    type: 'Delay',
>>>>>>> main
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
          <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Time</Label>
            <span>{time.toFixed(2)} s</span>
          </div>
          <Slider
            value={[time]}
            min={0}
            max={2.0}
            step={0.01}
            onValueChange={(v) => setTime(v[0])}
            className="[&_.absolute]:bg-orange-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Repeats</Label>
            <span>{Math.round(feedback * 100)}%</span>
          </div>
          <Slider
            value={[feedback]}
            min={0}
            max={0.9}
            step={0.01}
            onValueChange={(v) => setFeedback(v[0])}
            className="[&_.absolute]:bg-orange-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};
