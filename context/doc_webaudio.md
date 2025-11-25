# Web Audio API Specification

## Introduction

The Web Audio API is a high-level W3C specification designed for processing and synthesizing audio in web applications. It provides developers with a comprehensive toolkit for creating sophisticated audio experiences directly in the browser, from simple sound playback to complex music production and spatial audio. The API follows a modular routing graph paradigm where AudioNode objects connect together to define the overall audio rendering, with actual processing happening in optimized native code for high performance while supporting custom JavaScript processing through AudioWorklet.

This specification targets a wide range of audio applications including games, interactive media, music production tools, real-time audio effects, voice communication, audio analysis, and immersive 3D audio experiences. The API integrates seamlessly with other web platform features like HTML media elements, WebRTC MediaStreams, Canvas for visualization, and provides both real-time and offline rendering capabilities. With support for sample-accurate scheduling, automation, convolution, dynamics processing, spatial audio, and custom DSP, the Web Audio API enables professional-grade audio applications in the browser.

## API Reference

### AudioContext - Real-time Audio Processing Context

The AudioContext interface represents an audio processing graph built from audio modules (AudioNodes) linked together. It controls both the creation of nodes and the execution of audio processing or decoding. An AudioContext is designed for real-time audio output to the device speakers or audio interface.

```javascript
// Create a new audio context
const context = new AudioContext();

// Check context state
console.log(context.state); // "running", "suspended", "closed", or "interrupted"

// Access key properties
console.log(context.sampleRate);      // e.g., 48000 (Hz)
console.log(context.currentTime);     // Current playback time in seconds
console.log(context.destination);     // Final output node
console.log(context.listener);        // AudioListener for 3D audio

// Resume audio context (required in many browsers after user interaction)
document.addEventListener('click', async () => {
    if (context.state === 'suspended') {
        await context.resume();
        console.log('AudioContext resumed');
    }
});

// Suspend and close context
await context.suspend();  // Pause audio processing
await context.close();    // Close context and release resources
```

### OfflineAudioContext - Non-realtime Audio Rendering

OfflineAudioContext renders audio to an AudioBuffer instead of outputting to speakers, useful for processing audio files, bouncing tracks, or creating audio assets programmatically without real-time constraints.

```javascript
// Create offline context: 2 channels, 5 seconds at 44.1kHz
const offlineContext = new OfflineAudioContext({
    numberOfChannels: 2,
    length: 44100 * 5,
    sampleRate: 44100
});

// Build audio graph
const oscillator = offlineContext.createOscillator();
const gain = offlineContext.createGain();

oscillator.frequency.value = 440;
gain.gain.value = 0.5;

oscillator.connect(gain);
gain.connect(offlineContext.destination);

// Schedule playback
oscillator.start(0);
oscillator.stop(5);

// Render audio to buffer
const renderedBuffer = await offlineContext.startRendering();

console.log(`Rendered ${renderedBuffer.duration} seconds`);
console.log(`Channels: ${renderedBuffer.numberOfChannels}`);
console.log(`Sample rate: ${renderedBuffer.sampleRate}`);

// Use rendered buffer in real-time context
const rtContext = new AudioContext();
const source = rtContext.createBufferSource();
source.buffer = renderedBuffer;
source.connect(rtContext.destination);
source.start(0);
```

### OscillatorNode - Waveform Generator

OscillatorNode generates periodic waveforms for tone generation, synthesis, and modulation. Supports sine, square, sawtooth, triangle, and custom waveforms.

```javascript
const context = new AudioContext();

// Create oscillator with different waveforms
const sine = context.createOscillator();
sine.type = 'sine';
sine.frequency.value = 440;  // A4 note

const square = context.createOscillator();
square.type = 'square';
square.frequency.value = 220;  // A3 note

// Use detune for fine-tuning (in cents, 100 cents = 1 semitone)
square.detune.value = 5;  // Slightly sharp

// Create gain nodes for mixing
const sineGain = context.createGain();
const squareGain = context.createGain();
sineGain.gain.value = 0.3;
squareGain.gain.value = 0.2;

// Connect to destination
sine.connect(sineGain).connect(context.destination);
square.connect(squareGain).connect(context.destination);

// Start and stop at specific times
const now = context.currentTime;
sine.start(now);
sine.stop(now + 2);  // Play for 2 seconds

square.start(now + 0.5);  // Start 500ms later
square.stop(now + 2.5);

// Create custom waveform using PeriodicWave
const real = new Float32Array([0, 0, 1, 0, 1]);
const imag = new Float32Array(real.length);
const customWave = context.createPeriodicWave(real, imag);

const custom = context.createOscillator();
custom.setPeriodicWave(customWave);
custom.connect(context.destination);
custom.start();
```

### AudioBufferSourceNode - Sample Playback

AudioBufferSourceNode plays audio data stored in an AudioBuffer, ideal for sound effects, music loops, and pre-loaded audio assets.

