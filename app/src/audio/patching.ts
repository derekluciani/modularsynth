import type { AudioModuleRegistryItem, Connection } from "./types";

const AMPLITUDE_SMOOTHING_SECONDS = 0.002;

function isAmplitudeParam(module: AudioModuleRegistryItem, name: string) {
  return (
    (module.type === "Oscillator" && name === "level") ||
    (module.type === "Amp" && name === "gain") ||
    (module.type === "AudioOut" && name === "volume")
  );
}

function connectSmoothedAmplitude(source: AudioNode, destination: AudioParam) {
  // Round the modulation edges at audio rate, with unity DC gain and no change to the knob value.
  const blend = -Math.expm1(-1 / (source.context.sampleRate * AMPLITUDE_SMOOTHING_SECONDS));
  const smoother = source.context.createIIRFilter([blend], [1, blend - 1]);
  smoother.connect(destination);
  try {
    source.connect(smoother);
  } catch (err) {
    smoother.disconnect();
    throw err;
  }

  return () => {
    smoother.disconnect();
    source.disconnect(smoother);
  };
}

interface CablePorts {
  sourceModule: AudioModuleRegistryItem;
  sourceNodeName: Connection["sourceNodeName"];
  destModule: AudioModuleRegistryItem;
  destInputName: Connection["destInputName"];
}

export function createPatchConnections() {
  const cables = new Map<string, { connection: Connection; detach: () => void }>();

  const connect = ({ sourceModule, sourceNodeName, destModule, destInputName }: CablePorts) => {
    const source = sourceModule.outputs[sourceNodeName];
    if (!source) {
      console.error(`Source node '${sourceNodeName}' not found in module '${sourceModule.id}'`);
      return false;
    }

    const param = destModule.params[destInputName];
    const input = param ? undefined : destModule.inputs[destInputName];
    const id = JSON.stringify([sourceModule.id, sourceNodeName, destModule.id, destInputName]);
    if (cables.has(id)) return false;

    try {
      let detach: () => void;
      if (param) {
        if (sourceModule.type === "LFO" && isAmplitudeParam(destModule, destInputName)) {
          detach = connectSmoothedAmplitude(source, param);
        } else {
          source.connect(param);
          detach = () => source.disconnect(param);
        }
      } else if (input && "connect" in input) {
        source.connect(input);
        detach = () => source.disconnect(input);
      } else {
        console.error(
          `Destination input '${destInputName}' not found on module '${destModule.id}'`,
        );
        return false;
      }

      cables.set(id, {
        connection: {
          id,
          sourceModuleId: sourceModule.id,
          sourceNodeName,
          destModuleId: destModule.id,
          destInputName,
          isParam: !!param,
        },
        detach,
      });
      return true;
    } catch (err) {
      console.error("Error making connection:", err);
      return false;
    }
  };

  const disconnect = (id: string) => {
    const cable = cables.get(id);
    if (!cable) return false;

    cables.delete(id);
    try {
      cable.detach();
    } catch (err) {
      // Module cleanup can already have disconnected the source node's outputs.
      if (!(err instanceof DOMException && err.name === "InvalidAccessError")) {
        console.warn("Error breaking connection:", err);
      }
    }
    return true;
  };

  return {
    connect,
    disconnect,
    getConnections: () => Array.from(cables.values(), ({ connection }) => connection),
    removeModule: (moduleId: string) => {
      const previousSize = cables.size;
      for (const [id, { connection }] of cables) {
        if (connection.sourceModuleId === moduleId || connection.destModuleId === moduleId) {
          disconnect(id);
        }
      }
      return cables.size !== previousSize;
    },
    clear: () => {
      for (const id of cables.keys()) disconnect(id);
    },
  };
}
