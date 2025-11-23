import React, { useEffect, useState, useMemo } from 'react';
import { useAudioContext } from '../../context/AudioContextProvider';
import { useAudioModule } from '../../audio/useAudioModule';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioOutProps {
  id: string;
}

export const AudioOut: React.FC<AudioOutProps> = ({ id }) => {
  const { audioCtx, resumeContext, audioContextState } = useAudioContext();
  const [volume, setVolume] = useState(0.75);
  const [pan, setPan] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const [nodes, setNodes] = useState<{ panner: StereoPannerNode; gain: GainNode } | null>(null);

  useEffect(() => {
    if (!audioCtx) return;

    const panner = audioCtx.createStereoPanner();
    const gain = audioCtx.createGain();

    panner.pan.value = pan;
    gain.gain.value = volume;

    panner.connect(gain);
    gain.connect(audioCtx.destination);

    setNodes({ panner, gain });

    return () => {
      panner.disconnect();
      gain.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioCtx]);

  useEffect(() => {
    if (nodes) {
      nodes.panner.pan.setTargetAtTime(pan, audioCtx!.currentTime, 0.01);
    }
  }, [pan, audioCtx, nodes]);

  useEffect(() => {
    if (nodes) {
      const targetVol = isMuted ? 0 : volume;
      nodes.gain.gain.setTargetAtTime(targetVol, audioCtx!.currentTime, 0.01);
    }
  }, [volume, isMuted, audioCtx, nodes]);

  const moduleDefinition = useMemo(() => nodes ? {
    type: 'AudioOut',
    inputs: {
      'input': nodes.panner
    },
    outputs: {}, 
    params: {
      'pan': nodes.panner.pan
    }
  } : null, [nodes]);

  useAudioModule(id, moduleDefinition as any);

  return (
    <Card className="w-48 bg-zinc-900 border-zinc-800 shadow-lg shadow-black/50 relative overflow-hidden">
      {audioContextState === 'suspended' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 animate-in fade-in">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => resumeContext()}
            className="text-xs font-bold shadow-lg shadow-green-500/20"
          >
            Click to Start
          </Button>
        </div>
      )}
      <CardHeader className="pb-3 border-b border-zinc-800 bg-zinc-950/50">
        <CardTitle className="text-zinc-100 flex justify-between items-center">
          <span>Master</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-6 w-6 ${isMuted ? 'text-red-500' : 'text-green-500'}`}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Volume */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Volume</Label>
            <span>{Math.round(volume * 100)}%</span>
          </div>
          <Slider 
            value={[volume]} 
            min={0} 
            max={1} 
            step={0.01} 
            onValueChange={(v) => setVolume(v[0])}
            className="[&_.absolute]:bg-blue-500"
          />
        </div>

        {/* Pan */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Pan</Label>
            <span>{pan.toFixed(2)}</span>
          </div>
          <Slider 
            value={[pan]} 
            min={-1} 
            max={1} 
            step={0.1} 
            onValueChange={(v) => setPan(v[0])}
          />
        </div>
      </CardContent>
    </Card>
  );
};
