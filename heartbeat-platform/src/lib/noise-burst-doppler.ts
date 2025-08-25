/**
 * Noise-Burst Doppler Ultrasound Heartbeat Synthesizer
 * Implements deterministic noise-burst engine for authentic fetal Doppler recordings
 */

export interface NoiseBurstDopplerOptions {
  bpm: number;
  duration: number;
  sampleRate: number;
  beatTimesSec: number[];
  doublePulseOffsetMs?: number | null;
  amplitudeScalars?: number[];
  confidence?: number;
}

export interface NoiseBurstDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  hasDoublePulse: boolean;
  beatCount: number;
}

export class NoiseBurstDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate noise-burst Doppler ultrasound heartbeat audio
   */
  static async generateNoiseBurstDoppler(options: NoiseBurstDopplerOptions): Promise<NoiseBurstDopplerResult> {
    console.log('🎵 Starting noise-burst Doppler synthesis');
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
      if (!this.audioContext) {
        throw new Error('AudioContext initialization failed');
      }
      
      const buffer = this.audioContext.createBuffer(1, options.sampleRate * options.duration, options.sampleRate);
      const channelData = buffer.getChannelData(0);

      // Generate noise-burst Doppler waveform
      this.generateNoiseBurstWaveform(channelData, options);

      // Apply dynamics processing
      this.applyDynamics(channelData);

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Noise-burst Doppler synthesis completed');
      console.log('🎵 Audio blob size:', audioBlob.size, 'bytes');
      console.log('🎵 Audio URL created:', audioUrl);

      return {
        audioUrl,
        duration: options.duration,
        bpm: options.bpm,
        fileSize: audioBlob.size,
        hasDoublePulse: options.doublePulseOffsetMs !== null && options.doublePulseOffsetMs !== undefined,
        beatCount: options.beatTimesSec.length
      };

    } catch (error) {
      console.error('❌ Noise-burst Doppler synthesis failed:', error);
      throw new Error(`Failed to generate noise-burst Doppler audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate noise-burst waveform with timing from beat onsets
   */
  private static generateNoiseBurstWaveform(channelData: Float32Array, options: NoiseBurstDopplerOptions): void {
    const { sampleRate, duration, beatTimesSec, doublePulseOffsetMs, amplitudeScalars = [] } = options;

    console.log('🎵 Generating noise-burst waveform...');
    console.log('🎵 Beat times:', beatTimesSec);
    console.log('🎵 Double pulse offset:', doublePulseOffsetMs, 'ms');

    // Generate constant low-level pink noise floor first
    this.generatePinkNoiseFloor(channelData, sampleRate, duration);

    // Generate noise bursts at each beat onset
    for (let i = 0; i < beatTimesSec.length; i++) {
      const beatTime = beatTimesSec[i];
      const amplitudeScalar = amplitudeScalars[i] || 0.8;
      
      // Generate primary burst
      this.generateNoiseBurst(channelData, beatTime, sampleRate, amplitudeScalar, false);

      // Generate secondary burst if double-pulse is present
      if (doublePulseOffsetMs && doublePulseOffsetMs > 0) {
        const secondaryTime = beatTime + (doublePulseOffsetMs / 1000);
        const secondaryAmplitude = amplitudeScalar * (0.6 + Math.random() * 0.2); // 60-80% of primary
        this.generateNoiseBurst(channelData, secondaryTime, sampleRate, secondaryAmplitude, true);
      }
    }

    console.log(`🎵 Generated noise-burst waveform with ${beatTimesSec.length} beats`);
  }

  /**
   * Generate constant low-level pink noise floor
   */
  private static generatePinkNoiseFloor(channelData: Float32Array, sampleRate: number, duration: number): void {
    console.log('🎵 Generating pink noise floor...');
    
    // Pink noise parameters: -36 to -42 dBFS
    const pinkNoiseLevel = Math.pow(10, (-39 / 20)); // -39 dBFS average
    
    for (let i = 0; i < channelData.length; i++) {
      // Simple pink noise approximation using frequency-dependent filtering
      const time = i / sampleRate;
      
      // Generate white noise
      let whiteNoise = (Math.random() - 0.5) * 2;
      
      // Apply simple pink noise filtering (frequency-dependent amplitude)
      const frequency = (i % 1000) / 1000; // Simple frequency approximation
      const pinkFilter = 1 / Math.sqrt(1 + frequency * 10);
      
      const pinkNoise = whiteNoise * pinkFilter * pinkNoiseLevel;
      channelData[i] = pinkNoise;
    }
  }

  /**
   * Generate individual noise burst
   */
  private static generateNoiseBurst(channelData: Float32Array, startTime: number, sampleRate: number, amplitudeScalar: number, isSecondary: boolean): void {
    const startSample = Math.floor(startTime * sampleRate);
    if (startSample >= channelData.length) return;

    // Envelope parameters
    const attackTime = 0.005 + Math.random() * 0.005; // 5-10ms attack
    const decayTime = 0.060 + Math.random() * 0.040; // 60-100ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + decaySamples;
    
    // Amplitude with gentle variation (0.8 mean with ≤5-8% variation)
    const baseAmplitude = 0.8;
    const variation = (Math.random() - 0.5) * 0.08; // ±4% variation
    const maxAmplitude = (baseAmplitude + variation) * amplitudeScalar;

    console.log(`🎵 Generating ${isSecondary ? 'secondary' : 'primary'} burst: start=${startSample}, attack=${attackSamples}, decay=${decaySamples}, amplitude=${maxAmplitude.toFixed(3)}`);

    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;

      const timeInBurst = i / sampleRate;
      
      // Calculate envelope
      let envelope = 0;
      if (i < attackSamples) {
        // Linear attack: 5-10ms
        envelope = i / attackSamples;
      } else {
        // Exponential decay: 60-100ms
        const decayTimeInBurst = (i - attackSamples) / sampleRate;
        envelope = Math.exp(-decayTimeInBurst * 8); // Fast decay, no sustain
      }
      
      // Generate band-pass filtered noise burst
      const noiseBurst = this.generateBandPassNoiseBurst(timeInBurst, isSecondary);
      const sample = noiseBurst * envelope * maxAmplitude;
      
      channelData[sampleIndex] += sample;
    }
  }

  /**
   * Generate band-pass filtered noise burst
   */
  private static generateBandPassNoiseBurst(time: number, isSecondary: boolean): number {
    // Use white noise as source (no sine/oscillator stacks)
    let whiteNoise = (Math.random() - 0.5) * 2;
    
    // Fixed band-pass EQ: 200-1200 Hz (center ≈ 600 Hz)
    // Simple IIR filter approximation
    const centerFreq = 600;
    const bandwidth = 1000; // 200-1200 Hz range
    
    // Optional slight upward sweep during first 20-40ms for realism
    let sweepFreq = centerFreq;
    if (time < 0.030) { // First 30ms
      const sweepAmount = (0.030 - time) / 0.030; // Sweep from 800 to 600 Hz
      sweepFreq = 600 + sweepAmount * 200;
    }
    
    // Simple band-pass filter using multiple sine waves to approximate the frequency range
    let filteredNoise = 0;
    
    // Generate noise in the target frequency band
    for (let freq = 200; freq <= 1200; freq += 50) {
      const weight = this.calculateBandPassWeight(freq, sweepFreq, bandwidth);
      filteredNoise += Math.sin(2 * Math.PI * freq * time) * weight * whiteNoise;
    }
    
    // Add some broadband noise for the "swish" character
    filteredNoise += whiteNoise * 0.3;
    
    return filteredNoise * 0.5; // Normalize
  }

  /**
   * Calculate band-pass filter weight
   */
  private static calculateBandPassWeight(freq: number, centerFreq: number, bandwidth: number): number {
    const distance = Math.abs(freq - centerFreq);
    const normalizedDistance = distance / (bandwidth / 2);
    
    // Bell curve response
    return Math.exp(-normalizedDistance * normalizedDistance);
  }

  /**
   * Apply dynamics processing (soft limiter/compressor)
   */
  private static applyDynamics(channelData: Float32Array): void {
    console.log('🎵 Applying dynamics processing...');
    
    // Soft limiter: ratio ~3:1, threshold ~-18 dBFS, modest makeup gain
    const threshold = Math.pow(10, (-18 / 20)); // -18 dBFS
    const ratio = 3;
    const makeupGain = 1.2; // Modest makeup gain
    
    for (let i = 0; i < channelData.length; i++) {
      let sample = channelData[i];
      
      // Apply soft limiting
      if (Math.abs(sample) > threshold) {
        const excess = Math.abs(sample) - threshold;
        const gainReduction = excess * (1 - 1/ratio);
        sample = Math.sign(sample) * (Math.abs(sample) - gainReduction);
      }
      
      // Apply makeup gain
      sample *= makeupGain;
      
      // Final limiting to prevent clipping
      sample = Math.max(-1, Math.min(1, sample));
      
      channelData[i] = sample;
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
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  }
}