```javascript
const context = new AudioContext();

// Load audio file via fetch
async function loadSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await context.decodeAudioData(arrayBuffer);
}

// Play sound with looping
async function playSoundEffect() {
    const buffer = await loadSound('explosion.wav');

    const source = context.createBufferSource();
    source.buffer = buffer;

    // Configure looping
    source.loop = true;
    source.loopStart = 0.5;   // Loop start point in seconds
    source.loopEnd = 2.0;     // Loop end point in seconds

    // Playback rate (1.0 = normal, 2.0 = double speed/octave up)
    source.playbackRate.value = 1.0;

    // Detune in cents
    source.detune.value = 0;

    // Connect and play
    const gain = context.createGain();
    gain.gain.value = 0.7;

    source.connect(gain);
    gain.connect(context.destination);

    // Start immediately, stop after 3 seconds
    source.start(0);
    source.stop(context.currentTime + 3);

    // Handle ended event
    source.onended = () => {
        console.log('Playback finished');
    };
}

playSoundEffect();
```

### GainNode - Volume Control and Mixing

GainNode multiplies the input signal by a gain factor, essential for volume control, mixing multiple sources, and creating fade effects.

```javascript
const context = new AudioContext();
const oscillator = context.createOscillator();
const gainNode = context.createGain();

// Set initial gain (0.0 = silence, 1.0 = unity gain, >1.0 = amplification)
gainNode.gain.value = 0.5;

oscillator.connect(gainNode);
gainNode.connect(context.destination);
oscillator.start();

// Fade in over 2 seconds
const now = context.currentTime;
gainNode.gain.setValueAtTime(0, now);
gainNode.gain.linearRampToValueAtTime(1, now + 2);

// Wait 3 seconds at full volume
// Fade out over 1 second
gainNode.gain.setValueAtTime(1, now + 5);
gainNode.gain.exponentialRampToValueAtTime(0.01, now + 6);

// Stop after fade out
oscillator.stop(now + 6);

// Mix multiple sources
function createMixer() {
    const source1 = context.createBufferSource();
    const source2 = context.createBufferSource();
    const source3 = context.createBufferSource();

    const gain1 = context.createGain();
    const gain2 = context.createGain();
    const gain3 = context.createGain();

    const master = context.createGain();

    // Individual channel levels
    gain1.gain.value = 0.8;
    gain2.gain.value = 0.6;
    gain3.gain.value = 0.7;

    // Master level
    master.gain.value = 0.9;

    // Connect mixing graph
    source1.connect(gain1).connect(master);
    source2.connect(gain2).connect(master);
    source3.connect(gain3).connect(master);
    master.connect(context.destination);

    return { source1, source2, source3, gain1, gain2, gain3, master };
}
```

### BiquadFilterNode - Audio Filtering and EQ

BiquadFilterNode implements common second-order filters for tone shaping, equalization, and frequency-selective processing with eight filter types available.

```javascript
const context = new AudioContext();
const source = context.createOscillator();
const filter = context.createBiquadFilter();

// Configure lowpass filter
filter.type = 'lowpass';
filter.frequency.value = 1000;  // Cutoff frequency in Hz
filter.Q.value = 1;             // Resonance (0.0001 to 1000)

source.connect(filter);
filter.connect(context.destination);
source.start();

// Different filter types
function createEQ() {
    const lowShelf = context.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 200;
    lowShelf.gain.value = -10;  // Cut 10dB

    const peaking = context.createBiquadFilter();
    peaking.type = 'peaking';
    peaking.frequency.value = 1000;
    peaking.Q.value = 1;
    peaking.gain.value = 6;  // Boost 6dB

    const highShelf = context.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 8000;
    highShelf.gain.value = 3;  // Boost 3dB

    // Chain filters
    source.connect(lowShelf);
    lowShelf.connect(peaking);
    peaking.connect(highShelf);
    highShelf.connect(context.destination);
}

// Sweep filter frequency
filter.frequency.setValueAtTime(200, context.currentTime);
filter.frequency.exponentialRampToValueAtTime(8000, context.currentTime + 4);

// Get frequency response
const frequencyHz = new Float32Array([100, 1000, 10000]);
const magResponse = new Float32Array(3);
const phaseResponse = new Float32Array(3);
filter.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
console.log('Magnitude response:', magResponse);
```

### DelayNode - Time-based Effects

DelayNode delays the incoming audio signal by a specified time, enabling echo, chorus, flanging, and feedback effects.

