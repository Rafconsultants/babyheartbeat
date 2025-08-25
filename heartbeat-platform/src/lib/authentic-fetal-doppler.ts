/**
 * Authentic Fetal Doppler Ultrasound Heartbeat Synthesizer
 * Creates realistic fetal Doppler sounds with THUMP-tap pattern
 * Soft, muffled, whooshing quality as if heard through amniotic fluid
 */

export interface AuthenticFetalDopplerOptions {
  bpm: number;
  duration: number;
  sampleRate: number;
  beatTimesSec: number[];
  doublePulseOffsetMs?: number | null;
  amplitudeScalars?: number[];
  confidence?: number;
}

export interface AuthenticFetalDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  hasDoublePulse: boolean;
  beatCount: number;
}

export class AuthenticFetalDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate authentic fetal Doppler heartbeat with THUMP-tap pattern
   */
  static async generateAuthenticFetalDoppler(options: AuthenticFetalDopplerOptions): Promise<AuthenticFetalDopplerResult> {
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

      // Create mono audio buffer
      if (!this.audioContext) {
        throw new Error('AudioContext initialization failed');
      }
      
      const buffer = this.audioContext.createBuffer(1, options.sampleRate * options.duration, options.sampleRate);
      const channelData = buffer.getChannelData(0);

      // Generate authentic fetal Doppler waveform
      this.generateAuthenticWaveform(channelData, options);

      // Apply amniotic fluid and tissue filtering
      this.applyAmnioticFiltering(channelData);

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Authentic fetal Doppler synthesis completed');
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
      console.error('❌ Authentic fetal Doppler synthesis failed:', error);
      throw new Error(`Failed to generate authentic fetal Doppler audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate the main waveform with THUMP-tap pattern
   */
  private static generateAuthenticWaveform(channelData: Float32Array, options: AuthenticFetalDopplerOptions): void {
    const { sampleRate, duration, beatTimesSec, doublePulseOffsetMs = 60 } = options;
    
    // Generate background amniotic fluid noise
    this.generateAmnioticBackground(channelData, sampleRate, duration);
    
    // Generate beats at specified times
    beatTimesSec.forEach((beatTime, index) => {
      if (beatTime >= 0 && beatTime < duration) {
        const amplitude = options.amplitudeScalars?.[index] || 0.8;
        
        // Generate THUMP sound
        this.generateThump(channelData, sampleRate, beatTime, amplitude);
        
        // Generate tap sound after THUMP
        const tapTime = beatTime + (doublePulseOffsetMs / 1000);
        if (tapTime < duration) {
          this.generateTap(channelData, sampleRate, tapTime, amplitude * 0.6);
        }
      }
    });
  }

  /**
   * Generate THUMP sound - deeper, fuller component
   */
  private static generateThump(channelData: Float32Array, sampleRate: number, startTime: number, amplitude: number): void {
    const startSample = Math.floor(startTime * sampleRate);
    const duration = 0.15; // 150ms duration
    const numSamples = Math.floor(duration * sampleRate);
    
    // THUMP characteristics
    const attackTime = 0.02; // 20ms attack
    const decayTime = 0.13; // 130ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    
    // Frequency components for THUMP
    const fundamentalFreq = 80; // Deep fundamental
    const harmonicFreqs = [160, 240, 320, 400]; // Harmonics for fullness
    const noiseBand = [200, 600]; // Noise band for whooshing
    
    for (let i = 0; i < numSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      const time = i / sampleRate;
      
      // Envelope
      let envelope = 0;
      if (i < attackSamples) {
        envelope = i / attackSamples; // Linear attack
      } else {
        envelope = Math.exp(-(i - attackSamples) / (decaySamples * 0.3)); // Exponential decay
      }
      
      // THUMP sound synthesis
      let thump = 0;
      
      // Fundamental frequency
      thump += Math.sin(2 * Math.PI * fundamentalFreq * time) * 0.4;
      
      // Harmonics for fullness
      harmonicFreqs.forEach((freq, index) => {
        const harmonicAmp = 0.3 / (index + 2); // Decreasing amplitude
        thump += Math.sin(2 * Math.PI * freq * time) * harmonicAmp;
      });
      
      // Noise component for whooshing
      const noiseFreq = noiseBand[0] + (noiseBand[1] - noiseBand[0]) * Math.random();
      thump += (Math.random() - 0.5) * 0.3 * Math.sin(2 * Math.PI * noiseFreq * time);
      
      // Apply envelope and amplitude
      channelData[sampleIndex] += thump * envelope * amplitude * 0.8;
    }
  }

  /**
   * Generate tap sound - softer, lighter component
   */
  private static generateTap(channelData: Float32Array, sampleRate: number, startTime: number, amplitude: number): void {
    const startSample = Math.floor(startTime * sampleRate);
    const duration = 0.08; // 80ms duration
    const numSamples = Math.floor(duration * sampleRate);
    
    // Tap characteristics
    const attackTime = 0.01; // 10ms attack
    const decayTime = 0.07; // 70ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    
    // Frequency components for tap
    const fundamentalFreq = 120; // Higher than THUMP
    const harmonicFreqs = [240, 360, 480]; // Higher harmonics
    const noiseBand = [300, 800]; // Higher noise band
    
    for (let i = 0; i < numSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      const time = i / sampleRate;
      
      // Envelope
      let envelope = 0;
      if (i < attackSamples) {
        envelope = i / attackSamples; // Linear attack
      } else {
        envelope = Math.exp(-(i - attackSamples) / (decaySamples * 0.4)); // Faster decay
      }
      
      // Tap sound synthesis
      let tap = 0;
      
      // Fundamental frequency
      tap += Math.sin(2 * Math.PI * fundamentalFreq * time) * 0.3;
      
      // Harmonics
      harmonicFreqs.forEach((freq, index) => {
        const harmonicAmp = 0.2 / (index + 2);
        tap += Math.sin(2 * Math.PI * freq * time) * harmonicAmp;
      });
      
      // Noise component
      const noiseFreq = noiseBand[0] + (noiseBand[1] - noiseBand[0]) * Math.random();
      tap += (Math.random() - 0.5) * 0.2 * Math.sin(2 * Math.PI * noiseFreq * time);
      
      // Apply envelope and amplitude
      channelData[sampleIndex] += tap * envelope * amplitude * 0.6;
    }
  }

  /**
   * Generate amniotic fluid background noise
   */
  private static generateAmnioticBackground(channelData: Float32Array, sampleRate: number, duration: number): void {
    const numSamples = channelData.length;
    
    // Pink noise generation for amniotic fluid
    const pinkNoise = this.generatePinkNoise(numSamples);
    
    // Low-pass filter to simulate fluid damping
    const cutoffFreq = 800; // Hz
    const filteredNoise = this.applyLowPassFilter(pinkNoise, sampleRate, cutoffFreq);
    
    // Gentle modulation to simulate fluid movement
    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      const modulation = 0.5 + 0.3 * Math.sin(2 * Math.PI * 0.5 * time); // Slow modulation
      channelData[i] = filteredNoise[i] * modulation * 0.1; // Very low amplitude
    }
  }

  /**
   * Generate pink noise
   */
  private static generatePinkNoise(length: number): Float32Array {
    const noise = new Float32Array(length);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      
      noise[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
    }
    
    return noise;
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
   * Apply amniotic fluid and tissue filtering
   */
  private static applyAmnioticFiltering(channelData: Float32Array): void {
    // Apply gentle low-pass filter to simulate tissue damping
    const sampleRate = 44100;
    const cutoffFreq = 1200; // Hz - tissue filtering
    const filtered = this.applyLowPassFilter(channelData, sampleRate, cutoffFreq);
    
    // Add warmth boost for tissue characteristics
    const warmthBoost = this.applyLowPassFilter(filtered, sampleRate, 300);
    
    // Combine with original
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = filtered[i] * 0.8 + warmthBoost[i] * 0.2;
    }
    
    // Apply gentle compression for realistic dynamics
    this.applyGentleCompression(channelData);
  }

  /**
   * Apply gentle compression
   */
  private static applyGentleCompression(channelData: Float32Array): void {
    const threshold = 0.3;
    const ratio = 2.0;
    
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
