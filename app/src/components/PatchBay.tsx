import React, { useState } from 'react';
import { useAudioContext } from '../context/AudioContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Trash2, RefreshCw } from 'lucide-react';

export const PatchBay: React.FC = () => {
  const { modules, connections, connect, disconnect, resetConnections } = useAudioContext();
  
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [selectedDestId, setSelectedDestId] = useState<string>('');
  const [selectedDestInput, setSelectedDestInput] = useState<string>('');
  
  // Filtering sources: Only audio nodes (Osc, LFO, etc.) can be sources.
  // Actually, useAudioModule outputs define valid sources.
  const sourceOptions = Object.entries(modules).flatMap(([modId, mod]) => 
    Object.keys(mod.outputs).map(nodeName => ({
      id: modId,
      node: nodeName,
      label: `${modId} > ${nodeName}`
    }))
  );

  // Filtering destinations: Inputs and Params
  const destOptions = Object.entries(modules).flatMap(([modId, mod]) => {
    const inputs = Object.keys(mod.inputs).map(inputName => ({
      id: modId,
      input: inputName,
      type: 'input',
      label: `${modId} > ${inputName} (Input)`
    }));
    const params = Object.keys(mod.params).map(paramName => ({
      id: modId,
      input: paramName,
      type: 'param',
      label: `${modId} > ${paramName} (Param)`
    }));
    return [...inputs, ...params];
  });

  const handleConnect = () => {
    if (!selectedSourceId || !selectedDestId || !selectedDestInput) return;
    
    const [sourceId, sourceNode] = selectedSourceId.split(':');
    const destId = selectedDestId;
    const destInput = selectedDestInput;

    if (sourceId === destId) {
      // Validation as per requirements
      return;
    }

    connect(sourceId, sourceNode, destId, destInput);
    
    // Reset selection
    setSelectedSourceId('');
    setSelectedDestId('');
    setSelectedDestInput('');
  };

  const isSelfPatch = selectedSourceId && selectedDestId && selectedSourceId.split(':')[0] === selectedDestId;

  return (
    <Card className="w-full max-w-4xl bg-zinc-900 border-zinc-800 shadow-lg">
      <CardHeader className="border-b border-zinc-800 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-zinc-100">Patch Bay</CardTitle>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={resetConnections}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Reset / Restore Default
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        {/* New Connection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Source (Output)</label>
            <Select 
              value={selectedSourceId} 
              onValueChange={(val) => setSelectedSourceId(val)}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-200">
                <SelectValue placeholder="Select Source..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200 max-h-60">
                {sourceOptions.map(opt => (
                  <SelectItem key={`${opt.id}:${opt.node}`} value={`${opt.id}:${opt.node}`}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Destination (Input)</label>
            <Select 
              value={selectedDestId ? `${selectedDestId}:${selectedDestInput}` : ''} 
              onValueChange={(val) => {
                const [modId, inputName] = val.split(':');
                setSelectedDestId(modId);
                setSelectedDestInput(inputName);
              }}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-200">
                <SelectValue placeholder="Select Destination..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200 max-h-60">
                {destOptions.map(opt => (
                  <SelectItem key={`${opt.id}:${opt.input}`} value={`${opt.id}:${opt.input}`}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleConnect} 
            disabled={!selectedSourceId || !selectedDestId || (isSelfPatch as boolean)}
            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
          >
            Patch
          </Button>
        </div>

        {isSelfPatch && (
          <div className="text-red-500 text-xs font-medium">
            Source and destination cannot be the same module.
          </div>
        )}

        {/* Active Connections List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Active Connections</h3>
          {connections.length === 0 ? (
            <div className="text-zinc-500 text-sm italic py-4 text-center border border-dashed border-zinc-800 rounded">
              No active patches. Connect modules above.
            </div>
          ) : (
            <div className="grid gap-2">
              {connections.map(conn => (
                <div 
                  key={conn.id} 
                  className="flex items-center justify-between p-3 rounded bg-zinc-800/50 border border-zinc-700/50 group hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-400 font-mono">{conn.sourceModuleId}</span>
                    <span className="text-zinc-500">→</span>
                    <span className="text-purple-400 font-mono">{conn.destModuleId}</span>
                    <span className="text-zinc-600 text-xs">({conn.destInputName})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => disconnect(conn.id)}
                    className="h-6 w-6 text-zinc-500 hover:text-red-400 hover:bg-zinc-700/50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
};