```javascript
const context = new AudioContext();
const source = context.createOscillator();

// Create delay with maximum 2 seconds
const delay = context.createDelay(2.0);
delay.delayTime.value = 0.5;  // 500ms delay

const feedback = context.createGain();
feedback.gain.value = 0.4;  // 40% feedback

const wet = context.createGain();
const dry = context.createGain();
wet.gain.value = 0.5;
dry.gain.value = 0.7;

// Simple echo effect
source.connect(dry).connect(context.destination);
source.connect(delay);
delay.connect(wet).connect(context.destination);
delay.connect(feedback).connect(delay);  // Feedback loop

source.start();

// Ping-pong delay (stereo)
function createPingPongDelay() {
    const splitter = context.createChannelSplitter(2);
    const merger = context.createChannelMerger(2);

    const delayL = context.createDelay();
    const delayR = context.createDelay();
    delayL.delayTime.value = 0.3;
    delayR.delayTime.value = 0.3;

    const feedbackL = context.createGain();
    const feedbackR = context.createGain();
    feedbackL.gain.value = 0.5;
    feedbackR.gain.value = 0.5;

    // Split, delay, cross-feedback, merge
    source.connect(splitter);
    splitter.connect(delayL, 0);
    splitter.connect(delayR, 1);

    delayL.connect(feedbackL);
    delayR.connect(feedbackR);

    feedbackL.connect(delayR);  // Cross-feedback
    feedbackL.connect(merger, 0, 0);

    feedbackR.connect(delayL);  // Cross-feedback
    feedbackR.connect(merger, 0, 1);

    merger.connect(context.destination);
}

// Modulate delay time for chorus effect
const lfo = context.createOscillator();
const lfoGain = context.createGain();
lfo.frequency.value = 0.5;
lfoGain.gain.value = 0.005;  // Small modulation

lfo.connect(lfoGain);
lfoGain.connect(delay.delayTime);
lfo.start();
```

### ConvolverNode - Convolution Reverb

ConvolverNode performs linear convolution on the input using an impulse response, ideal for realistic reverb, room simulation, and cabinet modeling.

```javascript
const context = new AudioContext();

// Load impulse response
async function loadImpulseResponse(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await context.decodeAudioData(arrayBuffer);
}

// Create reverb effect
async function createReverb() {
    const source = context.createBufferSource();
    source.buffer = await loadSound('guitar.wav');

    const convolver = context.createConvolver();
    convolver.buffer = await loadImpulseResponse('church-ir.wav');
    convolver.normalize = true;  // Auto-normalize impulse response

    const dry = context.createGain();
    const wet = context.createGain();

    dry.gain.value = 0.6;   // Dry signal level
    wet.gain.value = 0.4;   // Wet (reverb) signal level

    // Parallel wet/dry routing
    source.connect(dry).connect(context.destination);
    source.connect(convolver);
    convolver.connect(wet).connect(context.destination);

    source.start();
}

// Create artificial impulse response
function createArtificialIR(duration, sampleRate, decay) {
    const length = duration * sampleRate;
    const buffer = context.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            // Exponential decay with random noise
            const envelope = Math.exp(-decay * i / sampleRate);
            data[i] = (Math.random() * 2 - 1) * envelope;
        }
    }

    return buffer;
}

const artificialIR = createArtificialIR(2, context.sampleRate, 3);
const convolver = context.createConvolver();
convolver.buffer = artificialIR;
```

### DynamicsCompressorNode - Dynamic Range Control

DynamicsCompressorNode provides dynamics compression to control the dynamic range of audio signals, essential for mastering and mixing.

```javascript
const context = new AudioContext();
const source = context.createOscillator();

// Create compressor
const compressor = context.createDynamicsCompressor();

// Configure compression parameters
compressor.threshold.value = -24;    // dB - start compressing above this
compressor.knee.value = 30;          // Smoothness of compression curve
compressor.ratio.value = 12;         // Compression ratio (12:1)
compressor.attack.value = 0.003;     // Attack time (3ms)
compressor.release.value = 0.25;     // Release time (250ms)

source.connect(compressor);
compressor.connect(context.destination);
source.start();

// Monitor gain reduction
setInterval(() => {
    console.log('Gain reduction:', compressor.reduction, 'dB');
}, 100);

// Mastering chain example
function createMasteringChain() {
    const input = context.createGain();

    // Multi-band compression simulation (simplified)
    const lowComp = context.createDynamicsCompressor();
    const midComp = context.createDynamicsCompressor();
    const highComp = context.createDynamicsCompressor();

    const lowFilter = context.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.value = 250;

    const highFilter = context.createBiquadFilter();
    highFilter.type = 'highpass';
    highFilter.frequency.value = 4000;

    lowComp.threshold.value = -30;
    lowComp.ratio.value = 4;
    midComp.threshold.value = -24;
    midComp.ratio.value = 6;
    highComp.threshold.value = -20;
    highComp.ratio.value = 8;

    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;

    // Connect mastering chain
    input.connect(lowFilter).connect(lowComp);
    input.connect(midComp);
    input.connect(highFilter).connect(highComp);

    const mix = context.createGain();
    lowComp.connect(mix);
    midComp.connect(mix);
    highComp.connect(mix);
    mix.connect(limiter);
    limiter.connect(context.destination);

    return input;
}
```

### AnalyserNode - Audio Analysis and Visualization

AnalyserNode provides real-time frequency and time-domain analysis data for visualizations, meters, and audio-reactive applications.

