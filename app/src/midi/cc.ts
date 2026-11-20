export const MAX_CC_VALUE = 127;

export type InputId = string & { readonly __brand: "InputId" };
type MidiChannel = number & { readonly __brand: "MidiChannel" };
type ControlNumber = number & { readonly __brand: "ControlNumber" };
type ControlValue = number & { readonly __brand: "ControlValue" };

export type CcSource = { channel: MidiChannel; cc: ControlNumber };
export type ControlChange = CcSource & { value: ControlValue };

export const isInputId = (input: unknown): input is InputId =>
  typeof input === "string" && input.length > 0;

const isIntegerInRange = (input: unknown, min: number, max: number): input is number =>
  typeof input === "number" && Number.isInteger(input) && input >= min && input <= max;

export const isMidiChannel = (input: unknown): input is MidiChannel =>
  isIntegerInRange(input, 1, 16);
export const isControlNumber = (input: unknown): input is ControlNumber =>
  isIntegerInRange(input, 0, MAX_CC_VALUE);
const isControlValue = (input: unknown): input is ControlValue =>
  isIntegerInRange(input, 0, MAX_CC_VALUE);

export function decodeControlChange(data: unknown): ControlChange | null {
  if (!(data instanceof Uint8Array) || data.length !== 3) return null;
  const [status, cc, value] = data;
  if ((status & 0xf0) !== 0xb0) return null;
  const channel = (status & 0x0f) + 1;
  if (!isMidiChannel(channel) || !isControlNumber(cc) || !isControlValue(value)) return null;
  return { channel, cc, value };
}

export const sameSource = (first: CcSource, second: CcSource) =>
  first.channel === second.channel && first.cc === second.cc;
