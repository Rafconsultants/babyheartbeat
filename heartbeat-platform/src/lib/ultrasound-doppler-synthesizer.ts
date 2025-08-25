/**
 * Ultrasound Doppler Synthesizer
 * Creates continuous, rhythmic Doppler-style pulses with warm 'whoosh-lub-dub' quality
 * Matches real fetal ultrasound with tissue echo characteristics
 */

export interface UltrasoundDopplerOptions {
  bpm: number;
  duration: number;
  sampleRate: number;
  beatTimesSec: number[];
  doublePulseOffsetMs?: number | null;
  amplitudeScalars?: number[];
  confidence?: number;
}

export interface UltrasoundDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  hasDoublePulse: boolean;
  beatCount: number;
}

export class UltrasoundDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate ultrasound Doppler heartbeat with whoosh-lub-dub quality
   */
  static async generateUltrasoundDoppler(options: UltrasoundDopplerOptions): Promise<UltrasoundDopplerResult> {
    console.log('🎵 Starting ultrasound Doppler synthesis');
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

      // Generate continuous ultrasound Doppler waveform
      this.generateContinuousDoppler(channelData, options);

      // Apply ultrasound-specific processing
      this.applyUltrasoundProcessing(channelData);

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Ultrasound Doppler synthesis completed');
      console.log('🎵 Audio blob size:', audioBlob.size, 'bytes');
      console.log('🎵 Audio URL created:', audioUrl);

      return {
        audioUrl,
        duration: options.duration,
        bpm: options.bpm,
        fileSize: audioBlob.size,
        hasDoublePulse: true,
        beatCount: options.beatTimesSec.length
      };

    } catch (error) {
      console.error('❌ Ultrasound Doppler synthesis failed:', error);
      throw new Error(`Failed to generate ultrasound Doppler audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate continuous Doppler waveform with whoosh-lub-dub pattern
   */
  private static generateContinuousDoppler(channelData: Float32Array, options: UltrasoundDopplerOptions): void {
    const { sampleRate, duration, beatTimesSec, doublePulseOffsetMs = 60 } = options;
    
    // Generate continuous background tissue noise
    this.generateTissueBackground(channelData, sampleRate, duration);
    
    // Generate beats at specified times
    beatTimesSec.forEach((beatTime, index) => {
      if (beatTime >= 0 && beatTime < duration) {
        const amplitude = options.amplitudeScalars?.[index] || 0.8;
        
        // Generate whoosh-lub-dub pattern
        this.generateWhooshLubDub(channelData, sampleRate, beatTime, amplitude, doublePulseOffsetMs);
      }
    });
  }

  /**
   * Generate whoosh-lub-dub pattern - the core ultrasound sound
   */
  private static generateWhooshLubDub(channelData: Float32Array, sampleRate: number, startTime: number, amplitude: number, doublePulseOffsetMs: number): void {
    const startSample = Math.floor(startTime * sampleRate);
    
    // LUB component (strong, pronounced pulse)
    this.generateLub(channelData, sampleRate, startTime, amplitude * 1.2);
    
    // DUB component (strong, pronounced pulse)
    const dubTime = startTime + (doublePulseOffsetMs / 1000);
    this.generateDub(channelData, sampleRate, dubTime, amplitude * 1.0);
  }

  /**
   * Generate WHOOSH - ultrasound waves bouncing off tissue
   */
  private static generateWhoosh(channelData: Float32Array, sampleRate: number, startTime: number, amplitude: number): void {
    const startSample = Math.floor(startTime * sampleRate);
    const duration = 0.08; // 80ms duration
    const numSamples = Math.floor(duration * sampleRate);
    
    // WHOOSH characteristics - flowing grayscale cross-sectional image
    const attackTime = 0.01; // 10ms attack
    const decayTime = 0.07; // 70ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    
    // Frequency sweep for whoosh effect
    const startFreq = 800; // High frequency start
    const endFreq = 200; // Lower frequency end
    
    for (let i = 0; i < numSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      const time = i / sampleRate;
      const progress = i / numSamples;
      
      // Envelope
      let envelope = 0;
      if (i < attackSamples) {
        envelope = i / attackSamples; // Linear attack
      } else {
        envelope = Math.exp(-(i - attackSamples) / (decaySamples * 0.3)); // Exponential decay
      }
      
      // Frequency sweep for whoosh
      const currentFreq = startFreq + (endFreq - startFreq) * progress;
      
      // WHOOSH sound synthesis - flowing grayscale quality
      let whoosh = 0;
      
      // Main frequency with sweep
      whoosh += Math.sin(2 * Math.PI * currentFreq * time) * 0.4;
      
      // Harmonics for flowing quality
      const harmonics = [currentFreq * 1.5, currentFreq * 2.0, currentFreq * 2.5];
      harmonics.forEach((freq, index) => {
        const harmonicAmp = 0.2 / (index + 2);
        whoosh += Math.sin(2 * Math.PI * freq * time) * harmonicAmp;
      });
      
      // Add subtle noise for tissue echo character
      whoosh += (Math.random() - 0.5) * 0.1;
      
      // Apply envelope and amplitude
      channelData[sampleIndex] += whoosh * envelope * amplitude * 0.8;
    }
  }

  /**
   * Generate LUB - strong, pronounced pulse
   */
  private static generateLub(channelData: Float32Array, sampleRate: number, startTime: number, amplitude: number): void {
    const startSample = Math.floor(startTime * sampleRate);
    const duration = 0.15; // 150ms duration
    const numSamples = Math.floor(duration * sampleRate);
    
    // LUB characteristics - strong, pronounced pulse
    const attackTime = 0.008; // 8ms attack (quick rise)
    const decayTime = 0.142; // 142ms decay (gentle decay)
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    
    // Frequency components for LUB (strong, pronounced)
    const fundamentalFreq = 85; // Deep fundamental for strong pulse
    const harmonicFreqs = [170, 255, 340, 425]; // Rich harmonics for fullness
    
    for (let i = 0; i < numSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      const time = i / sampleRate;
      
      // Envelope - quick rise, gentle decay
      let envelope = 0;
      if (i < attackSamples) {
        envelope = i / attackSamples; // Quick linear attack
      } else {
        envelope = Math.exp(-(i - attackSamples) / (decaySamples * 0.6)); // Gentle exponential decay
      }
      
      // LUB sound synthesis - strong, pronounced pulse
      let lub = 0;
      
      // Fundamental frequency
      lub += Math.sin(2 * Math.PI * fundamentalFreq * time) * 0.6;
      
      // Rich harmonics for fullness
      harmonicFreqs.forEach((freq, index) => {
        const harmonicAmp = 0.35 / (index + 1.2); // Strong harmonics for pronounced sound
        lub += Math.sin(2 * Math.PI * freq * time) * harmonicAmp;
      });
      
      // Add warmth for inside-the-body character
      lub += Math.sin(2 * Math.PI * fundamentalFreq * 0.5 * time) * 0.15;
      
      // Apply envelope and amplitude
      channelData[sampleIndex] += lub * envelope * amplitude * 1.1;
    }
  }

  /**
   * Generate DUB - strong, pronounced pulse
   */
  private static generateDub(channelData: Float32Array, sampleRate: number, startTime: number, amplitude: number): void {
    const startSample = Math.floor(startTime * sampleRate);
    const duration = 0.12; // 120ms duration
    const numSamples = Math.floor(duration * sampleRate);
    
    // DUB characteristics - strong, pronounced pulse
    const attackTime = 0.006; // 6ms attack (quick rise)
    const decayTime = 0.114; // 114ms decay (gentle decay)
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    
    // Frequency components for DUB (strong, pronounced)
    const fundamentalFreq = 105; // Higher than LUB for contrast
    const harmonicFreqs = [210, 315, 420, 525]; // Rich harmonics for fullness
    
    for (let i = 0; i < numSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      const time = i / sampleRate;
      
      // Envelope - quick rise, gentle decay
      let envelope = 0;
      if (i < attackSamples) {
        envelope = i / attackSamples; // Quick linear attack
      } else {
        envelope = Math.exp(-(i - attackSamples) / (decaySamples * 0.7)); // Gentle exponential decay
      }
      
      // DUB sound synthesis - strong, pronounced pulse
      let dub = 0;
      
      // Fundamental frequency
      dub += Math.sin(2 * Math.PI * fundamentalFreq * time) * 0.5;
      
      // Rich harmonics for fullness
      harmonicFreqs.forEach((freq, index) => {
        const harmonicAmp = 0.3 / (index + 1.3); // Strong harmonics for pronounced sound
        dub += Math.sin(2 * Math.PI * freq * time) * harmonicAmp;
      });
      
      // Add warmth for inside-the-body character
      dub += Math.sin(2 * Math.PI * fundamentalFreq * 0.6 * time) * 0.12;
      
      // Apply envelope and amplitude
      channelData[sampleIndex] += dub * envelope * amplitude * 1.0;
    }
  }

  /**
   * Generate continuous whoosh background - warm, airy low-to-mid frequency noise
   */
  private static generateTissueBackground(channelData: Float32Array, sampleRate: number, duration: number): void {
    const numSamples = channelData.length;
    
    // Generate continuous whoosh background (50-200 Hz)
    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      
      // Warm, airy low-to-mid frequency noise (50-200 Hz)
      let whoosh = 0;
      
      // Low frequency components (50-100 Hz)
      const lowFreq1 = 60 + 20 * Math.sin(2 * Math.PI * 0.3 * time);
      const lowFreq2 = 80 + 15 * Math.sin(2 * Math.PI * 0.4 * time);
      whoosh += Math.sin(2 * Math.PI * lowFreq1 * time) * 0.15;
      whoosh += Math.sin(2 * Math.PI * lowFreq2 * time) * 0.12;
      
      // Mid frequency components (100-200 Hz)
      const midFreq1 = 120 + 30 * Math.sin(2 * Math.PI * 0.5 * time);
      const midFreq2 = 160 + 25 * Math.sin(2 * Math.PI * 0.6 * time);
      whoosh += Math.sin(2 * Math.PI * midFreq1 * time) * 0.08;
      whoosh += Math.sin(2 * Math.PI * midFreq2 * time) * 0.06;
      
      // Add subtle airy noise
      const airyNoise = (Math.random() - 0.5) * 0.03;
      
      // Flowing modulation
      const flowModulation = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.8 * time);
      
      channelData[i] = (whoosh + airyNoise) * flowModulation * 0.4; // Softer underlying whoosh
    }
  }

  /**
   * Apply ultrasound-specific processing
   */
  private static applyUltrasoundProcessing(channelData: Float32Array): void {
    const sampleRate = 44100;
    
    // Apply gentle low-pass filter for ultrasound character
    const cutoffFreq = 1500; // Hz - ultrasound frequency range
    const filtered = this.applyLowPassFilter(channelData, sampleRate, cutoffFreq);
    
    // Add warmth for tissue characteristics
    const warmthBoost = this.applyLowPassFilter(filtered, sampleRate, 400);
    
    // Combine with original
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = filtered[i] * 0.7 + warmthBoost[i] * 0.3;
    }
    
    // Apply gentle compression for realistic dynamics
    this.applyGentleCompression(channelData);
  }

  /**
   * Apply low-pass filter
   */
  private static applyLowPassFilter(input: Float32Array, sampleRate: number, cutoffFreq: number): Float32Array {
    const output = new Float32Array(input.length);
    const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
    const dt = 1.0 / sampleRate;
    const alpha = dt / (rc + dt);
    
    output[0] = input[0];
    for (let i = 1; i < input.length; i++) {
      output[i] = output[i-1] + alpha * (input[i] - output[i-1]);
    }
    
    return output;
  }

  /**
   * Apply gentle compression
   */
  private static applyGentleCompression(channelData: Float32Array): void {
    const threshold = 0.4;
    const ratio = 2.5;
    
    for (let i = 0; i < channelData.length; i++) {
      const input = Math.abs(channelData[i]);
      if (input > threshold) {
        const excess = input - threshold;
        const compressed = threshold + (excess / ratio);
        channelData[i] = Math.sign(channelData[i]) * compressed;
      }
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
    
    // Write audio data
    const offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset + (i * numberOfChannels + channel) * 2, sample * 0x7FFF, true);
      }
    }
    
    return arrayBuffer;
  }
}