```javascript
const context = new AudioContext();
const source = context.createOscillator();

// Create analyser
const analyser = context.createAnalyser();
analyser.fftSize = 2048;  // Must be power of 2 (256 to 32768)
analyser.smoothingTimeConstant = 0.8;  // 0 to 1 (0 = no smoothing)
analyser.minDecibels = -90;
analyser.maxDecibels = -10;

source.connect(analyser);
analyser.connect(context.destination);
source.start();

// Get frequency data (0 to maxDecibels dB range, mapped to 0-255)
const frequencyData = new Uint8Array(analyser.frequencyBinCount);

function drawFrequencyBars() {
    analyser.getByteFrequencyData(frequencyData);

    // frequencyData now contains 0-255 values for each frequency bin
    console.log('Frequency bins:', frequencyData.length);
    console.log('First 10 bins:', frequencyData.slice(0, 10));

    requestAnimationFrame(drawFrequencyBars);
}
drawFrequencyBars();

// Get time-domain data (waveform)
const timeDomainData = new Uint8Array(analyser.fftSize);

function drawWaveform() {
    analyser.getByteTimeDomainData(timeDomainData);

    // timeDomainData contains 0-255 values (128 = zero crossing)
    console.log('Waveform samples:', timeDomainData.length);

    requestAnimationFrame(drawWaveform);
}

// Get float data for more precision
const floatFrequencyData = new Float32Array(analyser.frequencyBinCount);
const floatTimeDomainData = new Float32Array(analyser.fftSize);

analyser.getFloatFrequencyData(floatFrequencyData);  // dB values
analyser.getFloatTimeDomainData(floatTimeDomainData); // -1 to 1

// Calculate average volume
function getAverageVolume() {
    analyser.getByteFrequencyData(frequencyData);
    const sum = frequencyData.reduce((acc, val) => acc + val, 0);
    return sum / frequencyData.length;
}

// Detect specific frequency
function detectFrequency(targetHz) {
    const nyquist = context.sampleRate / 2;
    const binSize = nyquist / analyser.frequencyBinCount;
    const binIndex = Math.floor(targetHz / binSize);

    analyser.getByteFrequencyData(frequencyData);
    return frequencyData[binIndex];
}
```

### PannerNode - 3D Spatial Audio

PannerNode positions audio sources in 3D space relative to the listener, providing realistic spatial audio with HRTF processing and distance attenuation.

```javascript
const context = new AudioContext();
const source = context.createOscillator();

// Create panner node
const panner = context.createPanner();

// Configure panning model
panner.panningModel = 'HRTF';  // 'HRTF', 'equalpower'
panner.distanceModel = 'inverse';  // 'linear', 'inverse', 'exponential'

// Set distance parameters
panner.refDistance = 1;        // Reference distance
panner.maxDistance = 10000;    // Maximum distance
panner.rolloffFactor = 1;      // How quickly sound attenuates

// Set source position (x, y, z)
panner.positionX.value = 0;
panner.positionY.value = 0;
panner.positionZ.value = -5;  // 5 meters in front

// Set source orientation
panner.orientationX.value = 0;
panner.orientationY.value = 0;
panner.orientationZ.value = -1;

// Configure directional cone (for cone-based sound sources)
panner.coneInnerAngle = 60;   // Degrees
panner.coneOuterAngle = 120;  // Degrees
panner.coneOuterGain = 0.3;   // Gain outside cone

source.connect(panner);
panner.connect(context.destination);
source.start();

// Set listener position and orientation
context.listener.positionX.value = 0;
context.listener.positionY.value = 0;
context.listener.positionZ.value = 0;

context.listener.forwardX.value = 0;
context.listener.forwardY.value = 0;
context.listener.forwardZ.value = -1;

context.listener.upX.value = 0;
context.listener.upY.value = 1;
context.listener.upZ.value = 0;

// Animate sound moving in circle
function animateSoundPosition() {
    const time = context.currentTime;
    const radius = 5;
    const speed = 0.5;

    panner.positionX.value = Math.cos(time * speed) * radius;
    panner.positionZ.value = Math.sin(time * speed) * radius;

    requestAnimationFrame(animateSoundPosition);
}
animateSoundPosition();

// Game audio example with multiple sources
function createGameAudio(playerX, playerY, playerZ) {
    const sources = [
        { x: 10, y: 0, z: 5, sound: 'enemy1.wav' },
        { x: -5, y: 0, z: 10, sound: 'enemy2.wav' },
        { x: 0, y: 2, z: -8, sound: 'powerup.wav' }
    ];

    sources.forEach(async (src) => {
        const buffer = await loadSound(src.sound);
        const source = context.createBufferSource();
        source.buffer = buffer;

        const panner = context.createPanner();
        panner.positionX.value = src.x;
        panner.positionY.value = src.y;
        panner.positionZ.value = src.z;

        source.connect(panner);
        panner.connect(context.destination);
        source.start();
    });

    // Update listener position to player position
    context.listener.positionX.value = playerX;
    context.listener.positionY.value = playerY;
    context.listener.positionZ.value = playerZ;
}
```

### StereoPannerNode - Simple Stereo Panning

StereoPannerNode provides simple left-right stereo panning without 3D spatial processing overhead.

