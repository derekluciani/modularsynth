class RandomProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._lastUpdate = 0;
    this._value = 0;
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'rate',
        defaultValue: 1,
        minValue: 0.1,
        maxValue: 20,
        automationRate: 'k-rate'
      }
    ];
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const rate = parameters.rate[0];
    const interval = sampleRate / rate;

    for (let channel = 0; channel < output.length; channel++) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; i++) {
        const frame = currentFrame + i;
        if (frame >= this._lastUpdate) {
          this._value = Math.random() * 2 - 1;
          this._lastUpdate = frame + interval;
        }
        outputChannel[i] = this._value;
      }
    }

    return true;
  }
}

registerProcessor('random-processor', RandomProcessor);
