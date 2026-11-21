import React, { useEffect, useRef, useState, useMemo } from "react";
import { useAudioContext } from "../../context/AudioContext";
import { useAudioModule } from "../../audio/useAudioModule";
import { createFilterCutoffControl, FILTER_CUTOFF_MIN_HZ } from "../../audio/filterCutoff";
import { logarithmicSlider } from "../../midi/parameter";
import { useContinuousParameter } from "../../midi/useContinuousParameter";
import { DEFAULT_PATCH } from "../../audio/defaultPatch";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Slider } from "../ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";

interface FilterProps {
  id: string;
  name: string;
}

interface FilterState {
  cutoff?: number;
  res?: number;
  type?: BiquadFilterType;
}

const cutoffScale = logarithmicSlider({ min: FILTER_CUTOFF_MIN_HZ, max: 20000 });
const resonanceScale = logarithmicSlider({ min: 0.1, max: 20 });

export const Filter: React.FC<FilterProps> = ({ id, name }) => {
  const { audioCtx } = useAudioContext();
  const defaultValues =
    (DEFAULT_PATCH.modules[id as keyof typeof DEFAULT_PATCH.modules] as unknown as FilterState) ||
    {};

  const {
    value: cutoff,
    setFromPatch: setCutoffFromPatch,
    slider: cutoffSlider,
  } = useContinuousParameter(
    { moduleId: id, moduleName: name, parameterId: "cutoff", label: "Cutoff", scale: cutoffScale },
    defaultValues.cutoff ?? 1000,
  );
  const {
    value: res,
    setFromPatch: setResFromPatch,
    slider: resonanceSlider,
  } = useContinuousParameter(
    {
      moduleId: id,
      moduleName: name,
      parameterId: "res",
      label: "Resonance",
      scale: resonanceScale,
    },
    defaultValues.res ?? 1,
  );
  const [type, setType] = useState<BiquadFilterType>(
    (defaultValues.type as BiquadFilterType) ?? "lowpass",
  );

  const [nodes, setNodes] = useState<{
    filter: BiquadFilterNode;
    cutoffControl: ReturnType<typeof createFilterCutoffControl>;
  } | null>(null);

  useEffect(() => {
    if (!audioCtx) return;

    const filter = audioCtx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = res;
    const cutoffControl = createFilterCutoffControl({ filter, initialCutoffHz: cutoff });
    setNodes({ filter, cutoffControl });

    return () => {
      cutoffControl.dispose();
      filter.disconnect();
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [audioCtx]);

  useEffect(() => {
    if (nodes) {
      nodes.filter.type = type;
    }
  }, [type, nodes]);

  useEffect(() => {
    nodes?.cutoffControl.setCutoff(cutoff);
  }, [cutoff, nodes]);

  useEffect(() => {
    if (nodes && audioCtx) {
      nodes.filter.Q.setTargetAtTime(res, audioCtx.currentTime, 0.01);
    }
  }, [res, audioCtx, nodes]);

  // Refs for state access in moduleDef
  const cutoffRef = useRef(cutoff);
  const resRef = useRef(res);
  const typeRef = useRef(type);

  useEffect(() => {
    cutoffRef.current = cutoff;
  }, [cutoff]);
  useEffect(() => {
    resRef.current = res;
  }, [res]);
  useEffect(() => {
    typeRef.current = type;
  }, [type]);

  const moduleDef = useMemo(
    () =>
      nodes
        ? {
            type: "Filter" as const,
            inputs: {
              input: nodes.filter,
              cutoff: nodes.cutoffControl.modulationInput,
              resonance: nodes.filter.Q,
            },
            outputs: {
              output: nodes.filter,
            },
            params: {
              cutoff: nodes.cutoffControl.modulationInput,
              resonance: nodes.filter.Q,
            },
            getState: () => ({
              cutoff: cutoffRef.current,
              res: resRef.current,
              type: typeRef.current,
            }),
            setState: (state: Record<string, unknown>) => {
              const s = state as unknown as FilterState;
              if (typeof s.cutoff === "number" && Number.isFinite(s.cutoff))
                setCutoffFromPatch(s.cutoff);
              if (typeof s.res === "number" && Number.isFinite(s.res)) setResFromPatch(s.res);
              if (s.type !== undefined) setType(s.type);
            },
          }
        : null,
    [nodes, setCutoffFromPatch, setResFromPatch],
  );

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
            <Label>Cutoff</Label>
            <span>{Math.round(cutoff)} Hz</span>
          </div>
          <Slider {...cutoffSlider} className="[&_.absolute]:bg-filter" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <Label>Resonance</Label>
            <span>{res.toFixed(2)}</span>
          </div>
          <Slider {...resonanceSlider} className="[&_.absolute]:bg-filter" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-zinc-400">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as BiquadFilterType)}>
            <SelectTrigger className="h-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
              <SelectItem value="lowpass">Lowpass</SelectItem>
              <SelectItem value="bandpass">Bandpass</SelectItem>
              <SelectItem value="highpass">Highpass</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