```javascript
const context = new AudioContext();
const source = context.createOscillator();

// Create stereo panner
const panner = context.createStereoPanner();
panner.pan.value = 0;  // -1 (full left) to 1 (full right), 0 = center

source.connect(panner);
panner.connect(context.destination);
source.start();

// Automate panning
const now = context.currentTime;
panner.pan.setValueAtTime(-1, now);  // Start full left
panner.pan.linearRampToValueAtTime(1, now + 2);  // Pan to right over 2s
panner.pan.linearRampToValueAtTime(-1, now + 4);  // Pan back to left

// Auto-panning effect with LFO
function createAutoPan(frequency) {
    const lfo = context.createOscillator();
    lfo.frequency.value = frequency;
    lfo.type = 'sine';

    const depth = context.createGain();
    depth.gain.value = 1;  // Full panning range

    lfo.connect(depth);
    depth.connect(panner.pan);
    lfo.start();

    return lfo;
}

const autoPanLFO = createAutoPan(0.5);  // 0.5 Hz auto-pan
```

### WaveShaperNode - Distortion and Waveshaping

WaveShaperNode applies non-linear distortion by mapping input samples through a transfer curve, useful for distortion, saturation, and tone coloring effects.

```javascript
const context = new AudioContext();
const source = context.createOscillator();

// Create waveshaper
const waveshaper = context.createWaveShaper();

// Create distortion curve
function makeDistortionCurve(amount) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
    }

    return curve;
}

waveshaper.curve = makeDistortionCurve(50);
waveshaper.oversample = '4x';  // 'none', '2x', '4x' - higher = better quality

const preGain = context.createGain();
const postGain = context.createGain();
preGain.gain.value = 0.5;   // Input level
postGain.gain.value = 0.3;  // Output level (makeup gain)

source.connect(preGain);
preGain.connect(waveshaper);
waveshaper.connect(postGain);
postGain.connect(context.destination);
source.start();

// Soft clipping curve
function makeSoftClipCurve(threshold) {
    const samples = 2048;
    const curve = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
        const x = (i / samples) * 2 - 1;
        if (Math.abs(x) < threshold) {
            curve[i] = x;
        } else {
            curve[i] = threshold * Math.sign(x) +
                      (x - threshold * Math.sign(x)) / (1 + Math.pow((x - threshold * Math.sign(x)) / (1 - threshold), 2));
        }
    }

    return curve;
}

// Bit crusher effect
function makeBitCrusherCurve(bits) {
    const samples = 2048;
    const curve = new Float32Array(samples);
    const levels = Math.pow(2, bits);

    for (let i = 0; i < samples; i++) {
        const x = (i / samples) * 2 - 1;
        curve[i] = Math.round(x * levels) / levels;
    }

    return curve;
}

waveshaper.curve = makeBitCrusherCurve(4);  // 4-bit reduction
```

### ChannelSplitterNode and ChannelMergerNode - Channel Routing

ChannelSplitterNode separates multi-channel audio into individual mono outputs, while ChannelMergerNode combines multiple inputs into a multi-channel output.

```javascript
const context = new AudioContext();

// Create stereo source
const oscillator1 = context.createOscillator();
const oscillator2 = context.createOscillator();
oscillator1.frequency.value = 440;
oscillator2.frequency.value = 550;

// Merge into stereo
const merger = context.createChannelMerger(2);
oscillator1.connect(merger, 0, 0);  // Left channel
oscillator2.connect(merger, 0, 1);  // Right channel

// Split stereo into individual channels
const splitter = context.createChannelSplitter(2);
merger.connect(splitter);

// Process each channel separately
const leftGain = context.createGain();
const rightGain = context.createGain();
leftGain.gain.value = 0.5;
rightGain.gain.value = 0.8;

splitter.connect(leftGain, 0);   // Get left channel
splitter.connect(rightGain, 1);  // Get right channel

// Merge back
const outputMerger = context.createChannelMerger(2);
leftGain.connect(outputMerger, 0, 0);
rightGain.connect(outputMerger, 0, 1);
outputMerger.connect(context.destination);

oscillator1.start();
oscillator2.start();

// Swap left/right channels
function createChannelSwapper() {
    const splitter = context.createChannelSplitter(2);
    const merger = context.createChannelMerger(2);

    // Connect left to right, right to left
    splitter.connect(merger, 0, 1);  // Left input -> Right output
    splitter.connect(merger, 1, 0);  // Right input -> Left output

    return { input: splitter, output: merger };
}
```

### MediaElementAudioSourceNode - HTML Media Integration

MediaElementAudioSourceNode captures audio from HTML `<audio>` or `<video>` elements for processing through the Web Audio API.

```javascript
const context = new AudioContext();

// Create audio element
const audio = document.createElement('audio');
audio.src = 'music.mp3';
audio.controls = true;
document.body.appendChild(audio);

// Create source from media element
const source = context.createMediaElementSource(audio);

// Add effects
const filter = context.createBiquadFilter();
filter.type = 'lowpass';
filter.frequency.value = 2000;

const analyser = context.createAnalyser();
analyser.fftSize = 256;

// Route audio through effects
source.connect(filter);
filter.connect(analyser);
analyser.connect(context.destination);

// Control with JavaScript
document.getElementById('play').addEventListener('click', () => {
    context.resume().then(() => {
        audio.play();
    });
});

// Visualize
const canvas = document.getElementById('visualizer');
const canvasCtx = canvas.getContext('2d');
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
}
draw();
```

