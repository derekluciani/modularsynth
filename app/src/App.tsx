import { useEffect } from 'react';
import { AudioContextProvider, useAudioContext } from './context/AudioContextProvider';
import { Oscillator } from './components/modules/Oscillator';
import { AudioOut } from './components/modules/AudioOut';
import { Amp } from './components/modules/Amp';
import { Filter } from './components/modules/Filter';
import { LFO } from './components/modules/LFO';
import { Delay } from './components/modules/Delay';
import { Random } from './components/modules/Random';
import { PatchBay } from './components/PatchBay';
import { Button } from './components/ui/button';
import { RefreshCcw } from 'lucide-react';

const Synth = () => {
  const { restoreDefaultPatch } = useAudioContext();

  return (
    <div className="space-y-8">
      
      {/* Top Row: Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-4 col-span-2">
           <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Oscillators</h2>
           <div className="flex flex-wrap gap-4">
             <Oscillator id="osc1" name="Oscillator 1" defaultValues={{ pitch: 220, shape: 'sawtooth' }} />
             <Oscillator id="osc2" name="Oscillator 2" defaultValues={{ pitch: 440, shape: 'sawtooth' }} />
             <Oscillator id="osc3" name="Oscillator 3" />
             <Oscillator id="osc4" name="Oscillator 4" />
           </div>
        </div>

        <div className="space-y-4 col-span-2 lg:col-span-2">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Modulation & Noise</h2>
            <div className="flex flex-wrap gap-4">
              <LFO id="lfo1" name="LFO 1" defaultValues={{ freq: 10, shape: 'sine' }} />
              <LFO id="lfo2" name="LFO 2" />
              <Random id="rnd1" name="Random 1" />
            </div>
        </div>
      </div>

      {/* Middle Row: Processors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-zinc-800 pt-6">
        <div className="space-y-4 col-span-2">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Filters</h2>
          <div className="flex flex-wrap gap-4">
             <Filter id="filter1" name="Filter 1" defaultValues={{ cutoff: 800, resonance: 1.0, type: 'lowpass' }} />
             <Filter id="filter2" name="Filter 2" />
          </div>
        </div>
        
        <div className="space-y-4 col-span-2">
           <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Effects & Amp</h2>
           <div className="flex flex-wrap gap-4">
             <Delay id="delay1" name="Delay 1" />
             <Amp id="amp1" name="Amp 1" />
           </div>
        </div>
      </div>

      {/* Bottom Row: Master & Patch Bay */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t border-zinc-800 pt-6">
        <div className="lg:col-span-2 space-y-4">
           <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Patch Bay</h2>
           <PatchBay />
        </div>
        
        <div className="space-y-4 flex flex-col items-center">
           <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Master Output</h2>
           <AudioOut id="master" />
           
           <div className="mt-8">
             <Button variant="outline" onClick={restoreDefaultPatch} className="text-xs">
               <RefreshCcw className="mr-2 h-3 w-3" />
               Restore Default Patch
             </Button>
           </div>
        </div>
      </div>

    </div>
  );
};

function App() {
  return (
    <AudioContextProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8 font-sans selection:bg-zinc-800">
        <header className="mb-8 flex justify-between items-center border-b border-zinc-800 pb-6">
           <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">Gemini Modular</h1>
            <p className="text-zinc-500 text-sm mt-1">Web Audio API Synthesizer</p>
           </div>
           <div className="text-right hidden md:block">
             <div className="text-xs text-zinc-600">v1.0.0</div>
           </div>
        </header>
        
        <div className="max-w-7xl mx-auto">
          <Synth />
        </div>
      </div>
    </AudioContextProvider>
  );
}

export default App;