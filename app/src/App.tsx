import { AudioContextProvider, useAudioContext } from './context/AudioContextProvider';
import { Oscillator } from './components/modules/Oscillator';
import { AudioOut } from './components/modules/AudioOut';
import { Button } from './components/ui/button';

const Synth = () => {
  const { connect, disconnect, connections } = useAudioContext();

  const handleTestConnection = () => {
    // Check if already connected
    const existing = connections.find(
      c => c.sourceModuleId === 'osc1' && c.destModuleId === 'master'
    );

    if (existing) {
      disconnect(existing.id);
    } else {
      connect('osc1', 'output', 'master', 'input');
    }
  };

  const isConnected = connections.some(
    c => c.sourceModuleId === 'osc1' && c.destModuleId === 'master'
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-center gap-8 items-start">
        <Oscillator id="osc1" name="Oscillator 1" />
        
        <div className="flex flex-col justify-center h-32">
            <Button 
              variant={isConnected ? "default" : "outline"}
              onClick={handleTestConnection}
              className={isConnected ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isConnected ? "Connected" : "Connect Osc -> Master"}
            </Button>
        </div>

        <AudioOut id="master" />
      </div>
      
      <div className="max-w-md mx-auto mt-8 p-4 border border-zinc-800 rounded bg-zinc-900/50 text-xs text-zinc-400">
        <h3 className="font-bold mb-2">Active Connections:</h3>
        {connections.length === 0 ? (
          <p>No connections.</p>
        ) : (
          <ul className="list-disc pl-4">
            {connections.map(c => (
              <li key={c.id}>
                {c.sourceModuleId} ({c.sourceNodeName}) → {c.destModuleId} ({c.destInputName})
              </li>
            ))}
          </ul>
        )}
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
