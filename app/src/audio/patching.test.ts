import { expect, it, vi } from "vite-plus/test";
import { breakConnection, makeConnection } from "./patching";
import type { AudioModuleRegistryItem } from "./types";

function moduleWith(id: string, ports: Partial<AudioModuleRegistryItem>): AudioModuleRegistryItem {
  return {
    id,
    type: "Amp",
    inputs: {},
    outputs: {},
    params: {},
    getState: () => ({}),
    setState: vi.fn(),
    ...ports,
  };
}

it.each([false, true])("connects and disconnects the selected port (parameter: %s)", (isParam) => {
  const output = { connect: vi.fn(), disconnect: vi.fn() };
  const input = {} as AudioNode;
  const param = {} as AudioParam;
  const source = moduleWith("source", { outputs: { out: output as unknown as AudioNode } });
  const destination = moduleWith("destination", { inputs: { in: input }, params: { in: param } });
  const port = isParam ? param : input;

  expect(makeConnection(source, "out", destination, "in", isParam)).toBe(true);
  expect(output.connect).toHaveBeenCalledExactlyOnceWith(port);

  breakConnection(source, "out", destination, "in", isParam);
  expect(output.disconnect).toHaveBeenCalledExactlyOnceWith(port);
});