### MediaStreamAudioSourceNode - Live Audio Input

MediaStreamAudioSourceNode captures live audio from microphones or other input devices via getUserMedia for real-time processing.

```javascript
const context = new AudioContext();

// Request microphone access
async function setupMicrophoneInput() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: false
            }
        });

        // Create source from stream
        const source = context.createMediaStreamSource(stream);

        // Add real-time effects
        const filter = context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 100;  // Remove low rumble

        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -30;
        compressor.ratio.value = 4;

        const analyser = context.createAnalyser();
        const gain = context.createGain();
        gain.gain.value = 1.5;  // Boost input

        // Connect processing chain
        source.connect(filter);
        filter.connect(compressor);
        compressor.connect(gain);
        gain.connect(analyser);
        analyser.connect(context.destination);

        // Monitor input level
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        function monitorLevel() {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            console.log('Input level:', average);
            requestAnimationFrame(monitorLevel);
        }
        monitorLevel();

        return stream;

    } catch (err) {
        console.error('Microphone access denied:', err);
    }
}

setupMicrophoneInput();
```

### MediaStreamAudioDestinationNode - WebRTC Output

MediaStreamAudioDestinationNode routes processed audio into a MediaStream for transmission via WebRTC or recording with MediaRecorder.

```javascript
const context = new AudioContext();

// Create audio graph
const oscillator = context.createOscillator();
const gain = context.createGain();

oscillator.frequency.value = 440;
gain.gain.value = 0.5;

oscillator.connect(gain);

// Create destination that outputs to MediaStream
const streamDestination = context.createMediaStreamDestination();
gain.connect(streamDestination);

// Get the MediaStream
const outputStream = streamDestination.stream;

// Send to WebRTC peer
const peerConnection = new RTCPeerConnection();
outputStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, outputStream);
});

// Or record the audio
const mediaRecorder = new MediaRecorder(outputStream);
const chunks = [];

mediaRecorder.ondataavailable = (e) => {
    chunks.push(e.data);
};

mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
    const url = URL.createObjectURL(blob);
    const audio = document.createElement('audio');
    audio.src = url;
    audio.controls = true;
    document.body.appendChild(audio);
};

oscillator.start();
mediaRecorder.start();

// Stop after 5 seconds
setTimeout(() => {
    oscillator.stop();
    mediaRecorder.stop();
}, 5000);
```

### AudioParam Automation - Parameter Control

AudioParam provides sample-accurate automation for time-varying parameter control with multiple scheduling methods for envelopes, sweeps, and modulation.

```javascript
const context = new AudioContext();
const oscillator = context.createOscillator();
const gain = context.createGain();

oscillator.connect(gain);
gain.connect(context.destination);

const now = context.currentTime;

// Set value at specific time
gain.gain.setValueAtTime(0, now);

// Linear ramp to value
gain.gain.linearRampToValueAtTime(1, now + 1);

// Hold at value
gain.gain.setValueAtTime(1, now + 2);

// Exponential ramp (more natural for pitch/frequency)
gain.gain.exponentialRampToValueAtTime(0.01, now + 3);

// Target value with time constant (exponential approach)
gain.gain.setTargetAtTime(0.5, now + 4, 0.1);

// Cancel future scheduled values
gain.gain.cancelScheduledValues(now + 5);

// Cancel and hold current value
gain.gain.cancelAndHoldAtTime(now + 6);

oscillator.start(now);
oscillator.stop(now + 10);

// Value curve for complex envelopes
function createADSREnvelope(param, attack, decay, sustain, release, startTime) {
    const attackEnd = startTime + attack;
    const decayEnd = attackEnd + decay;

    param.setValueAtTime(0, startTime);
    param.linearRampToValueAtTime(1, attackEnd);           // Attack
    param.exponentialRampToValueAtTime(sustain, decayEnd); // Decay
    // Sustain (hold at sustain level)
    // Release triggered separately when note ends
}

// Complex automation curve
function createVibratoEnvelope(startTime, duration) {
    const curve = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
        curve[i] = Math.sin((i / 128) * Math.PI * 2 * 5); // 5 cycles
    }
    oscillator.frequency.setValueCurveAtTime(curve, startTime, duration);
}

// Connect AudioNode to AudioParam for modulation
const lfo = context.createOscillator();
const lfoGain = context.createGain();
lfo.frequency.value = 5;
lfoGain.gain.value = 50;  // 50Hz modulation depth

lfo.connect(lfoGain);
lfoGain.connect(oscillator.frequency);  // Modulate oscillator frequency
lfo.start();
```

### AudioWorklet - Custom Audio Processing

AudioWorklet enables custom audio processing with JavaScript running on the audio rendering thread for zero-latency custom DSP algorithms.

