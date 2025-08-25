/**
 * GPT-Based Fetal Doppler Ultrasound Heartbeat Synthesizer
 * Implements realistic fetal Doppler synthesis with precise specifications
 */

export interface GPTDopplerOptions {
  bpm: number;
  duration: number;
  sampleRate: number;
  hasDoublePulse?: boolean;
  doublePulseOffset?: number; // ms
  timingVariability?: number; // ms
  amplitudeVariation?: number; // 0-1
  backgroundLevel?: number; // dBFS
}

export interface GPTDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  hasDoublePulse: boolean;
  backgroundLevel: number;
}

export class GPTDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate realistic fetal Doppler ultrasound heartbeat audio
   */
  static async generateGPTDoppler(options: GPTDopplerOptions): Promise<GPTDopplerResult> {
    console.log('🎵 Starting GPT-based fetal Doppler synthesis');
    console.log('🎵 Options:', options);

    try {
      // Initialize AudioContext
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }

      if (!this.audioContext) {
        try {
          this.audioContext = new AudioContext();
        } catch (error) {
          console.warn('🎵 Standard AudioContext failed, trying webkitAudioContext:', error);
          try {
            this.audioContext = new (window as any).webkitAudioContext();
          } catch (webkitError) {
            throw new Error('AudioContext not supported in this browser');
          }
        }
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      console.log('🎵 AudioContext ready, state:', this.audioContext.state);

      // Create mono audio buffer
      const buffer = this.audioContext.createBuffer(1, options.sampleRate * options.duration, options.sampleRate);
      const channelData = buffer.getChannelData(0);

      // Generate realistic fetal Doppler heartbeat
      this.generateRealisticDopplerWaveform(channelData, options);

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 GPT Doppler synthesis completed');
      console.log('🎵 Audio blob size:', audioBlob.size, 'bytes');

      return {
        audioUrl,
        duration: options.duration,
        bpm: options.bpm,
        fileSize: audioBlob.size,
        hasDoublePulse: options.hasDoublePulse || false,
        backgroundLevel: options.backgroundLevel || -42
      };

    } catch (error) {
      console.error('❌ GPT Doppler synthesis failed:', error);
      throw new Error(`Failed to generate GPT Doppler audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate realistic fetal Doppler waveform with precise specifications
   */
  private static generateRealisticDopplerWaveform(channelData: Float32Array, options: GPTDopplerOptions): void {
    const { 
      bpm, 
      duration, 
      sampleRate, 
      hasDoublePulse = false, 
      doublePulseOffset = 55, 
      timingVariability = 15, 
      amplitudeVariation = 0.1,
      backgroundLevel = -42 
    } = options;

    console.log('🎵 Generating realistic fetal Doppler waveform...');

    // Calculate beat timing
    const beatInterval = 60 / bpm; // seconds between beats
    const totalSamples = channelData.length;

    console.log('🎵 Beat interval:', beatInterval, 'seconds');
    console.log('🎵 Total samples:', totalSamples);

    // Generate soft pink noise floor
    const backgroundNoise = this.generatePinkNoiseFloor(totalSamples, backgroundLevel);
    
    // Fill with background noise
    for (let i = 0; i < totalSamples; i++) {
      channelData[i] = backgroundNoise[i];
    }

    // Generate heartbeat pattern with timing variation
    let currentTime = 0.2; // Start first beat at 200ms
    let beatCount = 0;

    while (currentTime < duration) {
      // Add subtle timing variation (±10-20ms)
      const timingJitter = (Math.random() - 0.5) * (timingVariability / 1000);
      const actualBeatTime = currentTime + timingJitter;
      
      // Add small amplitude differences for realism
      const amplitudeJitter = 1 + (Math.random() - 0.5) * amplitudeVariation;
      
      // Generate primary heartbeat burst
      this.generateHeartbeatBurst(
        channelData,
        actualBeatTime,
        sampleRate,
        amplitudeJitter,
        true
      );

      // Generate secondary burst for double-pulse if enabled
      if (hasDoublePulse) {
        const secondaryTime = actualBeatTime + (doublePulseOffset / 1000);
        this.generateHeartbeatBurst(
          channelData,
          secondaryTime,
          sampleRate,
          amplitudeJitter * 0.6, // 60% of primary amplitude
          false
        );
      }

      // Modulate background noise with beat activity
      this.modulateBackgroundWithBeat(
        channelData,
        backgroundNoise,
        actualBeatTime,
        beatInterval,
        sampleRate
      );

      currentTime += beatInterval;
      beatCount++;
    }

    // Apply final band-pass filtering
    this.applyBandPassFilter(channelData, sampleRate);

    console.log(`🎵 Generated ${beatCount} beats at ${bpm} BPM`);
  }

  /**
   * Generate a single heartbeat burst with precise attack/decay
   */
  private static generateHeartbeatBurst(
    channelData: Float32Array,
    startTime: number,
    sampleRate: number,
    amplitude: number,
    isPrimary: boolean
  ): void {
    const startSample = Math.floor(startTime * sampleRate);
    
    if (startSample >= channelData.length) return;
    
    // Attack: 5-10ms, Decay: 60-100ms
    const attackTime = isPrimary ? 0.008 : 0.006; // 8ms for primary, 6ms for secondary
    const decayTime = isPrimary ? 0.080 : 0.060; // 80ms for primary, 60ms for secondary
    
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.35; // Base amplitude for realistic levels

    console.log(`🎵 Generating burst: start=${startSample}, attack=${attackSamples}, decay=${decaySamples}, total=${totalSamples}`);

    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;

      const timeInBurst = i / sampleRate;
      
      // Calculate envelope with precise attack/decay
      let envelope = 0;
      if (i < attackSamples) {
        // Attack: linear rise (5-10ms)
        envelope = i / attackSamples;
      } else {
        // Decay: exponential fall (60-100ms)
        const decayTimeInBurst = (i - attackSamples) / sampleRate;
        envelope = Math.exp(-decayTimeInBurst * 7); // Fast decay for realistic Doppler
      }

      // Generate filtered noise with band-pass characteristics
      const filteredNoise = this.generateFilteredNoise(timeInBurst);
      const sample = filteredNoise * envelope * maxAmplitude;
      
      channelData[sampleIndex] += sample;
    }
  }

  /**
   * Generate filtered noise with band-pass characteristics (200-1200 Hz, emphasis 150-300 Hz)
   */
  private static generateFilteredNoise(time: number): number {
    let filteredNoise = 0;
    
    // Primary emphasis band (150-300 Hz)
    const primaryFreq = 200 + Math.random() * 100; // 200-300 Hz
    filteredNoise += Math.sin(2 * Math.PI * primaryFreq * time) * 0.8;
    
    // Secondary band (300-600 Hz)
    const secondaryFreq = 400 + Math.random() * 200;
    filteredNoise += Math.sin(2 * Math.PI * secondaryFreq * time) * 0.5;
    
    // Upper band (600-1200 Hz)
    const upperFreq = 800 + Math.random() * 400;
    filteredNoise += Math.sin(2 * Math.PI * upperFreq * time) * 0.3;
    
    // Add broadband noise component for authenticity
    filteredNoise += (Math.random() - 0.5) * 0.4;
    
    return filteredNoise * 0.6; // Normalize for realistic levels
  }

  /**
   * Generate soft pink noise floor (-36 to -42 dBFS)
   */
  private static generatePinkNoiseFloor(length: number, levelDB: number): Float32Array {
    const pinkNoise = new Float32Array(length);
    const level = Math.pow(10, levelDB / 20); // Convert dB to linear
    
    // Pink noise generation using multiple filters
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
    
    for (let i = 0; i < length; i++) {
      const white = (Math.random() - 0.5) * 2;
      
      // Pink noise filter coefficients
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      
      pinkNoise[i] = (b0 + b1 + b2 + b3 + b4 + b5) * level;
    }
    
    return pinkNoise;
  }

  /**
   * Modulate background noise with beat activity
   */
  private static modulateBackgroundWithBeat(
    channelData: Float32Array,
    backgroundNoise: Float32Array,
    beatTime: number,
    beatInterval: number,
    sampleRate: number
  ): void {
    const beatStartSample = Math.floor(beatTime * sampleRate);
    const beatEndSample = Math.floor((beatTime + beatInterval) * sampleRate);
    
    // Modulate background noise slightly with each beat
    for (let i = beatStartSample; i < beatEndSample && i < channelData.length; i++) {
      const timeInBeat = (i - beatStartSample) / sampleRate;
      const beatProgress = timeInBeat / beatInterval;
      
      // Rise background slightly during beat, fall between beats
      let modulation = 1.0;
      if (beatProgress < 0.2) {
        // Rise phase during beat
        modulation = 1.0 + beatProgress * 0.3; // Rise to 1.3x
      } else {
        // Fall phase between beats
        const fallProgress = (beatProgress - 0.2) / 0.8;
        modulation = 1.3 - fallProgress * 0.3; // Fall from 1.3x to 1.0x
      }
      
      channelData[i] += backgroundNoise[i] * modulation;
    }
  }

  /**
   * Apply band-pass filter (200-1200 Hz with emphasis 150-300 Hz)
   */
  private static applyBandPassFilter(channelData: Float32Array, sampleRate: number): void {
    // Band-pass filter implementation
    const lowFreq = 200 / sampleRate;
    const highFreq = 1200 / sampleRate;
    const emphasisFreq = 250 / sampleRate; // Emphasis around 250 Hz
    const q = 1.5; // Quality factor
    
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const x0 = channelData[i];
      
      // Band-pass filter coefficients
      const w0 = 2 * Math.PI * Math.sqrt(lowFreq * highFreq);
      const alpha = Math.sin(w0) / (2 * q);
      const cosw0 = Math.cos(w0);
      
      const b0 = alpha;
      const b1 = 0;
      const b2 = -alpha;
      const a0 = 1 + alpha;
      const a1 = -2 * cosw0;
      const a2 = 1 - alpha;
      
      // Apply filter
      const y0 = (b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      
      channelData[i] = y0;
      
      // Update history
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }
  }

  /**
   * Convert AudioBuffer to WAV format
   */
  private static audioBufferToWAV(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    return arrayBuffer;
  }
}
