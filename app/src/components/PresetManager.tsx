import React, { useState, useEffect } from 'react';
import { useAudioContext } from '../context/AudioContextProvider';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from './ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Download, Upload, Save, FolderOpen } from 'lucide-react';

interface PatchData {
    name: string;
    patchID: number;
    modules: Record<string, any>;
    connections: Array<{
        sourceId: string;
        sourceNode: string;
        destId: string;
        destInput: string;
    }>;
}

export const PresetManager: React.FC = () => {
    const { modules, connections, loadPatch, resumeContext } = useAudioContext();
    const [presets, setPresets] = useState<PatchData[]>([]);
    const [newPresetName, setNewPresetName] = useState('');
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

    // Load presets from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('synth_presets');
        if (saved) {
            try {
                setPresets(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse presets', e);
            }
        }
    }, []);

    const savePatch = () => {
        resumeContext();
        if (!newPresetName.trim()) return;

        const moduleStates: Record<string, any> = {};
        Object.values(modules).forEach((mod) => {
            if (mod.getState) {
                moduleStates[mod.id] = mod.getState();
            }
        });

        const patchConnections = connections.map(c => ({
            sourceId: c.sourceModuleId,
            sourceNode: c.sourceNodeName,
            destId: c.destModuleId,
            destInput: c.destInputName
        }));

        const newPatch: PatchData = {
            name: newPresetName,
            patchID: Date.now(),
            modules: moduleStates,
            connections: patchConnections
        };
        // localStorage ≠ actual “file”.
        // It’s a browser-managed key-value store, persisted in a private database inside the browser’s profile folder.
        // LocalStorage is stored per-origin (unique per domain + protocol + port).
        // It’s persistent unless the user:
        // Clears browsing data
        // Uses private/incognito mode (where it's temporary)
        // Has storage disabled
        // You cannot read or write these files directly from JavaScript; you only access them through the localStorage API.
        // Browsers store this data in a disk-backed database, not as a simple JSON file.
        const updatedPresets = [newPatch, ...presets]; // LIFO
        setPresets(updatedPresets);
        localStorage.setItem('synth_presets', JSON.stringify(updatedPresets));

        setNewPresetName('');
        setIsSaveDialogOpen(false);
        // window.location.reload(); // Removed to prevent resetting to default patch
    };

    const exportPatch = () => {
        const moduleStates: Record<string, any> = {};
        Object.values(modules).forEach((mod) => {
            if (mod.getState) {
                moduleStates[mod.id] = mod.getState();
            }
        });

        const patchConnections = connections.map(c => ({
            sourceId: c.sourceModuleId,
            sourceNode: c.sourceNodeName,
            destId: c.destModuleId,
            destInput: c.destInputName
        }));

        const patchData: PatchData = {
            name: 'Exported Patch',
            patchID: Date.now(),
            modules: moduleStates,
            connections: patchConnections
        };

        const blob = new Blob([JSON.stringify(patchData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patch-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importPatch = (event: React.ChangeEvent<HTMLInputElement>) => {
        resumeContext();
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const patch = JSON.parse(content) as PatchData;

                // Basic validation
                if (!patch.modules || !patch.connections) {
                    throw new Error('Invalid patch format');
                }

                loadPatch(patch);
            } catch (err) {
                console.error(err);
                alert("The file failed to load, please try again. If the problem persists, check for issues with the patch data.");
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };

    return (
        <div className="flex gap-2 items-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300">
                        <FolderOpen className="w-4 h-4" />
                        Load
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-950 border-zinc-800 text-zinc-100 w-56">
                    {presets.length === 0 ? (
                        <div className="p-2 text-sm text-zinc-500">No saved patches</div>
                    ) : (
                        presets.map((preset, i) => (
                            <DropdownMenuItem
                                key={i}
                                onClick={() => {
                                    resumeContext();
                                    loadPatch(preset);
                                }}
                                className="focus:bg-zinc-900 focus:text-zinc-100 cursor-pointer"
                            >
                                {preset.name}
                            </DropdownMenuItem>
                        ))
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300">
                        <Save className="w-4 h-4" />
                        Save
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <DialogHeader>
                        <DialogTitle>Save Patch</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="name" className="mb-2 block">Patch Name</Label>
                        <Input
                            id="name"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-zinc-100"
                            placeholder="My Cool Patch"
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={savePatch} className="bg-emerald-600 hover:bg-emerald-700 text-white">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="h-6 w-px bg-zinc-800 mx-2" />

            <Button variant="outline" size="sm" onClick={exportPatch} className="gap-2 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300">
                <Upload className="w-4 h-4" />
                Export
            </Button>

            <div className="relative">
                <input
                    type="file"
                    accept=".json"
                    onChange={importPatch}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm" className="gap-2 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 pointer-events-none">
                    <Download className="w-4 h-4" />
                    Import
                </Button>
            </div>
        </div>
    );
};