```javascript
// Main thread: Load and use AudioWorklet
const context = new AudioContext();

// Load processor module
await context.audioWorklet.addModule('processors.js');

// Create worklet node
const whiteNoiseNode = new AudioWorkletNode(context, 'white-noise-processor');
whiteNoiseNode.connect(context.destination);

// Pass parameters
const gainNode = new AudioWorkletNode(context, 'gain-processor', {
    parameterData: { gain: 0.5 }
});

// Access parameters
gainNode.parameters.get('gain').value = 0.8;

// Communicate with processor via MessagePort
whiteNoiseNode.port.onmessage = (event) => {
    console.log('Message from processor:', event.data);
};

whiteNoiseNode.port.postMessage({ command: 'setFrequency', value: 440 });

// ===================================
// processors.js - AudioWorklet module
// ===================================

// White noise generator
class WhiteNoiseProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const output = outputs[0];

        for (let channel = 0; channel < output.length; channel++) {
            const outputChannel = output[channel];
            for (let i = 0; i < outputChannel.length; i++) {
                outputChannel[i] = Math.random() * 2 - 1;
            }
        }

        return true;  // Keep processor alive
    }
}

registerProcessor('white-noise-processor', WhiteNoiseProcessor);

// Parameterized gain processor
class GainProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [{
            name: 'gain',
            defaultValue: 1,
            minValue: 0,
            maxValue: 1
        }];
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        const gain = parameters.gain;

        for (let channel = 0; channel < input.length; channel++) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];

            // Handle a-rate (per-sample) automation
            if (gain.length > 1) {
                for (let i = 0; i < inputChannel.length; i++) {
                    outputChannel[i] = inputChannel[i] * gain[i];
                }
            } else {
                // k-rate (per-block) parameter
                const gainValue = gain[0];
                for (let i = 0; i < inputChannel.length; i++) {
                    outputChannel[i] = inputChannel[i] * gainValue;
                }
            }
        }

        return true;
    }
}

registerProcessor('gain-processor', GainProcessor);

// Processor with message handling
class BitCrusherProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bits = 8;
        this.port.onmessage = (event) => {
            if (event.data.command === 'setBits') {
                this.bits = event.data.value;
            }
        };
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        const levels = Math.pow(2, this.bits);

        for (let channel = 0; channel < input.length; channel++) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];

            for (let i = 0; i < inputChannel.length; i++) {
                outputChannel[i] = Math.round(inputChannel[i] * levels) / levels;
            }
        }

        return true;
    }
}

registerProcessor('bit-crusher-processor', BitCrusherProcessor);
```

### AudioBuffer - In-memory Audio Data

AudioBuffer represents PCM audio data in memory, used for sample playback, offline rendering, and audio data manipulation.

```javascript
const context = new AudioContext();

// Create empty buffer
const buffer = context.createBuffer(
    2,                      // numberOfChannels
    context.sampleRate * 2, // length (2 seconds)
    context.sampleRate      // sampleRate
);

console.log('Duration:', buffer.duration, 'seconds');
console.log('Sample rate:', buffer.sampleRate, 'Hz');
console.log('Channels:', buffer.numberOfChannels);
console.log('Length:', buffer.length, 'sample-frames');

// Fill buffer with data
for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);

    for (let i = 0; i < buffer.length; i++) {
        // Generate 440Hz sine wave
        channelData[i] = Math.sin(2 * Math.PI * 440 * i / context.sampleRate);
    }
}

// Play buffer
const source = context.createBufferSource();
source.buffer = buffer;
source.connect(context.destination);
source.start();

// Copy data between buffers
const sourceBuffer = context.createBuffer(1, 44100, 44100);
const destBuffer = context.createBuffer(1, 44100, 44100);

const sourceData = new Float32Array(1024);
// Fill sourceData...

destBuffer.copyToChannel(sourceData, 0, 0);  // Copy to channel 0 at offset 0

const copiedData = new Float32Array(1024);
sourceBuffer.copyFromChannel(copiedData, 0, 512);  // Copy from offset 512

// Load audio file into buffer
async function loadAudioFile(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);

    console.log('Loaded:', audioBuffer.duration, 'seconds');
    return audioBuffer;
}

// Reverse audio buffer
function reverseBuffer(buffer) {
    const reversed = context.createBuffer(
        buffer.numberOfChannels,
        buffer.length,
        buffer.sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sourceData = buffer.getChannelData(channel);
        const reversedData = reversed.getChannelData(channel);

        for (let i = 0; i < buffer.length; i++) {
            reversedData[i] = sourceData[buffer.length - 1 - i];
        }
    }

    return reversed;
}
```

### IIRFilterNode - Custom IIR Filters

IIRFilterNode implements general-purpose Infinite Impulse Response filters with custom coefficients for specialized filtering requirements.

