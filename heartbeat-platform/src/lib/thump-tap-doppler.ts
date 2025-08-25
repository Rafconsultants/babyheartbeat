/**
 * Thump-Tap Fetal Doppler Ultrasound Heartbeat Synthesizer
 * Creates soft, muffled fetal heartbeat with THUMP-tap pattern
 */

export interface ThumpTapDopplerOptions {
  bpm: number;
  duration: number;
  sampleRate: number;
  beatTimesSec: number[];
  doublePulseOffsetMs?: number | null;
  amplitudeScalars?: number[];
  confidence?: number;
}

export interface ThumpTapDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  hasDoublePulse: boolean;
  beatCount: number;
}

export class ThumpTapDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate soft, muffled fetal heartbeat with THUMP-tap pattern
   */
  static async generateThumpTapDoppler(options: ThumpTapDopplerOptions): Promise<ThumpTapDopplerResult> {
    console.log('🎵 Starting thump-tap Doppler synthesis');
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

      // Generate thump-tap Doppler waveform
      this.generateThumpTapWaveform(channelData, options);

      // Apply warm, muffled processing
      this.applyWarmMuffledProcessing(channelData);

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Thump-tap Doppler synthesis completed');
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
      console.error('❌ Thump-tap Doppler synthesis failed:', error);
      throw new Error(`Failed to generate thump-tap Doppler audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate thump-tap waveform with warm, echoing characteristics
   */
  private static generateThumpTapWaveform(channelData: Float32Array, options: ThumpTapDopplerOptions): void {
    const { sampleRate, duration, beatTimesSec, doublePulseOffsetMs, amplitudeScalars = [] } = options;

    console.log('🎵 Generating thump-tap waveform...');
    console.log('🎵 Beat times:', beatTimesSec);
    console.log('🎵 Double pulse offset:', doublePulseOffsetMs, 'ms');

    // Generate soft, warm background first
    this.generateWarmBackground(channelData, sampleRate, duration);

    // Generate thump-tap pattern at each beat onset
    for (let i = 0; i < beatTimesSec.length; i++) {
      const beatTime = beatTimesSec[i];
      const amplitudeScalar = amplitudeScalars[i] || 0.8;
      
      // Generate THUMP (deeper, muffled)
      this.generateThump(channelData, beatTime, sampleRate, amplitudeScalar);

      // Generate tap (softer) closely after
      const tapTime = beatTime + (0.06 + Math.random() * 0.02); // 60-80ms later
      const tapAmplitude = amplitudeScalar * (0.4 + Math.random() * 0.2); // 40-60% of thump
      this.generateTap(channelData, tapTime, sampleRate, tapAmplitude);
    }

    console.log(`🎵 Generated thump-tap waveform with ${beatTimesSec.length} beats`);
  }

  /**
   * Generate soft, warm background like inside the body
   */
  private static generateWarmBackground(channelData: Float32Array, sampleRate: number, duration: number): void {
    console.log('🎵 Generating warm, muffled background...');
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Create warm, muffled background like inside the body
      let background = 0;
      
      // Deep, warm foundation (40-80 Hz) - like body tissue
      const tissueFreq = 40 + Math.sin(time * 0.015) * 40;
      background += Math.sin(2 * Math.PI * tissueFreq * time) * 0.008;
      
      // Body cavity resonance (90-150 Hz)
      const cavityFreq = 90 + Math.sin(time * 0.025) * 60;
      background += Math.sin(2 * Math.PI * cavityFreq * time) * 0.006;
      
      // Mid-frequency warmth (180-300 Hz)
      const warmthFreq = 180 + Math.sin(time * 0.035) * 120;
      background += Math.sin(2 * Math.PI * warmthFreq * time) * 0.005;
      
      // High-frequency muffled hiss (350-600 Hz) - like fluid movement
      const hissFreq = 350 + Math.sin(time * 0.045) * 250;
      background += Math.sin(2 * Math.PI * hissFreq * time) * 0.004;
      
      // Very subtle broadband noise for body texture
      background += (Math.random() - 0.5) * 0.004;
      
      // Apply gentle modulation for "inside body" quality
      const bodyModulation = 1 + Math.sin(time * 0.12) * 0.12;
      background *= bodyModulation;
      
      channelData[i] = background;
    }
  }

  /**
   * Generate THUMP (deeper, muffled sound)
   */
  private static generateThump(channelData: Float32Array, startTime: number, sampleRate: number, amplitude: number): void {
    const startSample = Math.floor(startTime * sampleRate);
    if (startSample >= channelData.length) return;

    // THUMP characteristics: deeper, muffled, longer duration
    const attackTime = 0.015; // 15ms attack
    const sustainTime = 0.040; // 40ms sustain
    const decayTime = 0.120; // 120ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const sustainSamples = Math.floor(sustainTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + sustainSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.6; // Strong amplitude for thump

    console.log(`🎵 Generating THUMP: start=${startSample}, attack=${attackSamples}, sustain=${sustainSamples}, decay=${decaySamples}, total=${totalSamples}`);

    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;

      const timeInBeat = i / sampleRate;
      
      // Calculate envelope
      let envelope = 0;
      if (i < attackSamples) {
        // Smooth attack
        envelope = Math.pow(i / attackSamples, 0.7);
      } else if (i < attackSamples + sustainSamples) {
        // Sustain with slight variation
        envelope = 1.0 + (Math.random() - 0.5) * 0.03;
      } else {
        // Natural decay
        const decayTimeInBeat = (i - attackSamples - sustainSamples) / sampleRate;
        envelope = Math.exp(-decayTimeInBeat * 5);
      }
      
      // Generate thump sound (deeper, muffled)
      const thumpSound = this.generateThumpSound(timeInBeat);
      const sample = thumpSound * envelope * maxAmplitude;
      
      channelData[sampleIndex] += sample;
    }
  }

  /**
   * Generate tap (softer sound)
   */
  private static generateTap(channelData: Float32Array, startTime: number, sampleRate: number, amplitude: number): void {
    const startSample = Math.floor(startTime * sampleRate);
    if (startSample >= channelData.length) return;

    // Tap characteristics: softer, shorter duration
    const attackTime = 0.008; // 8ms attack
    const decayTime = 0.080; // 80ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.45; // Lower amplitude for tap

    console.log(`🎵 Generating tap: start=${startSample}, attack=${attackSamples}, decay=${decaySamples}, total=${totalSamples}`);

    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;

      const timeInBeat = i / sampleRate;
      
      // Calculate envelope
      let envelope = 0;
      if (i < attackSamples) {
        // Sharp attack
        envelope = i / attackSamples;
      } else {
        // Natural decay
        const decayTimeInBeat = (i - attackSamples) / sampleRate;
        envelope = Math.exp(-decayTimeInBeat * 7);
      }
      
      // Generate tap sound (softer, higher frequency)
      const tapSound = this.generateTapSound(timeInBeat);
      const sample = tapSound * envelope * maxAmplitude;
      
      channelData[sampleIndex] += sample;
    }
  }

  /**
   * Generate thump sound (deeper, muffled)
   */
  private static generateThumpSound(time: number): number {
    let sound = 0;
    
    // THUMP: deeper, muffled sound like inside the body
    // Fundamental frequency (50-90 Hz) - deep foundation
    const fundamentalFreq = 50 + Math.random() * 40;
    sound += Math.sin(2 * Math.PI * fundamentalFreq * time) * 1.0;
    
    // Rich harmonics for muffled quality
    const harmonic1 = fundamentalFreq * 1.3;
    sound += Math.sin(2 * Math.PI * harmonic1 * time) * 0.9;
    
    const harmonic2 = fundamentalFreq * 1.8;
    sound += Math.sin(2 * Math.PI * harmonic2 * time) * 0.7;
    
    // Low-mid warmth (100-180 Hz) - for muffled character
    const warmthFreq = 100 + Math.random() * 80;
    sound += Math.sin(2 * Math.PI * warmthFreq * time) * 0.8;
    
    // Mid-frequency body (200-350 Hz)
    const bodyFreq = 200 + Math.random() * 150;
    sound += Math.sin(2 * Math.PI * bodyFreq * time) * 0.6;
    
    // Subtle high frequency for clarity (400-600 Hz)
    const clarityFreq = 400 + Math.random() * 200;
    sound += Math.sin(2 * Math.PI * clarityFreq * time) * 0.3;
    
    // Add broadband noise for muffled texture
    sound += (Math.random() - 0.5) * 0.2;
    
    return sound * 0.8;
  }

  /**
   * Generate tap sound (softer, higher frequency)
   */
  private static generateTapSound(time: number): number {
    let sound = 0;
    
    // Tap: softer, higher frequency sound
    // Fundamental frequency (80-120 Hz) - higher than thump
    const fundamentalFreq = 80 + Math.random() * 40;
    sound += Math.sin(2 * Math.PI * fundamentalFreq * time) * 0.7;
    
    // Mid harmonics for body
    const harmonic1 = fundamentalFreq * 1.5;
    sound += Math.sin(2 * Math.PI * harmonic1 * time) * 0.5;
    
    // Higher frequency for "tap" character (300-500 Hz)
    const tapFreq = 300 + Math.random() * 200;
    sound += Math.sin(2 * Math.PI * tapFreq * time) * 0.6;
    
    // High frequency hiss for Doppler character (500-800 Hz)
    const hissFreq = 500 + Math.random() * 300;
    sound += Math.sin(2 * Math.PI * hissFreq * time) * 0.4;
    
    // Add broadband noise for realistic texture
    sound += (Math.random() - 0.5) * 0.15;
    
    return sound * 0.6;
  }

  /**
   * Apply warm, muffled processing for "inside body" effect
   */
  private static applyWarmMuffledProcessing(channelData: Float32Array): void {
    console.log('🎵 Applying warm, muffled processing...');
    
    // Apply gentle low-pass filtering for muffled effect
    const filterStrength = 0.3;
    let previousSample = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const currentSample = channelData[i];
      
      // Simple low-pass filter for muffled effect
      channelData[i] = previousSample * filterStrength + currentSample * (1 - filterStrength);
      previousSample = channelData[i];
      
      // Add slight warmth by boosting low frequencies
      if (i > 0) {
        const warmthBoost = 0.1;
        channelData[i] += channelData[i - 1] * warmthBoost;
      }
    }
    
    // Apply gentle compression for "inside body" dynamics
    const threshold = 0.4;
    const ratio = 2;
    
    for (let i = 0; i < channelData.length; i++) {
      let sample = channelData[i];
      
      // Apply gentle compression
      if (Math.abs(sample) > threshold) {
        const excess = Math.abs(sample) - threshold;
        const gainReduction = excess * (1 - 1/ratio);
        sample = Math.sign(sample) * (Math.abs(sample) - gainReduction);
      }
      
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
