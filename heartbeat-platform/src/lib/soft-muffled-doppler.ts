/**
 * Soft Muffled Fetal Doppler Ultrasound Heartbeat Synthesizer
 * Creates authentic soft, muffled fetal heartbeat with THUMP-tap pattern
 */

export interface SoftMuffledDopplerOptions {
  bpm: number;
  duration: number;
  sampleRate: number;
  beatTimesSec: number[];
  doublePulseOffsetMs?: number | null;
  amplitudeScalars?: number[];
  confidence?: number;
}

export interface SoftMuffledDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  hasDoublePulse: boolean;
  beatCount: number;
}

export class SoftMuffledDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate soft, muffled fetal heartbeat with authentic THUMP-tap pattern
   */
  static async generateSoftMuffledDoppler(options: SoftMuffledDopplerOptions): Promise<SoftMuffledDopplerResult> {
    console.log('🎵 Starting soft muffled Doppler synthesis');
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

      // Generate soft muffled Doppler waveform
      this.generateSoftMuffledWaveform(channelData, options);

      // Apply authentic Doppler processing
      this.applyDopplerProcessing(channelData);

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Soft muffled Doppler synthesis completed');
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
      console.error('❌ Soft muffled Doppler synthesis failed:', error);
      throw new Error(`Failed to generate soft muffled Doppler audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate soft muffled waveform with authentic THUMP-tap pattern
   */
  private static generateSoftMuffledWaveform(channelData: Float32Array, options: SoftMuffledDopplerOptions): void {
    const { sampleRate, duration, beatTimesSec, amplitudeScalars = [] } = options;

    console.log('🎵 Generating soft muffled waveform...');
    console.log('🎵 Beat times:', beatTimesSec);

    // Generate soft, warm background first
    this.generateSoftBackground(channelData, sampleRate, duration);

    // Generate THUMP-tap pattern at each beat onset
    for (let i = 0; i < beatTimesSec.length; i++) {
      const beatTime = beatTimesSec[i];
      const amplitudeScalar = amplitudeScalars[i] || 0.8;
      
      // Generate THUMP (deeper, muffled)
      this.generateThump(channelData, beatTime, sampleRate, amplitudeScalar);

      // Generate tap (softer) closely after
      const tapTime = beatTime + 0.065; // 65ms later (fixed for consistency)
      const tapAmplitude = amplitudeScalar * 0.5; // 50% of thump
      this.generateTap(channelData, tapTime, sampleRate, tapAmplitude);
    }

    console.log(`🎵 Generated soft muffled waveform with ${beatTimesSec.length} beats`);
  }

  /**
   * Generate soft, warm background like inside the body
   */
  private static generateSoftBackground(channelData: Float32Array, sampleRate: number, duration: number): void {
    console.log('🎵 Generating soft, warm background...');
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Create very soft, warm background like inside the body
      let background = 0;
      
      // Very deep, warm foundation (30-70 Hz) - like body tissue
      const tissueFreq = 30 + Math.sin(time * 0.01) * 40;
      background += Math.sin(2 * Math.PI * tissueFreq * time) * 0.003;
      
      // Body cavity resonance (80-140 Hz)
      const cavityFreq = 80 + Math.sin(time * 0.02) * 60;
      background += Math.sin(2 * Math.PI * cavityFreq * time) * 0.002;
      
      // Mid-frequency warmth (150-280 Hz)
      const warmthFreq = 150 + Math.sin(time * 0.03) * 130;
      background += Math.sin(2 * Math.PI * warmthFreq * time) * 0.002;
      
      // High-frequency very soft hiss (300-500 Hz) - like fluid movement
      const hissFreq = 300 + Math.sin(time * 0.04) * 200;
      background += Math.sin(2 * Math.PI * hissFreq * time) * 0.001;
      
      // Very subtle broadband noise for body texture
      background += (Math.random() - 0.5) * 0.001;
      
      // Apply very gentle modulation for "inside body" quality
      const bodyModulation = 1 + Math.sin(time * 0.08) * 0.08;
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
    const attackTime = 0.020; // 20ms attack
    const sustainTime = 0.050; // 50ms sustain
    const decayTime = 0.150; // 150ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const sustainSamples = Math.floor(sustainTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + sustainSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.4; // Moderate amplitude for soft sound

    console.log(`🎵 Generating THUMP: start=${startSample}, attack=${attackSamples}, sustain=${sustainSamples}, decay=${decaySamples}, total=${totalSamples}`);

    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;

      const timeInBeat = i / sampleRate;
      
      // Calculate envelope
      let envelope = 0;
      if (i < attackSamples) {
        // Smooth attack
        envelope = Math.pow(i / attackSamples, 0.6);
      } else if (i < attackSamples + sustainSamples) {
        // Sustain with slight variation
        envelope = 1.0 + (Math.random() - 0.5) * 0.02;
      } else {
        // Natural decay
        const decayTimeInBeat = (i - attackSamples - sustainSamples) / sampleRate;
        envelope = Math.exp(-decayTimeInBeat * 4);
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
    const attackTime = 0.010; // 10ms attack
    const decayTime = 0.100; // 100ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.3; // Lower amplitude for tap

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
        envelope = Math.exp(-decayTimeInBeat * 6);
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
    // Fundamental frequency (40-80 Hz) - deep foundation
    const fundamentalFreq = 40 + Math.random() * 40;
    sound += Math.sin(2 * Math.PI * fundamentalFreq * time) * 1.0;
    
    // Rich harmonics for muffled quality
    const harmonic1 = fundamentalFreq * 1.2;
    sound += Math.sin(2 * Math.PI * harmonic1 * time) * 0.8;
    
    const harmonic2 = fundamentalFreq * 1.6;
    sound += Math.sin(2 * Math.PI * harmonic2 * time) * 0.6;
    
    // Low-mid warmth (90-160 Hz) - for muffled character
    const warmthFreq = 90 + Math.random() * 70;
    sound += Math.sin(2 * Math.PI * warmthFreq * time) * 0.7;
    
    // Mid-frequency body (180-320 Hz)
    const bodyFreq = 180 + Math.random() * 140;
    sound += Math.sin(2 * Math.PI * bodyFreq * time) * 0.5;
    
    // Subtle high frequency for clarity (350-550 Hz)
    const clarityFreq = 350 + Math.random() * 200;
    sound += Math.sin(2 * Math.PI * clarityFreq * time) * 0.2;
    
    // Add broadband noise for muffled texture
    sound += (Math.random() - 0.5) * 0.15;
    
    return sound * 0.7;
  }

  /**
   * Generate tap sound (softer, higher frequency)
   */
  private static generateTapSound(time: number): number {
    let sound = 0;
    
    // Tap: softer, higher frequency sound
    // Fundamental frequency (70-110 Hz) - higher than thump
    const fundamentalFreq = 70 + Math.random() * 40;
    sound += Math.sin(2 * Math.PI * fundamentalFreq * time) * 0.6;
    
    // Mid harmonics for body
    const harmonic1 = fundamentalFreq * 1.4;
    sound += Math.sin(2 * Math.PI * harmonic1 * time) * 0.4;
    
    // Higher frequency for "tap" character (250-450 Hz)
    const tapFreq = 250 + Math.random() * 200;
    sound += Math.sin(2 * Math.PI * tapFreq * time) * 0.5;
    
    // High frequency hiss for Doppler character (450-700 Hz)
    const hissFreq = 450 + Math.random() * 250;
    sound += Math.sin(2 * Math.PI * hissFreq * time) * 0.3;
    
    // Add broadband noise for realistic texture
    sound += (Math.random() - 0.5) * 0.1;
    
    return sound * 0.5;
  }

  /**
   * Apply authentic Doppler processing for soft, muffled effect
   */
  private static applyDopplerProcessing(channelData: Float32Array): void {
    console.log('🎵 Applying authentic Doppler processing...');
    
    // Apply gentle low-pass filtering for muffled effect
    const filterStrength = 0.4;
    let previousSample = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const currentSample = channelData[i];
      
      // Simple low-pass filter for muffled effect
      channelData[i] = previousSample * filterStrength + currentSample * (1 - filterStrength);
      previousSample = channelData[i];
      
      // Add slight warmth by boosting low frequencies
      if (i > 0) {
        const warmthBoost = 0.08;
        channelData[i] += channelData[i - 1] * warmthBoost;
      }
    }
    
    // Apply gentle compression for "inside body" dynamics
    const threshold = 0.3;
    const ratio = 1.8;
    
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
