import { AudioContextProvider } from './context/AudioContextProvider';
import { Oscillator } from './components/modules/Oscillator';
import { AudioOut } from './components/modules/AudioOut';
import { Filter } from './components/modules/Filter';
import { LFO } from './components/modules/LFO';
import { Amp } from './components/modules/Amp';
import { Delay } from './components/modules/Delay';
import { Random } from './components/modules/Random';
import { PatchBay } from './components/PatchBay';

const Synth = () => {
  return (
    <div className="space-y-8">
      {/* Top Row: Sources / Modulation */}
      <div className="flex flex-wrap justify-center gap-4">
        <LFO id="lfo-1" name="LFO 1" />
        <LFO id="lfo-2" name="LFO 2" />
        <Random id="random-1" name="Random" />
      </div>

      {/* Middle Row: Oscillators */}
      <div className="flex flex-wrap justify-center gap-4">
        <Oscillator id="osc-1" name="Oscillator 1" />
        <Oscillator id="osc-2" name="Oscillator 2" />
        <Oscillator id="osc-3" name="Oscillator 3" />
        <Oscillator id="osc-4" name="Oscillator 4" />
      </div>

      {/* Bottom Row: Effects & Output */}
      <div className="flex flex-wrap justify-center gap-4">
        <Filter id="filter-1" name="Filter 1" />
        <Filter id="filter-2" name="Filter 2" />
        <Delay id="delay-1" name="Delay" />
        <Amp id="amp-1" name="Amp" />
        <AudioOut id="master" />
      </div>

      {/* Patch Bay */}
      <div className="flex justify-center mt-12">
        <PatchBay />
      </div>
    </div>
  );
};

function App() {
  return (
    <AudioContextProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8">
        <h1 className="text-3xl font-bold mb-12 text-center tracking-tight">Modular Synth</h1>
        <div className="max-w-6xl mx-auto">
          <Synth />
        </div>
      </div>
    </AudioContextProvider>
  );
}

export default App;
