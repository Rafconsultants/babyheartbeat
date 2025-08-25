/**
 * Authentic Fetal Doppler Ultrasound Heartbeat Synthesizer
 * Implements comprehensive fetal Doppler synthesis with waveform extraction,
 * authentic Doppler characteristics, wall-filtering, and spatial realism
 */

export interface AuthenticDopplerOptions {
  bpm: number;
  duration: number;
  sampleRate: number;
  waveformData?: {
    beatTimes: number[];
    amplitudes: number[];
    doublePulseOffsets: (number | null)[];
    hasWaveform: boolean;
    confidence: number;
  };
  hasDoublePulse?: boolean;
  doublePulseOffset?: number; // ms
  timingVariability?: number; // ms
  amplitudeVariation?: number; // 0-1
  stereo?: boolean;
  useReverb?: boolean;
}

export interface AuthenticDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  hasDoublePulse: boolean;
  waveformUsed: boolean;
  stereo: boolean;
}

export class AuthenticDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate authentic fetal Doppler ultrasound heartbeat audio
   */
  static async generateAuthenticDoppler(options: AuthenticDopplerOptions): Promise<AuthenticDopplerResult> {
    console.log('🎵 Starting authentic fetal Doppler synthesis');
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

      // Create audio buffer (mono or stereo)
      const numberOfChannels = options.stereo ? 2 : 1;
      const buffer = this.audioContext.createBuffer(numberOfChannels, options.sampleRate * options.duration, options.sampleRate);

      // Generate authentic Doppler heartbeat
      this.generateAuthenticDopplerWaveform(buffer, options);

      // Apply post-processing
      this.applyPostProcessing(buffer, options);

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Authentic Doppler synthesis completed');
      console.log('🎵 Audio blob size:', audioBlob.size, 'bytes');

      return {
        audioUrl,
        duration: options.duration,
        bpm: options.bpm,
        fileSize: audioBlob.size,
        hasDoublePulse: options.hasDoublePulse || false,
        waveformUsed: options.waveformData?.hasWaveform || false,
        stereo: options.stereo || false
      };

    } catch (error) {
      console.error('❌ Authentic Doppler synthesis failed:', error);
      throw new Error(`Failed to generate authentic Doppler audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate the authentic Doppler waveform with comprehensive features
   */
  private static generateAuthenticDopplerWaveform(buffer: AudioBuffer, options: AuthenticDopplerOptions): void {
    const { bpm, duration, sampleRate, waveformData, hasDoublePulse = false, doublePulseOffset = 55, timingVariability = 15, amplitudeVariation = 0.1, stereo = false } = options;

    console.log('🎵 Generating authentic Doppler waveform...');

    // Determine beat timing and amplitudes
    let beatTimes: number[];
    let amplitudes: number[];
    let doublePulseOffsets: (number | null)[];

    if (waveformData?.hasWaveform && waveformData.confidence > 0.5) {
      // Use extracted waveform data
      console.log('🎵 Using extracted waveform data');
      beatTimes = waveformData.beatTimes;
      amplitudes = waveformData.amplitudes;
      doublePulseOffsets = waveformData.doublePulseOffsets;
    } else {
      // Generate fallback pattern with natural variation
      console.log('🎵 Using fallback pattern with natural variation');
      const fallbackPattern = this.generateFallbackPattern(bpm, duration, timingVariability, amplitudeVariation);
      beatTimes = fallbackPattern.beatTimes;
      amplitudes = fallbackPattern.amplitudes;
      doublePulseOffsets = fallbackPattern.doublePulseOffsets;
    }

    // Generate for each channel
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      // Generate dynamic background noise
      const backgroundNoise = this.generateDynamicBackgroundNoise(channelData.length, sampleRate, channel);
      
      // Fill with background noise
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = backgroundNoise[i];
      }

      // Generate heartbeat pattern
      for (let i = 0; i < beatTimes.length; i++) {
        const beatTime = beatTimes[i];
        const amplitude = amplitudes[i];
        const doublePulseOffset = doublePulseOffsets[i];

        // Generate primary beat
        this.generateAuthenticBeat(
          channelData,
          beatTime,
          sampleRate,
          amplitude,
          true,
          channel
        );

        // Generate secondary beat for double pulse
        if (hasDoublePulse && doublePulseOffset !== null) {
          const secondaryTime = beatTime + (doublePulseOffset / 1000);
          this.generateAuthenticBeat(
            channelData,
            secondaryTime,
            sampleRate,
            amplitude * 0.6, // 60% of primary amplitude
            false,
            channel
          );
        }
      }

      // Apply wall-filtering and demodulation effects
      this.applyWallFiltering(channelData, sampleRate);
      this.applyDemodulationEffects(channelData, sampleRate);
    }

    console.log(`🎵 Generated ${beatTimes.length} beats at ${bpm} BPM`);
  }

  /**
   * Generate fallback pattern with natural variation
   */
  private static generateFallbackPattern(bpm: number, duration: number, timingVariability: number, amplitudeVariation: number) {
    const beatInterval = 60 / bpm;
    const beatTimes: number[] = [];
    const amplitudes: number[] = [];
    const doublePulseOffsets: (number | null)[] = [];

    let currentTime = 0.2; // Start first beat at 200ms
    let beatCount = 0;

    while (currentTime < duration) {
      // Add timing variability (±10-20ms)
      const timingJitter = (Math.random() - 0.5) * (timingVariability / 1000);
      const actualBeatTime = currentTime + timingJitter;
      
      // Add amplitude variation
      const amplitudeJitter = 1 + (Math.random() - 0.5) * amplitudeVariation;
      
      beatTimes.push(actualBeatTime);
      amplitudes.push(amplitudeJitter);
      
      // Add double pulse variation
      const hasDoublePulse = Math.random() > 0.7; // 30% chance of double pulse
      if (hasDoublePulse) {
        const offset = 40 + Math.random() * 30; // 40-70ms
        doublePulseOffsets.push(offset);
      } else {
        doublePulseOffsets.push(null);
      }

      currentTime += beatInterval;
      beatCount++;
    }

    return { beatTimes, amplitudes, doublePulseOffsets };
  }

  /**
   * Generate authentic Doppler beat with comprehensive characteristics
   */
  private static generateAuthenticBeat(
    channelData: Float32Array,
    startTime: number,
    sampleRate: number,
    amplitude: number,
    isPrimary: boolean,
    channel: number
  ): void {
    const startSample = Math.floor(startTime * sampleRate);
    
    if (startSample >= channelData.length) return;
    
    // Authentic Doppler characteristics
    const attackTime = isPrimary ? 0.008 : 0.006; // 8ms for primary, 6ms for secondary
    const decayTime = isPrimary ? 0.080 : 0.060; // 80ms for primary, 60ms for secondary
    
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.4;

    // Add channel-specific variation for stereo
    const channelVariation = channel === 1 ? 0.95 : 1.0; // Slight difference between channels

    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;

      const timeInBurst = i / sampleRate;
      
      // Calculate envelope with authentic Doppler shape
      let envelope = 0;
      if (i < attackSamples) {
        // Attack: exponential rise for authentic Doppler
        envelope = 1 - Math.exp(-(i / attackSamples) * 3);
      } else {
        // Decay: complex decay with multiple time constants
        const decayTimeInBurst = (i - attackSamples) / sampleRate;
        envelope = Math.exp(-decayTimeInBurst * 8) * (1 - Math.exp(-decayTimeInBurst * 2));
      }

      // Generate multi-band Doppler noise
      const dopplerNoise = this.generateMultiBandDopplerNoise(timeInBurst, isPrimary);
      const sample = dopplerNoise * envelope * maxAmplitude * channelVariation;
      
      channelData[sampleIndex] += sample;
    }
  }

  /**
   * Generate multi-band Doppler noise with "thump + whoosh" characteristics
   */
  private static generateMultiBandDopplerNoise(time: number, isPrimary: boolean): number {
    let dopplerNoise = 0;
    
    // Primary "thump" band (150-300 Hz)
    const thumpFreq = 200 + Math.random() * 100;
    const thumpPhase = Math.random() * 2 * Math.PI;
    dopplerNoise += Math.sin(2 * Math.PI * thumpFreq * time + thumpPhase) * 0.8;
    
    // Secondary "whoosh" band (400-800 Hz)
    const whooshFreq = 500 + Math.random() * 300;
    const whooshPhase = Math.random() * 2 * Math.PI;
    dopplerNoise += Math.sin(2 * Math.PI * whooshFreq * time + whooshPhase) * 0.5;
    
    // High frequency "hiss" band (800-1200 Hz)
    const hissFreq = 900 + Math.random() * 400;
    const hissPhase = Math.random() * 2 * Math.PI;
    dopplerNoise += Math.sin(2 * Math.PI * hissFreq * time + hissPhase) * 0.3;
    
    // Broadband noise component
    dopplerNoise += (Math.random() - 0.5) * 0.4;
    
    // Add amplitude modulation for probe movement simulation
    const amFreq = 2 + Math.random() * 3; // 2-5 Hz modulation
    const amDepth = 0.2;
    const am = 1 + amDepth * Math.sin(2 * Math.PI * amFreq * time);
    
    return dopplerNoise * am * 0.6;
  }

  /**
   * Generate dynamic background noise that modulates with beat activity
   */
  private static generateDynamicBackgroundNoise(length: number, sampleRate: number, channel: number): Float32Array {
    const backgroundNoise = new Float32Array(length);
    
    // Generate pink noise base
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
    
    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;
      const white = (Math.random() - 0.5) * 2;
      
      // Pink noise generation
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      
      let pinkNoise = (b0 + b1 + b2 + b3 + b4 + b5) * 0.01; // Low level
      
      // Add channel-specific variation for stereo
      if (channel === 1) {
        pinkNoise *= 0.98; // Slight difference
      }
      
      // Add subtle modulation
      const modulation = 1 + 0.1 * Math.sin(2 * Math.PI * 0.5 * time);
      backgroundNoise[i] = pinkNoise * modulation;
    }
    
    return backgroundNoise;
  }

  /**
   * Apply wall-filtering effects found in actual fetal Doppler devices
   */
  private static applyWallFiltering(channelData: Float32Array, sampleRate: number): void {
    // High-pass filter to remove low-frequency wall motion
    const cutoffFreq = 150 / sampleRate; // 150 Hz cutoff
    const q = 1.0;
    
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const x0 = channelData[i];
      
      // High-pass filter coefficients
      const w0 = 2 * Math.PI * cutoffFreq;
      const alpha = Math.sin(w0) / (2 * q);
      const cosw0 = Math.cos(w0);
      
      const b0 = (1 + cosw0) / 2;
      const b1 = -(1 + cosw0);
      const b2 = (1 + cosw0) / 2;
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
   * Apply demodulation-like effects for authentic Doppler characteristics
   */
  private static applyDemodulationEffects(channelData: Float32Array, sampleRate: number): void {
    // Apply envelope detection simulation
    const envelope = new Float32Array(channelData.length);
    
    for (let i = 0; i < channelData.length; i++) {
      envelope[i] = Math.abs(channelData[i]);
    }
    
    // Apply low-pass filtering to envelope
    const envelopeCutoff = 50 / sampleRate; // 50 Hz envelope cutoff
    let env1 = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const alpha = envelopeCutoff / (1 + envelopeCutoff);
      env1 = alpha * envelope[i] + (1 - alpha) * env1;
      channelData[i] = env1 * Math.sign(channelData[i]);
    }
  }

  /**
   * Apply post-processing effects
   */
  private static applyPostProcessing(buffer: AudioBuffer, options: AuthenticDopplerOptions): void {
    // Apply fade-in and fade-out
    this.applyFadeInOut(buffer, options.duration, options.sampleRate);
    
    // Apply light compression for realism
    this.applyLightCompression(buffer);
    
    // Apply spatial effects if stereo
    if (options.stereo && options.useReverb) {
      this.applySpatialEffects(buffer);
    }
  }

  /**
   * Apply fade-in and fade-out
   */
  private static applyFadeInOut(buffer: AudioBuffer, duration: number, sampleRate: number): void {
    const fadeTime = 0.1; // 100ms fade
    const fadeSamples = Math.floor(fadeTime * sampleRate);
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      // Fade in
      for (let i = 0; i < fadeSamples; i++) {
        const fadeFactor = i / fadeSamples;
        channelData[i] *= fadeFactor;
      }
      
      // Fade out
      for (let i = 0; i < fadeSamples; i++) {
        const fadeFactor = (fadeSamples - i) / fadeSamples;
        const index = channelData.length - fadeSamples + i;
        if (index >= 0 && index < channelData.length) {
          channelData[index] *= fadeFactor;
        }
      }
    }
  }

  /**
   * Apply light compression for realism
   */
  private static applyLightCompression(buffer: AudioBuffer): void {
    const threshold = 0.7;
    const ratio = 2.0;
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < channelData.length; i++) {
        const sample = channelData[i];
        const absSample = Math.abs(sample);
        
        if (absSample > threshold) {
          const excess = absSample - threshold;
          const compressedExcess = excess / ratio;
          const newAmplitude = threshold + compressedExcess;
          channelData[i] = Math.sign(sample) * newAmplitude;
        }
      }
    }
  }

  /**
   * Apply spatial effects for stereo
   */
  private static applySpatialEffects(buffer: AudioBuffer): void {
    if (buffer.numberOfChannels !== 2) return;
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // Add slight delay and level differences for spatial realism
    const delaySamples = 5; // 5 sample delay
    const levelDiff = 0.02; // 2% level difference
    
    for (let i = 0; i < leftChannel.length; i++) {
      if (i >= delaySamples) {
        rightChannel[i] = leftChannel[i - delaySamples] * (1 - levelDiff);
      }
      leftChannel[i] *= (1 + levelDiff);
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
