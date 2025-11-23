class RandomProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.lastUpdate = 0;
    this.sampleHoldValue = 0;
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
    
    // Sample rate is global, e.g. 44100 or 48000
    // We want to update the random value 'rate' times per second.
    // Interval in samples = sampleRate / rate
    const interval = sampleRate / rate;

    for (let channel = 0; channel < output.length; channel++) {
      const outputChannel = output[channel];
      
      for (let i = 0; i < outputChannel.length; i++) {
        // Basic Sample & Hold Logic
        if (currentFrame - this.lastUpdate >= interval) {
          this.sampleHoldValue = (Math.random() * 2) - 1; // -1 to 1
          this.lastUpdate = currentFrame;
        }
        outputChannel[i] = this.sampleHoldValue;
      }
    }

    return true;
  }
}

registerProcessor('random-processor', RandomProcessor);
