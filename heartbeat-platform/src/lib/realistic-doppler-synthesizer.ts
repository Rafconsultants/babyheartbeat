/**
 * Realistic Fetal Doppler Ultrasound Heartbeat Synthesizer
 * Implements exact specifications for authentic fetal Doppler sounds
 */

export interface RealisticDopplerOptions {
  bpm: number;
  duration: number;
  sampleRate: number;
  hasDoublePulse?: boolean;
  doublePulseOffset?: number; // ms
  timingVariability?: number; // ms
  amplitudeVariation?: number; // 0-1
}

export interface RealisticDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  hasDoublePulse: boolean;
}

export class RealisticDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate realistic fetal Doppler ultrasound heartbeat audio
   */
  static async generateRealisticDoppler(options: RealisticDopplerOptions): Promise<RealisticDopplerResult> {
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

      // Generate realistic Doppler heartbeat
      this.generateRealisticDopplerWaveform(channelData, options);

      // Verify audio content
      const hasAudio = this.verifyAudioContent(channelData);
      if (!hasAudio) {
        console.warn('🎵 Generated audio is too quiet, applying amplification');
        this.amplifyAudio(channelData, 5.0); // Amplify by 5x
        
        // Check again after amplification
        const stillNoAudio = this.verifyAudioContent(channelData);
        if (!stillNoAudio) {
          console.warn('🎵 Still no audio after amplification, generating fallback');
          this.generateFallbackAudio(channelData, options);
        }
      }

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Realistic Doppler synthesis completed');
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
      console.error('❌ Realistic Doppler synthesis failed:', error);
      throw new Error(`Failed to generate realistic Doppler audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate the realistic Doppler waveform with exact specifications
   */
  private static generateRealisticDopplerWaveform(channelData: Float32Array, options: RealisticDopplerOptions): void {
    const { bpm, duration, sampleRate, hasDoublePulse = false, doublePulseOffset = 55, timingVariability = 15, amplitudeVariation = 0.1 } = options;

    console.log('🎵 Generating realistic Doppler waveform...');

    // Calculate beat timing
    const beatInterval = 60 / bpm; // seconds between beats
    const totalSamples = channelData.length;

    console.log('🎵 Beat interval:', beatInterval, 'seconds');
    console.log('🎵 Total samples:', totalSamples);

    // Generate heartbeat pattern
    let currentTime = 0.2; // Start first beat at 200ms
    let beatCount = 0;

    while (currentTime < duration) {
      // Add timing variability (±10-20ms)
      const timingJitter = (Math.random() - 0.5) * (timingVariability / 1000);
      const actualBeatTime = currentTime + timingJitter;
      
      // Add amplitude variation
      const amplitudeJitter = 1 + (Math.random() - 0.5) * amplitudeVariation;
      
      // Generate primary beat
      this.generateNoiseBurst(
        channelData,
        actualBeatTime,
        sampleRate,
        amplitudeJitter,
        true
      );

      // Generate secondary beat for double pulse
      if (hasDoublePulse) {
        const secondaryTime = actualBeatTime + (doublePulseOffset / 1000);
        this.generateNoiseBurst(
          channelData,
          secondaryTime,
          sampleRate,
          amplitudeJitter * 0.6, // 60% of primary amplitude
          false
        );
      }

      currentTime += beatInterval;
      beatCount++;
    }

    // Add subtle background noise
    this.addBackgroundNoise(channelData, sampleRate);

    console.log(`🎵 Generated ${beatCount} beats at ${bpm} BPM`);
  }

  /**
   * Generate a noise burst with exact attack/decay specifications
   */
  private static generateNoiseBurst(
    channelData: Float32Array,
    startTime: number,
    sampleRate: number,
    amplitude: number,
    isPrimary: boolean
  ): void {
    const startSample = Math.floor(startTime * sampleRate);
    
    if (startSample >= channelData.length) return;
    
    // Attack: 5-10ms, Decay: 60-100ms (exact specifications)
    const attackTime = isPrimary ? 0.008 : 0.006; // 8ms for primary, 6ms for secondary
    const decayTime = isPrimary ? 0.080 : 0.060; // 80ms for primary, 60ms for secondary
    
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.3; // Strong amplitude for clear beats

    console.log(`🎵 Generating burst: start=${startSample}, attack=${attackSamples}, decay=${decaySamples}, total=${totalSamples}, amplitude=${maxAmplitude}`);

    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;

      const timeInBurst = i / sampleRate;
      
      // Calculate envelope with exact specifications
      let envelope = 0;
      if (i < attackSamples) {
        // Attack: linear rise (5-10ms)
        envelope = i / attackSamples;
      } else {
        // Decay: exponential fall (60-100ms)
        const decayTimeInBurst = (i - attackSamples) / sampleRate;
        envelope = Math.exp(-decayTimeInBurst * 6); // Fast decay for realistic sound
      }

      // Generate filtered noise with band-pass characteristics
      const noise = this.generateFilteredNoise(timeInBurst);
      const sample = noise * envelope * maxAmplitude;
      
      channelData[sampleIndex] += sample;
    }
  }

  /**
   * Generate filtered noise with band-pass characteristics (200-1200 Hz, emphasis 150-300 Hz)
   */
  private static generateFilteredNoise(time: number): number {
    let filteredNoise = 0;
    
    // Primary emphasis band (150-300 Hz) - the "thump"
    const primaryFreq = 200 + Math.random() * 100; // 200-300 Hz
    filteredNoise += Math.sin(2 * Math.PI * primaryFreq * time) * 1.0; // Strong emphasis
    
    // Secondary band (300-600 Hz) - body
    const secondaryFreq = 400 + Math.random() * 200;
    filteredNoise += Math.sin(2 * Math.PI * secondaryFreq * time) * 0.6;
    
    // Upper band (600-1200 Hz) - brightness
    const upperFreq = 800 + Math.random() * 400;
    filteredNoise += Math.sin(2 * Math.PI * upperFreq * time) * 0.4;
    
    // Add broadband noise for authenticity
    filteredNoise += (Math.random() - 0.5) * 0.5;
    
    return filteredNoise * 0.8; // Normalize
  }

  /**
   * Add subtle background noise
   */
  private static addBackgroundNoise(channelData: Float32Array, sampleRate: number): void {
    console.log('🎵 Adding background noise...');
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Generate low-level pink noise
      let background = 0;
      
      // Low frequency warmth
      const warmFreq = 150 + Math.sin(time * 0.1) * 50;
      background += Math.sin(2 * Math.PI * warmFreq * time) * 0.02;
      
      // Mid frequency body
      const bodyFreq = 400 + Math.sin(time * 0.2) * 100;
      background += Math.sin(2 * Math.PI * bodyFreq * time) * 0.015;
      
      // High frequency air
      const airFreq = 800 + Math.sin(time * 0.3) * 200;
      background += Math.sin(2 * Math.PI * airFreq * time) * 0.01;
      
      // Add broadband noise
      background += (Math.random() - 0.5) * 0.03;
      
      channelData[i] += background;
    }
  }

  /**
   * Verify audio content has sufficient amplitude
   */
  private static verifyAudioContent(channelData: Float32Array): boolean {
    let maxAmplitude = 0;
    let rms = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const absValue = Math.abs(channelData[i]);
      maxAmplitude = Math.max(maxAmplitude, absValue);
      rms += channelData[i] * channelData[i];
    }
    
    rms = Math.sqrt(rms / channelData.length);
    
    console.log('🎵 Audio verification - Max amplitude:', maxAmplitude, 'RMS:', rms);
    
    return maxAmplitude > 0.01 && rms > 0.005; // Should be audible
  }

  /**
   * Amplify audio if it's too quiet
   */
  private static amplifyAudio(channelData: Float32Array, gain: number): void {
    console.log('🎵 Amplifying audio by', gain, 'x');
    
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] *= gain;
    }
  }

  /**
   * Generate fallback audio if main synthesis fails
   */
  private static generateFallbackAudio(channelData: Float32Array, options: RealisticDopplerOptions): void {
    console.log('🎵 Generating fallback audio...');
    
    const { bpm, duration, sampleRate } = options;
    const beatInterval = 60 / bpm;
    
    // Clear the buffer
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = 0;
    }
    
    // Generate simple but audible heartbeat pattern
    let currentTime = 0.2;
    let beatCount = 0;
    
    while (currentTime < duration) {
      const startSample = Math.floor(currentTime * sampleRate);
      const pulseDuration = 0.1; // 100ms pulse
      const pulseSamples = Math.floor(pulseDuration * sampleRate);
      
      // Generate a simple thump sound
      for (let i = 0; i < pulseSamples; i++) {
        const sampleIndex = startSample + i;
        if (sampleIndex >= channelData.length) break;
        
        const timeInPulse = i / sampleRate;
        const envelope = Math.exp(-timeInPulse * 8); // Fast decay
        
        // Simple thump frequency
        const thumpFreq = 200 + Math.random() * 100;
        const thump = Math.sin(2 * Math.PI * thumpFreq * timeInPulse) * envelope * 0.4;
        
        // Add some noise
        const noise = (Math.random() - 0.5) * envelope * 0.2;
        
        channelData[sampleIndex] = thump + noise;
      }
      
      currentTime += beatInterval;
      beatCount++;
    }
    
    console.log(`🎵 Fallback audio generated: ${beatCount} beats at ${bpm} BPM`);
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