```javascript
const context = new AudioContext();
const source = context.createOscillator();

// Create IIR filter with feedforward and feedback coefficients
// Transfer function: H(z) = (b0 + b1*z^-1 + ...) / (a0 + a1*z^-1 + ...)
const feedforward = [0.00020298, 0.0004059599, 0.00020298];  // b coefficients
const feedback = [1.0126964558, -1.9991880801, 0.9873035442]; // a coefficients

const iirFilter = context.createIIRFilter(feedforward, feedback);

source.connect(iirFilter);
iirFilter.connect(context.destination);
source.start();

// Get frequency response
const frequencyHz = new Float32Array(100);
for (let i = 0; i < 100; i++) {
    frequencyHz[i] = 20 * Math.pow(10, (i / 100) * Math.log10(20000 / 20));
}

const magResponse = new Float32Array(100);
const phaseResponse = new Float32Array(100);

iirFilter.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);

console.log('Magnitude response:', magResponse);
console.log('Phase response:', phaseResponse);

// Design custom butterworth lowpass filter
function designButterworthLowpass(cutoff, sampleRate) {
    const wc = 2 * Math.PI * cutoff / sampleRate;
    const c = 1 / Math.tan(wc / 2);
    const a0 = c * c + Math.sqrt(2) * c + 1;

    const feedforward = [
        1 / a0,
        2 / a0,
        1 / a0
    ];

    const feedback = [
        1,
        2 * (1 - c * c) / a0,
        (c * c - Math.sqrt(2) * c + 1) / a0
    ];

    return context.createIIRFilter(feedforward, feedback);
}

const customFilter = designButterworthLowpass(1000, context.sampleRate);
```

## Summary

### Main Use Cases

The Web Audio API serves a diverse range of audio applications in modern web development. Music and media players benefit from the API's ability to add real-time effects, equalization, and spatial audio to streaming content, while visualization capabilities enable rich spectrum analyzers and waveform displays. Game developers leverage the 3D spatial audio capabilities with PannerNode and AudioListener to create immersive soundscapes where sounds accurately position themselves in virtual space with distance attenuation and directional audio. Music production and synthesis applications can implement virtual instruments, drum machines, sequencers, and complete digital audio workstations in the browser using oscillators, filters, and custom processing. Real-time audio processing applications such as voice chat with effects, podcast recording with compression and EQ, guitar amp simulators, and vocal processors are all possible through MediaStream integration. Audio analysis tools can perform real-time frequency analysis, pitch detection, beat detection, and audio fingerprinting using the AnalyserNode. Educational applications demonstrate audio concepts, provide interactive learning tools for DSP principles, and create music theory training applications with immediate audio feedback.

The API's flexibility extends to accessibility applications that can provide audio feedback and sonification of data, voice processing and enhancement for improved communication, and audio-based navigation aids for users with visual impairments. Broadcasting and streaming applications utilize MediaStreamAudioDestinationNode to route processed audio to WebRTC connections or MediaRecorder for live audio effects during broadcasts and podcast production with real-time processing. The offline rendering capabilities enable non-realtime audio export, batch audio processing, and audio file format conversion. With AudioWorklet support for custom DSP algorithms, developers can implement proprietary audio algorithms, port existing audio processing code to the web, and create innovative effects that aren't available through the standard node types. The combination of low-latency processing, sample-accurate timing, and comprehensive node types makes the Web Audio API suitable for professional-grade audio applications while remaining accessible for simpler use cases.

### Integration Patterns

The Web Audio API follows several key integration patterns that make it both powerful and flexible. The fundamental pattern is the audio graph architecture where nodes connect in directed graphs from sources through processing to destinations, supporting any topology including series chains, parallel splits, and feedback loops with the ability to dynamically modify connections during playback. Integration with HTML5 media elements occurs through MediaElementAudioSourceNode, allowing existing audio and video elements to route through the Web Audio API for processing while maintaining synchronization and transport controls, enabling web applications to add real-time effects to streaming media content. WebRTC integration via MediaStreamAudioSourceNode and MediaStreamAudioDestinationNode creates complete audio processing pipelines for voice and video chat applications with effects, noise suppression, and spatial audio before transmission to remote peers.

The parameter automation system provides sample-accurate control through setValueAtTime, linear and exponential ramps, target value approaches, and arbitrary curves, with the ability to connect AudioNode outputs directly to AudioParam inputs for modulation effects like vibrato, tremolo, and filter sweeps. AudioWorklet integration enables zero-copy audio processing on the rendering thread with custom JavaScript processors that receive inputs, outputs, and parameters arrays, supporting bidirectional communication via MessagePort for control messages and parameter exposure through AudioParam. The offline rendering pattern allows identical audio graphs to render non-realtime to AudioBuffer through OfflineAudioContext for audio export and processing without glitches. Visualization integration connects AnalyserNode outputs to Canvas 2D or WebGL for real-time frequency and time-domain visualization with requestAnimationFrame synchronization.

Error handling patterns include checking AudioContext state before operations, handling suspended contexts that require user interaction to resume, catching decode errors from invalid audio data, and managing buffer loading failures gracefully. Performance optimization patterns include reusing AudioNode instances instead of frequent creation, using AudioWorklet for complex custom processing to avoid main thread blocking, limiting AnalyserNode FFT sizes to necessary resolution, and pre-loading AudioBuffer instances for frequently-used sounds. The API's event-driven architecture supports monitoring through the ended event on AudioScheduledSourceNode, statechange events on AudioContext, and processorerror events on AudioWorkletNode, enabling responsive applications that react to audio playback state changes. These integration patterns collectively enable developers to build sophisticated audio applications that leverage the full power of the Web Audio API while maintaining clean, maintainable code architecture.