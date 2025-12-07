import { useState, useEffect } from "react";
import { AudioContextProvider } from "./context/AudioContextProvider";
import { Oscillator } from "./components/modules/Oscillator";
import { AudioOut } from "./components/modules/AudioOut";
import { Filter } from "./components/modules/Filter";
import { LFO } from "./components/modules/LFO";
import { Amp } from "./components/modules/Amp";
import { Delay } from "./components/modules/Delay";
import { Random } from "./components/modules/Random";
import { Distortion } from "./components/modules/Distortion";
import { PatchBay } from "./components/PatchBay";
import { SpectrumAnalyzer } from "./components/SpectrumAnalyzer";
import { PresetManager } from "./components/PresetManager";
import { ThemeSelector } from "./components/ThemeSelector";

const Synth = () => {
  return (
    <div className="space-y-2">
      <SpectrumAnalyzer />
      <div className="flex flex-wrap justify-center gap-2">
        <Oscillator id="osc-1" name="Oscillator 1" />
        <Oscillator id="osc-2" name="Oscillator 2" />
        <Oscillator id="osc-3" name="Oscillator 3" />
        <Oscillator id="osc-4" name="Oscillator 4" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Filter id="filter-1" name="Filter 1" />
        <Filter id="filter-2" name="Filter 2" />
        <Distortion id="distort" name="Distortion" />
        <Delay id="delay" name="Delay" />
        <Random id="random" name="Random" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <LFO id="lfo-1" name="LFO 1" />
        <LFO id="lfo-2" name="LFO 2" />
        <LFO id="lfo-3" name="LFO 3" />
        <Amp id="amp" name="Amp" />
        <AudioOut id="speaker" />
      </div>
      {/* Patch Bay */}
      <div className="flex flex-wrap justify-center gap-4 mt-12">
        <PatchBay />
      </div>
    </div>
  );
};

function App() {
  const [currentTheme, setCurrentTheme] = useState("stranger-things");

  useEffect(() => {
    // Remove all known themes
    document.body.classList.remove("stranger-things", "minimal");
    // Add the selected theme
    document.body.classList.add(currentTheme);
  }, [currentTheme]);

  return (
    <AudioContextProvider>
      <main className="min-h-screen max-w-6xl mx-auto p-8 transition-colors duration-300">
        <header className="flex justify-center items-baseline gap-4 mb-12">
          <h1 className="text-zinc-100 text-3xl font-bold tracking-tight">
            Modular Synthesizer
          </h1>
          <h1 className="text-md font-serif text-zinc-500">v2.6</h1>
          <div className="ml-auto">
            <PresetManager />
          </div>
        </header>
        <Synth />
        <footer className="flex flex-wrap justify-center items-center gap-6 font-light text-zinc-600 text-xs mt-9">
          <div>
            Created by{" "}
            <a
              href="https://github.com/derekluciani/modularsynth"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-zinc-600 hover:text-zinc-700"
            >
              derekluciani
            </a>{" "}
            with agentic LLMs
          </div>
          <ThemeSelector
            currentTheme={currentTheme}
            onThemeChange={setCurrentTheme}
          />
        </footer>
      </main>
    </AudioContextProvider>
  );
}

export default App;
