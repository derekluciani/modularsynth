import { AudioContextProvider } from './context/AudioContextProvider';
import { Oscillator } from './components/modules/Oscillator';
import { AudioOut } from './components/modules/AudioOut';
import { Filter } from './components/modules/Filter';
import { LFO } from './components/modules/LFO';
import { Amp } from './components/modules/Amp';
import { Delay } from './components/modules/Delay';
import { Random } from './components/modules/Random';
import { Distortion } from './components/modules/Distortion';
import { PatchBay } from './components/PatchBay';
import { SpectrumAnalyzer } from './components/SpectrumAnalyzer';

const Synth = () => {
  return (
    <div className="space-y-4">
      {/* Row: Modulation */}
      <div className="flex flex-wrap justify-center gap-4">
        <LFO id="lfo-1" name="LFO 1" />
        <LFO id="lfo-2" name="LFO 2" />
        <LFO id="lfo-3" name="LFO 3" />
        <Random id="random-1" name="Random" />
      </div>
      {/* Row: Oscillators */}
      <div className="flex flex-wrap justify-center gap-4">
        <Oscillator id="osc-1" name="Oscillator 1" />
        <Oscillator id="osc-2" name="Oscillator 2" />
        <Oscillator id="osc-3" name="Oscillator 3" />
        <Oscillator id="osc-4" name="Oscillator 4" />
      </div>
      {/* Row: EQ & Effects */}
      <div className="flex flex-wrap justify-center gap-4">
        <Filter id="filter-1" name="Filter 1" />
        <Filter id="filter-2" name="Filter 2" />
        <Distortion id="dist-1" name="Distortion" />
        <Delay id="delay-1" name="Delay" />
      </div>
      {/* Row: Amp & Audio Out */}
      <div className="flex flex-wrap justify-center gap-4">
        <Amp id="amp-1" name="Amp" />
        <AudioOut id="master" />
      </div>
      {/* Patch Bay */}
      <div className="flex flex-col gap-4 mt-12 max-w-4xl mx-auto">
        <SpectrumAnalyzer />
        <PatchBay />
      </div>
    </div>
  );
};

function App() {
  return (
    <AudioContextProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8">
        <div className="flex justify-center items-baseline gap-4 mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Modular Synth</h1>
          <h1 className="text-md font-serif text-zinc-500">v2.2</h1>
        </div>  
        <div className="max-w-6xl mx-auto">
          <Synth />
        </div>
      </div>
    </AudioContextProvider>
  );
}

export default App;
