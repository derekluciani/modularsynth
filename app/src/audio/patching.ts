import type { AudioModuleRegistryItem } from './types';

export const makeConnection = (
  sourceModule: AudioModuleRegistryItem,
  sourceNodeName: string,
  destModule: AudioModuleRegistryItem,
  destInputName: string,
  isParam: boolean
): boolean => {
  const sourceNode = sourceModule.outputs[sourceNodeName];
  
  if (!sourceNode) {
    console.error(`Source node '${sourceNodeName}' not found in module '${sourceModule.id}'`);
    return false;
  }

  try {
    if (isParam) {
      const destParam = destModule.params[destInputName] as AudioParam;
      if (!destParam) {
        console.error(`Destination param '${destInputName}' not found in module '${destModule.id}'`);
        return false;
      }
      sourceNode.connect(destParam);
    } else {
      const destNode = destModule.inputs[destInputName] as AudioNode;
      if (!destNode) {
        console.error(`Destination input node '${destInputName}' not found in module '${destModule.id}'`);
        return false;
      }
      sourceNode.connect(destNode);
    }
    return true;
  } catch (err) {
    console.error("Error making connection:", err);
    return false;
  }
};

export const breakConnection = (
  sourceModule: AudioModuleRegistryItem,
  sourceNodeName: string,
  destModule: AudioModuleRegistryItem,
  destInputName: string,
  isParam: boolean
) => {
  const sourceNode = sourceModule.outputs[sourceNodeName];
  
  if (!sourceNode) return;

  try {
    if (isParam) {
      const destParam = destModule.params[destInputName] as AudioParam;
      if (destParam) {
        sourceNode.disconnect(destParam);
      }
    } else {
      const destNode = destModule.inputs[destInputName] as AudioNode;
      if (destNode) {
        sourceNode.disconnect(destNode);
      }
    }
  } catch (err) {
    console.warn("Error breaking connection (might already be disconnected):", err);
  }
};
