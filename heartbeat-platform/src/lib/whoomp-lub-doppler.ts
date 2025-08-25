/**
 * Whoomp-Lub Fetal Doppler Ultrasound Heartbeat Synthesizer
 * Creates authentic "whoomp-lub" double-pulse patterns with warm, organic background
 */

export interface WhoompLubDopplerOptions {
  bpm: number;
  duration: number;
  sampleRate: number;
  timingVariability?: number;
  amplitudeVariation?: number;
}

export interface WhoompLubDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  hasDoublePulse: boolean;
}

export class WhoompLubDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate realistic fetal Doppler ultrasound heartbeat with whoomp-lub pattern
   */
  static async generateWhoompLubDoppler(options: WhoompLubDopplerOptions): Promise<WhoompLubDopplerResult> {
    console.log('🎵 Starting whoomp-lub Doppler synthesis');
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

      // Generate whoomp-lub Doppler waveform
      this.generateWhoompLubWaveform(channelData, options);

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Whoomp-lub Doppler synthesis completed');
      console.log('🎵 Audio blob size:', audioBlob.size, 'bytes');
      console.log('🎵 Audio URL created:', audioUrl);

      return {
        audioUrl,
        duration: options.duration,
        bpm: options.bpm,
        fileSize: audioBlob.size,
        hasDoublePulse: true
      };

    } catch (error) {
      console.error('❌ Whoomp-lub Doppler synthesis failed:', error);
      throw new Error(`Failed to generate whoomp-lub Doppler audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate whoomp-lub waveform with continuous background
   */
  private static generateWhoompLubWaveform(channelData: Float32Array, options: WhoompLubDopplerOptions): void {
    const { bpm, duration, sampleRate, timingVariability = 12, amplitudeVariation = 0.10 } = options;

    console.log('🎵 Generating whoomp-lub waveform...');

    // Generate continuous soft, wave-like background hum first
    this.generateContinuousBackground(channelData, sampleRate, duration);

    // Calculate beat timing
    const beatInterval = 60 / bpm;
    let currentTime = 0.4; // Start first beat at 400ms

    while (currentTime < duration) {
      // Add natural timing variability
      const timingJitter = (Math.random() - 0.5) * (timingVariability / 1000);
      const actualBeatTime = currentTime + timingJitter;
      
      // Add amplitude variation
      const amplitudeJitter = 1 + (Math.random() - 0.5) * amplitudeVariation;
      
      // Generate whoomp (deeper, rounded)
      this.generateWhoomp(channelData, actualBeatTime, sampleRate, amplitudeJitter);

      // Generate lub (softer) immediately after
      const lubTime = actualBeatTime + (0.08 + Math.random() * 0.02); // 80-100ms later
      this.generateLub(channelData, lubTime, sampleRate, amplitudeJitter * 0.6);

      currentTime += beatInterval;
    }

    console.log(`🎵 Generated whoomp-lub waveform with ${Math.floor(duration / beatInterval)} beats`);
  }

  /**
   * Generate continuous soft, wave-like background hum
   */
  private static generateContinuousBackground(channelData: Float32Array, sampleRate: number, duration: number): void {
    console.log('🎵 Generating continuous soft, wave-like background hum...');
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Create fluid, muffled background as if heard through amniotic fluid and body tissue
      let background = 0;
      
      // Deep, warm foundation (50-90 Hz) - like fluid movement
      const fluidFreq = 50 + Math.sin(time * 0.02) * 40;
      background += Math.sin(2 * Math.PI * fluidFreq * time) * 0.006;
      
      // Body tissue resonance (100-180 Hz)
      const tissueFreq = 100 + Math.sin(time * 0.04) * 80;
      background += Math.sin(2 * Math.PI * tissueFreq * time) * 0.005;
      
      // Mid-frequency warmth (200-350 Hz)
      const warmthFreq = 200 + Math.sin(time * 0.06) * 150;
      background += Math.sin(2 * Math.PI * warmthFreq * time) * 0.004;
      
      // High-frequency muffled hiss (400-700 Hz) - like fluid turbulence
      const hissFreq = 400 + Math.sin(time * 0.08) * 300;
      background += Math.sin(2 * Math.PI * hissFreq * time) * 0.003;
      
      // Very subtle broadband noise for fluid texture
      background += (Math.random() - 0.5) * 0.003;
      
      // Apply gentle wave-like modulation for fluid quality
      const waveModulation = 1 + Math.sin(time * 0.15) * 0.15;
      background *= waveModulation;
      
      channelData[i] = background;
    }
  }

  /**
   * Generate whoomp (deeper, rounded sound)
   */
  private static generateWhoomp(channelData: Float32Array, startTime: number, sampleRate: number, amplitude: number): void {
    const startSample = Math.floor(startTime * sampleRate);
    if (startSample >= channelData.length) return;

    // Whoomp characteristics: deeper, rounded, longer duration
    const attackTime = 0.012; // 12ms attack
    const sustainTime = 0.030; // 30ms sustain
    const decayTime = 0.100; // 100ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const sustainSamples = Math.floor(sustainTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + sustainSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.5; // Stronger amplitude for whoomp

    console.log(`🎵 Generating whoomp: start=${startSample}, attack=${attackSamples}, sustain=${sustainSamples}, decay=${decaySamples}, total=${totalSamples}`);

    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;

      const timeInBeat = i / sampleRate;
      
      // Calculate envelope
      let envelope = 0;
      if (i < attackSamples) {
        // Smooth attack
        envelope = Math.pow(i / attackSamples, 0.8);
      } else if (i < attackSamples + sustainSamples) {
        // Sustain with slight variation
        envelope = 1.0 + (Math.random() - 0.5) * 0.05;
      } else {
        // Natural decay
        const decayTimeInBeat = (i - attackSamples - sustainSamples) / sampleRate;
        envelope = Math.exp(-decayTimeInBeat * 6);
      }
      
      // Generate whoomp sound (deeper, rounded)
      const whoompSound = this.generateWhoompSound(timeInBeat);
      const sample = whoompSound * envelope * maxAmplitude;
      
      channelData[sampleIndex] += sample;
    }
  }

  /**
   * Generate lub (softer sound)
   */
  private static generateLub(channelData: Float32Array, startTime: number, sampleRate: number, amplitude: number): void {
    const startSample = Math.floor(startTime * sampleRate);
    if (startSample >= channelData.length) return;

    // Lub characteristics: softer, shorter duration
    const attackTime = 0.006; // 6ms attack
    const decayTime = 0.070; // 70ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.35; // Lower amplitude for lub

    console.log(`🎵 Generating lub: start=${startSample}, attack=${attackSamples}, decay=${decaySamples}, total=${totalSamples}`);

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
        envelope = Math.exp(-decayTimeInBeat * 8);
      }
      
      // Generate lub sound (softer, higher frequency)
      const lubSound = this.generateLubSound(timeInBeat);
      const sample = lubSound * envelope * maxAmplitude;
      
      channelData[sampleIndex] += sample;
    }
  }

  /**
   * Generate whoomp sound (deeper, rounded)
   */
  private static generateWhoompSound(time: number): number {
    let sound = 0;
    
    // Whoomp: deeper, rounded sound
    // Fundamental frequency (60-100 Hz) - deep foundation
    const fundamentalFreq = 60 + Math.random() * 40;
    sound += Math.sin(2 * Math.PI * fundamentalFreq * time) * 1.0;
    
    // Rich harmonics for rounded quality
    const harmonic1 = fundamentalFreq * 1.4;
    sound += Math.sin(2 * Math.PI * harmonic1 * time) * 0.8;
    
    const harmonic2 = fundamentalFreq * 2.1;
    sound += Math.sin(2 * Math.PI * harmonic2 * time) * 0.6;
    
    // Low-mid warmth (120-200 Hz) - for rounded character
    const warmthFreq = 120 + Math.random() * 80;
    sound += Math.sin(2 * Math.PI * warmthFreq * time) * 0.9;
    
    // Mid-frequency body (250-400 Hz)
    const bodyFreq = 250 + Math.random() * 150;
    sound += Math.sin(2 * Math.PI * bodyFreq * time) * 0.7;
    
    // Subtle high frequency for clarity (450-650 Hz)
    const clarityFreq = 450 + Math.random() * 200;
    sound += Math.sin(2 * Math.PI * clarityFreq * time) * 0.4;
    
    // Add broadband noise for organic texture
    sound += (Math.random() - 0.5) * 0.25;
    
    return sound * 0.7;
  }

  /**
   * Generate lub sound (softer, higher frequency)
   */
  private static generateLubSound(time: number): number {
    let sound = 0;
    
    // Lub: softer, higher frequency sound
    // Fundamental frequency (90-130 Hz) - higher than whoomp
    const fundamentalFreq = 90 + Math.random() * 40;
    sound += Math.sin(2 * Math.PI * fundamentalFreq * time) * 0.8;
    
    // Mid harmonics for body
    const harmonic1 = fundamentalFreq * 1.7;
    sound += Math.sin(2 * Math.PI * harmonic1 * time) * 0.6;
    
    // Higher frequency for "lub" character (350-550 Hz)
    const lubFreq = 350 + Math.random() * 200;
    sound += Math.sin(2 * Math.PI * lubFreq * time) * 0.7;
    
    // High frequency hiss for Doppler character (600-900 Hz)
    const hissFreq = 600 + Math.random() * 300;
    sound += Math.sin(2 * Math.PI * hissFreq * time) * 0.5;
    
    // Add broadband noise for realistic texture
    sound += (Math.random() - 0.5) * 0.2;
    
    return sound * 0.5;
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
