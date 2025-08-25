/**
 * Clean Fetal Doppler Ultrasound Heartbeat Synthesizer
 * Creates pure, clean fetal Doppler sounds with THUMP-tap pattern
 * No wave-like effects, background noise, or modulation
 */

export interface CleanFetalDopplerOptions {
  bpm: number;
  duration: number;
  sampleRate: number;
  beatTimesSec: number[];
  doublePulseOffsetMs?: number | null;
  amplitudeScalars?: number[];
  confidence?: number;
}

export interface CleanFetalDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  hasDoublePulse: boolean;
  beatCount: number;
}

export class CleanFetalDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate clean fetal Doppler heartbeat with THUMP-tap pattern
   */
  static async generateCleanFetalDoppler(options: CleanFetalDopplerOptions): Promise<CleanFetalDopplerResult> {
    console.log('🎵 Starting clean fetal Doppler synthesis');
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

      // Generate clean fetal Doppler waveform
      this.generateCleanWaveform(channelData, options);

      // Apply minimal processing
      this.applyMinimalProcessing(channelData);

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Clean fetal Doppler synthesis completed');
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
      console.error('❌ Clean fetal Doppler synthesis failed:', error);
      throw new Error(`Failed to generate clean fetal Doppler audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate the main waveform with clean THUMP-tap pattern
   */
  private static generateCleanWaveform(channelData: Float32Array, options: CleanFetalDopplerOptions): void {
    const { sampleRate, duration, beatTimesSec, doublePulseOffsetMs = 60 } = options;
    
    // Generate clean beats at specified times (no background, no noise)
    beatTimesSec.forEach((beatTime, index) => {
      if (beatTime >= 0 && beatTime < duration) {
        const amplitude = options.amplitudeScalars?.[index] || 0.8;
        
        // Generate clean THUMP sound
        this.generateCleanThump(channelData, sampleRate, beatTime, amplitude);
        
        // Generate clean tap sound after THUMP
        const tapTime = beatTime + (doublePulseOffsetMs / 1000);
        if (tapTime < duration) {
          this.generateCleanTap(channelData, sampleRate, tapTime, amplitude * 0.6);
        }
      }
    });
  }

  /**
   * Generate clean THUMP sound - pure sine waves only
   */
  private static generateCleanThump(channelData: Float32Array, sampleRate: number, startTime: number, amplitude: number): void {
    const startSample = Math.floor(startTime * sampleRate);
    const duration = 0.12; // 120ms duration
    const numSamples = Math.floor(duration * sampleRate);
    
    // Clean THUMP characteristics
    const attackTime = 0.015; // 15ms attack
    const decayTime = 0.105; // 105ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    
    // Clean frequency components for THUMP
    const fundamentalFreq = 85; // Deep fundamental
    const harmonicFreqs = [170, 255, 340]; // Clean harmonics
    
    for (let i = 0; i < numSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      const time = i / sampleRate;
      
      // Clean envelope
      let envelope = 0;
      if (i < attackSamples) {
        envelope = i / attackSamples; // Linear attack
      } else {
        envelope = Math.exp(-(i - attackSamples) / (decaySamples * 0.4)); // Clean decay
      }
      
      // Clean THUMP sound synthesis - pure sine waves only
      let thump = 0;
      
      // Fundamental frequency
      thump += Math.sin(2 * Math.PI * fundamentalFreq * time) * 0.5;
      
      // Clean harmonics for fullness
      harmonicFreqs.forEach((freq, index) => {
        const harmonicAmp = 0.25 / (index + 2); // Decreasing amplitude
        thump += Math.sin(2 * Math.PI * freq * time) * harmonicAmp;
      });
      
      // Apply envelope and amplitude
      channelData[sampleIndex] += thump * envelope * amplitude * 0.7;
    }
  }

  /**
   * Generate clean tap sound - pure sine waves only
   */
  private static generateCleanTap(channelData: Float32Array, sampleRate: number, startTime: number, amplitude: number): void {
    const startSample = Math.floor(startTime * sampleRate);
    const duration = 0.06; // 60ms duration
    const numSamples = Math.floor(duration * sampleRate);
    
    // Clean tap characteristics
    const attackTime = 0.008; // 8ms attack
    const decayTime = 0.052; // 52ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    
    // Clean frequency components for tap
    const fundamentalFreq = 125; // Higher than THUMP
    const harmonicFreqs = [250, 375, 500]; // Clean harmonics
    
    for (let i = 0; i < numSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      const time = i / sampleRate;
      
      // Clean envelope
      let envelope = 0;
      if (i < attackSamples) {
        envelope = i / attackSamples; // Linear attack
      } else {
        envelope = Math.exp(-(i - attackSamples) / (decaySamples * 0.5)); // Clean decay
      }
      
      // Clean tap sound synthesis - pure sine waves only
      let tap = 0;
      
      // Fundamental frequency
      tap += Math.sin(2 * Math.PI * fundamentalFreq * time) * 0.4;
      
      // Clean harmonics
      harmonicFreqs.forEach((freq, index) => {
        const harmonicAmp = 0.2 / (index + 2);
        tap += Math.sin(2 * Math.PI * freq * time) * harmonicAmp;
      });
      
      // Apply envelope and amplitude
      channelData[sampleIndex] += tap * envelope * amplitude * 0.5;
    }
  }

  /**
   * Apply minimal processing - no filtering, no effects
   */
  private static applyMinimalProcessing(channelData: Float32Array): void {
    // Only apply very gentle limiting to prevent clipping
    const threshold = 0.95;
    
    for (let i = 0; i < channelData.length; i++) {
      if (Math.abs(channelData[i]) > threshold) {
        channelData[i] = Math.sign(channelData[i]) * threshold;
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
