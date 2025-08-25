/**
 * Realistic Fetal Doppler Ultrasound Heartbeat Synthesizer
 * Creates authentic ultrasound heartbeat sounds that match real fetal Doppler recordings
 */

export interface RealisticFetalDopplerOptions {
  bpm: number;
  duration: number;
  sampleRate: number;
  hasDoublePulse?: boolean;
  timingVariability?: number;
  amplitudeVariation?: number;
}

export interface RealisticFetalDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  hasDoublePulse: boolean;
}

export class RealisticFetalDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate realistic fetal Doppler ultrasound heartbeat audio
   */
  static async generateRealisticFetalDoppler(options: RealisticFetalDopplerOptions): Promise<RealisticFetalDopplerResult> {
    console.log('🎵 Starting realistic fetal Doppler synthesis');
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

      // Generate realistic fetal Doppler heartbeat
      this.generateRealisticFetalDopplerWaveform(channelData, options);

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Realistic fetal Doppler synthesis completed');
      console.log('🎵 Audio blob size:', audioBlob.size, 'bytes');
      console.log('🎵 Audio URL created:', audioUrl);

      return {
        audioUrl,
        duration: options.duration,
        bpm: options.bpm,
        fileSize: audioBlob.size,
        hasDoublePulse: options.hasDoublePulse || false
      };

    } catch (error) {
      console.error('❌ Realistic fetal Doppler synthesis failed:', error);
      throw new Error(`Failed to generate realistic fetal Doppler audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate realistic fetal Doppler waveform
   */
  private static generateRealisticFetalDopplerWaveform(channelData: Float32Array, options: RealisticFetalDopplerOptions): void {
    const { bpm, duration, sampleRate, hasDoublePulse = true, timingVariability = 15, amplitudeVariation = 0.12 } = options;

    console.log('🎵 Generating realistic fetal Doppler waveform...');

    // Generate continuous amniotic fluid background
    this.generateAmnioticBackground(channelData, sampleRate, duration);

    // Calculate beat timing
    const beatInterval = 60 / bpm;
    let currentTime = 0.5; // Start first beat at 500ms

    while (currentTime < duration) {
      // Add natural timing variability
      const timingJitter = (Math.random() - 0.5) * (timingVariability / 1000);
      const actualBeatTime = currentTime + timingJitter;
      
      // Add amplitude variation
      const amplitudeJitter = 1 + (Math.random() - 0.5) * amplitudeVariation;
      
      // Generate primary heartbeat
      this.generatePrimaryHeartbeat(channelData, actualBeatTime, sampleRate, amplitudeJitter);

      // Generate secondary heartbeat for double-pulse
      if (hasDoublePulse) {
        const secondaryTime = actualBeatTime + (0.12 + Math.random() * 0.04); // 120-160ms later
        this.generateSecondaryHeartbeat(channelData, secondaryTime, sampleRate, amplitudeJitter * 0.65);
      }

      currentTime += beatInterval;
    }

    console.log(`🎵 Generated realistic fetal Doppler waveform with ${Math.floor(duration / beatInterval)} beats`);
  }

  /**
   * Generate amniotic fluid background
   */
  private static generateAmnioticBackground(channelData: Float32Array, sampleRate: number, duration: number): void {
    console.log('🎵 Generating amniotic fluid background...');
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Create fluid, muffled background like amniotic fluid
      let background = 0;
      
      // Deep, warm foundation (60-100 Hz) - like fluid movement
      const fluidFreq = 60 + Math.sin(time * 0.03) * 40;
      background += Math.sin(2 * Math.PI * fluidFreq * time) * 0.008;
      
      // Body tissue resonance (120-200 Hz)
      const tissueFreq = 120 + Math.sin(time * 0.05) * 80;
      background += Math.sin(2 * Math.PI * tissueFreq * time) * 0.006;
      
      // Mid-frequency warmth (250-400 Hz)
      const warmthFreq = 250 + Math.sin(time * 0.08) * 150;
      background += Math.sin(2 * Math.PI * warmthFreq * time) * 0.004;
      
      // High-frequency muffled hiss (500-800 Hz) - like fluid turbulence
      const hissFreq = 500 + Math.sin(time * 0.12) * 300;
      background += Math.sin(2 * Math.PI * hissFreq * time) * 0.003;
      
      // Very subtle broadband noise for fluid texture
      background += (Math.random() - 0.5) * 0.004;
      
      // Apply gentle wave-like modulation
      const waveModulation = 1 + Math.sin(time * 0.2) * 0.2;
      background *= waveModulation;
      
      channelData[i] = background;
    }
  }

  /**
   * Generate primary heartbeat (S1 - "lub")
   */
  private static generatePrimaryHeartbeat(channelData: Float32Array, startTime: number, sampleRate: number, amplitude: number): void {
    const startSample = Math.floor(startTime * sampleRate);
    if (startSample >= channelData.length) return;

    // Primary heartbeat characteristics (S1 - "lub")
    const attackTime = 0.008; // 8ms attack
    const decayTime = 0.080; // 80ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.4; // Moderate amplitude for primary

    console.log(`🎵 Generating primary heartbeat: start=${startSample}, attack=${attackSamples}, decay=${decaySamples}, total=${totalSamples}`);

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
      
      // Generate primary heartbeat sound (S1 - "lub")
      const primarySound = this.generatePrimarySound(timeInBeat);
      const sample = primarySound * envelope * maxAmplitude;
      
      channelData[sampleIndex] += sample;
    }
  }

  /**
   * Generate secondary heartbeat (S2 - "dub")
   */
  private static generateSecondaryHeartbeat(channelData: Float32Array, startTime: number, sampleRate: number, amplitude: number): void {
    const startSample = Math.floor(startTime * sampleRate);
    if (startSample >= channelData.length) return;

    // Secondary heartbeat characteristics (S2 - "dub")
    const attackTime = 0.006; // 6ms attack
    const decayTime = 0.060; // 60ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.3; // Lower amplitude for secondary

    console.log(`🎵 Generating secondary heartbeat: start=${startSample}, attack=${attackSamples}, decay=${decaySamples}, total=${totalSamples}`);

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
        envelope = Math.exp(-decayTimeInBeat * 10);
      }
      
      // Generate secondary heartbeat sound (S2 - "dub")
      const secondarySound = this.generateSecondarySound(timeInBeat);
      const sample = secondarySound * envelope * maxAmplitude;
      
      channelData[sampleIndex] += sample;
    }
  }

  /**
   * Generate primary heartbeat sound (S1 - "lub")
   */
  private static generatePrimarySound(time: number): number {
    let sound = 0;
    
    // Primary heartbeat (S1) - deeper, more prominent
    // Fundamental frequency (80-120 Hz) - like ventricular contraction
    const fundamentalFreq = 80 + Math.random() * 40;
    sound += Math.sin(2 * Math.PI * fundamentalFreq * time) * 1.0;
    
    // Rich harmonics for body and warmth
    const harmonic1 = fundamentalFreq * 1.6;
    sound += Math.sin(2 * Math.PI * harmonic1 * time) * 0.7;
    
    const harmonic2 = fundamentalFreq * 2.3;
    sound += Math.sin(2 * Math.PI * harmonic2 * time) * 0.5;
    
    // Low-mid warmth (150-250 Hz) - like blood flow
    const warmthFreq = 150 + Math.random() * 100;
    sound += Math.sin(2 * Math.PI * warmthFreq * time) * 0.8;
    
    // Mid-frequency body (300-450 Hz)
    const bodyFreq = 300 + Math.random() * 150;
    sound += Math.sin(2 * Math.PI * bodyFreq * time) * 0.6;
    
    // High-frequency clarity (500-700 Hz) - like valve closure
    const clarityFreq = 500 + Math.random() * 200;
    sound += Math.sin(2 * Math.PI * clarityFreq * time) * 0.4;
    
    // Add broadband noise for realistic texture
    sound += (Math.random() - 0.5) * 0.3;
    
    return sound * 0.6;
  }

  /**
   * Generate secondary heartbeat sound (S2 - "dub")
   */
  private static generateSecondarySound(time: number): number {
    let sound = 0;
    
    // Secondary heartbeat (S2) - softer, higher frequency
    // Fundamental frequency (100-140 Hz) - like semilunar valve closure
    const fundamentalFreq = 100 + Math.random() * 40;
    sound += Math.sin(2 * Math.PI * fundamentalFreq * time) * 0.8;
    
    // Mid harmonics for body
    const harmonic1 = fundamentalFreq * 1.8;
    sound += Math.sin(2 * Math.PI * harmonic1 * time) * 0.6;
    
    // Higher frequency for "dub" character (400-600 Hz)
    const dubFreq = 400 + Math.random() * 200;
    sound += Math.sin(2 * Math.PI * dubFreq * time) * 0.7;
    
    // High frequency hiss for Doppler character (700-1000 Hz)
    const hissFreq = 700 + Math.random() * 300;
    sound += Math.sin(2 * Math.PI * hissFreq * time) * 0.5;
    
    // Add broadband noise for realistic texture
    sound += (Math.random() - 0.5) * 0.25;
    
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
