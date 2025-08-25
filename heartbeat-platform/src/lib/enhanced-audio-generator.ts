/**
 * Enhanced Fetal Doppler Ultrasound Audio Generator
 * Implements waveform extraction, authentic synthesis, and advanced Doppler features
 */

export interface WaveformData {
  peaks: number[];
  amplitudes: number[];
  timing: number[];
  doublePulseOffsets: (number | null)[];
  confidence: number;
  extracted: boolean;
}

export interface DopplerSynthesisOptions {
  bpm: number;
  duration: number;
  sampleRate: number;
  waveformData?: WaveformData;
  hasDoublePulse?: boolean;
  timingVariability?: number;
  amplitudeVariation?: number;
  stereo?: boolean;
  wallFiltering?: boolean;
  spatialReverb?: boolean;
}

export interface DopplerSynthesisResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  hasDoublePulse: boolean;
  waveformExtracted: boolean;
  stereo: boolean;
}

export class EnhancedAudioGenerator {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate enhanced fetal Doppler ultrasound audio with waveform extraction
   */
  static async generateEnhancedDoppler(options: DopplerSynthesisOptions): Promise<DopplerSynthesisResult> {
    console.log('🎵 Starting enhanced Doppler synthesis');
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

      // Create audio buffer (stereo if requested)
      if (!this.audioContext) {
        throw new Error('AudioContext initialization failed');
      }
      
      const channels = options.stereo ? 2 : 1;
      const buffer = this.audioContext.createBuffer(channels, options.sampleRate * options.duration, options.sampleRate);

      // Generate enhanced Doppler waveform
      this.generateEnhancedDopplerWaveform(buffer, options);

      // Apply post-processing
      this.applyPostProcessing(buffer, options);

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Enhanced Doppler synthesis completed');
      console.log('🎵 Audio blob size:', audioBlob.size, 'bytes');
      console.log('🎵 Audio URL created:', audioUrl);

      return {
        audioUrl,
        duration: options.duration,
        bpm: options.bpm,
        fileSize: audioBlob.size,
        hasDoublePulse: options.hasDoublePulse || false,
        waveformExtracted: options.waveformData?.extracted || false,
        stereo: options.stereo || false
      };

    } catch (error) {
      console.error('❌ Enhanced Doppler synthesis failed:', error);
      throw new Error(`Failed to generate enhanced Doppler audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate enhanced Doppler waveform with waveform extraction support
   */
  private static generateEnhancedDopplerWaveform(buffer: AudioBuffer, options: DopplerSynthesisOptions): void {
    const { bpm, duration, sampleRate, waveformData, hasDoublePulse = true, timingVariability = 20, amplitudeVariation = 0.15, stereo = false } = options;

    console.log('🎵 Generating enhanced Doppler waveform...');

    // Generate continuous warm background first
    this.generateDynamicBackground(buffer, sampleRate, duration, stereo);

    // Determine beat pattern from waveform data or fallback
    const beatPattern = this.generateBeatPattern(bpm, duration, sampleRate, waveformData, timingVariability, amplitudeVariation);

    // Generate beats based on pattern
    this.generateAuthenticBeats(buffer, beatPattern, sampleRate, hasDoublePulse, stereo);

    console.log(`🎵 Generated ${beatPattern.length} beats with enhanced Doppler synthesis`);
  }

  /**
   * Generate beat pattern from waveform data or fallback
   */
  private static generateBeatPattern(
    bpm: number,
    duration: number,
    sampleRate: number,
    waveformData?: WaveformData,
    timingVariability: number = 20,
    amplitudeVariation: number = 0.15
  ): Array<{ time: number; amplitude: number; isDoublePulse: boolean; doublePulseOffset: number }> {
    const beatPattern: Array<{ time: number; amplitude: number; isDoublePulse: boolean; doublePulseOffset: number }> = [];

    if (waveformData?.extracted && waveformData.peaks.length > 0) {
      // Use extracted waveform data
      console.log('🎵 Using extracted waveform data for beat pattern');
      
      for (let i = 0; i < waveformData.peaks.length; i++) {
        const time = waveformData.timing[i] || (i * 60 / bpm);
        const amplitude = waveformData.amplitudes[i] || 1.0;
        const isDoublePulse = waveformData.doublePulseOffsets[i] !== null;
        const doublePulseOffset = waveformData.doublePulseOffsets[i] || 120;

        beatPattern.push({
          time: Math.max(0.2, time), // Ensure minimum start time
          amplitude: Math.max(0.3, Math.min(1.0, amplitude)), // Clamp amplitude
          isDoublePulse,
          doublePulseOffset
        });
      }
    } else {
      // Generate fallback pattern with natural variation
      console.log('🎵 Generating fallback beat pattern with natural variation');
      
      const beatInterval = 60 / bpm;
      let currentTime = 0.3; // Start first beat at 300ms

      while (currentTime < duration) {
        // Add timing variability for organic feel
        const timingJitter = (Math.random() - 0.5) * (timingVariability / 1000);
        const actualBeatTime = currentTime + timingJitter;
        
        // Add amplitude variation
        const amplitudeJitter = 1 + (Math.random() - 0.5) * amplitudeVariation;
        
        // Determine double pulse based on BPM (higher BPM = more likely double pulse)
        const doublePulseProbability = Math.min(0.8, (bpm - 110) / 50);
        const isDoublePulse = Math.random() < doublePulseProbability;
        const doublePulseOffset = 100 + Math.random() * 40; // 100-140ms

        beatPattern.push({
          time: actualBeatTime,
          amplitude: amplitudeJitter,
          isDoublePulse,
          doublePulseOffset
        });

        currentTime += beatInterval;
      }
    }

    return beatPattern;
  }

  /**
   * Generate authentic beats with advanced Doppler synthesis
   */
  private static generateAuthenticBeats(
    buffer: AudioBuffer,
    beatPattern: Array<{ time: number; amplitude: number; isDoublePulse: boolean; doublePulseOffset: number }>,
    sampleRate: number,
    hasDoublePulse: boolean,
    stereo: boolean
  ): void {
    console.log('🎵 Generating authentic beats with advanced Doppler synthesis...');

    for (const beat of beatPattern) {
      // Generate primary beat
      this.generateAuthenticBeat(buffer, beat.time, sampleRate, beat.amplitude, true, stereo);

      // Generate secondary beat for double pulse
      if (hasDoublePulse && beat.isDoublePulse) {
        const secondaryTime = beat.time + (beat.doublePulseOffset / 1000);
        this.generateAuthenticBeat(buffer, secondaryTime, sampleRate, beat.amplitude * 0.7, false, stereo);
      }
    }
  }

  /**
   * Generate a single authentic beat with advanced synthesis
   */
  private static generateAuthenticBeat(
    buffer: AudioBuffer,
    startTime: number,
    sampleRate: number,
    amplitude: number,
    isPrimary: boolean,
    stereo: boolean
  ): void {
    const startSample = Math.floor(startTime * sampleRate);
    
    if (startSample >= buffer.length) return;
    
    // Enhanced beat parameters
    const attackTime = isPrimary ? 0.015 : 0.008; // 15ms/8ms attack
    const sustainTime = isPrimary ? 0.025 : 0.0; // 25ms/0ms sustain
    const decayTime = isPrimary ? 0.120 : 0.080; // 120ms/80ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const sustainSamples = Math.floor(sustainTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + sustainSamples + decaySamples;
    
    const maxAmplitude = amplitude * (isPrimary ? 0.6 : 0.5);

    console.log(`🎵 Generating ${isPrimary ? 'primary' : 'secondary'} beat: start=${startSample}, attack=${attackSamples}, sustain=${sustainSamples}, decay=${decaySamples}, total=${totalSamples}`);

    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= buffer.length) break;

      const timeInBeat = i / sampleRate;
      
      // Calculate envelope with enhanced shaping
      const envelope = this.calculateEnhancedEnvelope(i, attackSamples, sustainSamples, sampleRate);
      
      // Generate authentic Doppler sound
      const dopplerSound = this.generateAuthenticDopplerSound(timeInBeat, isPrimary);
      const sample = dopplerSound * envelope * maxAmplitude;
      
      // Apply to all channels
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        if (stereo && channel === 1) {
          // Add slight stereo variation for realism
          const stereoVariation = 1 + (Math.random() - 0.5) * 0.1;
          channelData[sampleIndex] += sample * stereoVariation;
        } else {
          channelData[sampleIndex] += sample;
        }
      }
    }
  }

  /**
   * Calculate enhanced envelope with natural shaping
   */
  private static calculateEnhancedEnvelope(
    sampleIndex: number,
    attackSamples: number,
    sustainSamples: number,
    sampleRate: number
  ): number {
    if (sampleIndex < attackSamples) {
      // Enhanced attack: smooth rise with slight curve
      const attackProgress = sampleIndex / attackSamples;
      return Math.pow(attackProgress, 0.7);
    } else if (sampleIndex < attackSamples + sustainSamples) {
      // Sustain: hold with slight variation
      return 1.0 + (Math.random() - 0.5) * 0.05;
    } else {
      // Enhanced decay: smooth fall with natural curve
      const decayTimeInBeat = (sampleIndex - attackSamples - sustainSamples) / sampleRate;
      return Math.exp(-decayTimeInBeat * 4) * (1 + Math.sin(decayTimeInBeat * 50) * 0.1);
    }
  }

  /**
   * Generate authentic Doppler sound with advanced synthesis
   */
  private static generateAuthenticDopplerSound(time: number, isPrimary: boolean): number {
    let dopplerSound = 0;
    
    if (isPrimary) {
      // Primary beat: deeper, richer sound
      const fundamentalFreq = 120 + Math.random() * 60;
      dopplerSound += Math.sin(2 * Math.PI * fundamentalFreq * time) * 1.0;
      
      // Rich harmonics for rounded quality
      const harmonic1 = fundamentalFreq * 1.5;
      dopplerSound += Math.sin(2 * Math.PI * harmonic1 * time) * 0.6;
      
      const harmonic2 = fundamentalFreq * 2.2;
      dopplerSound += Math.sin(2 * Math.PI * harmonic2 * time) * 0.4;
      
      // Low-mid warmth (200-300 Hz)
      const warmthFreq = 200 + Math.random() * 100;
      dopplerSound += Math.sin(2 * Math.PI * warmthFreq * time) * 0.8;
      
      // Subtle high frequency for clarity
      const clarityFreq = 400 + Math.random() * 200;
      dopplerSound += Math.sin(2 * Math.PI * clarityFreq * time) * 0.3;
    } else {
      // Secondary beat: softer, higher frequency
      const fundamentalFreq = 250 + Math.random() * 100;
      dopplerSound += Math.sin(2 * Math.PI * fundamentalFreq * time) * 0.8;
      
      // Mid harmonics for body
      const harmonic1 = fundamentalFreq * 1.8;
      dopplerSound += Math.sin(2 * Math.PI * harmonic1 * time) * 0.5;
      
      // Higher frequency for "lub" character
      const lubFreq = 500 + Math.random() * 200;
      dopplerSound += Math.sin(2 * Math.PI * lubFreq * time) * 0.6;
      
      // High frequency hiss for Doppler character
      const hissFreq = 800 + Math.random() * 400;
      dopplerSound += Math.sin(2 * Math.PI * hissFreq * time) * 0.4;
    }
    
    // Add broadband noise for authentic texture
    dopplerSound += (Math.random() - 0.5) * 0.4;
    
    // Apply wall-filtering effect (high-pass filter simulation)
    const wallFiltered = dopplerSound * (1 - Math.exp(-time * 10));
    
    return wallFiltered * (isPrimary ? 0.7 : 0.6);
  }

  /**
   * Generate dynamic background with gating and modulation
   */
  private static generateDynamicBackground(buffer: AudioBuffer, sampleRate: number, duration: number, stereo: boolean): void {
    console.log('🎵 Generating dynamic background with gating and modulation...');
    
    for (let i = 0; i < buffer.length; i++) {
      const time = i / sampleRate;
      
      // Create fluid, wave-like background
      let background = 0;
      
      // Deep, warm foundation (80-120 Hz) - like amniotic fluid
      const fluidFreq = 80 + Math.sin(time * 0.05) * 40;
      background += Math.sin(2 * Math.PI * fluidFreq * time) * 0.015;
      
      // Body tissue resonance (150-250 Hz)
      const tissueFreq = 150 + Math.sin(time * 0.08) * 100;
      background += Math.sin(2 * Math.PI * tissueFreq * time) * 0.012;
      
      // Mid-frequency warmth (300-500 Hz)
      const warmthFreq = 300 + Math.sin(time * 0.12) * 200;
      background += Math.sin(2 * Math.PI * warmthFreq * time) * 0.008;
      
      // High-frequency muffled hiss (600-1000 Hz)
      const hissFreq = 600 + Math.sin(time * 0.15) * 400;
      background += Math.sin(2 * Math.PI * hissFreq * time) * 0.005;
      
      // Add very subtle broadband noise for fluid texture
      background += (Math.random() - 0.5) * 0.008;
      
      // Apply gentle modulation for wave-like quality
      const waveModulation = 1 + Math.sin(time * 0.3) * 0.3;
      background *= waveModulation;
      
      // Apply to all channels
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        if (stereo && channel === 1) {
          // Add slight stereo variation
          const stereoVariation = 1 + (Math.random() - 0.5) * 0.05;
          channelData[i] = background * stereoVariation;
        } else {
          channelData[i] = background;
        }
      }
    }
  }

  /**
   * Apply post-processing effects
   */
  private static applyPostProcessing(buffer: AudioBuffer, options: DopplerSynthesisOptions): void {
    console.log('🎵 Applying post-processing effects...');
    
    // Apply fade-in/out
    this.applyFadeInOut(buffer);
    
    // Apply spatial reverb if requested
    if (options.spatialReverb) {
      this.applySpatialReverb(buffer);
    }
    
    // Apply wall-filtering if requested
    if (options.wallFiltering) {
      this.applyWallFiltering(buffer);
    }
  }

  /**
   * Apply fade-in and fade-out
   */
  private static applyFadeInOut(buffer: AudioBuffer): void {
    const fadeDuration = 0.1; // 100ms fade
    const fadeSamples = Math.floor(fadeDuration * buffer.sampleRate);
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      // Fade in
      for (let i = 0; i < fadeSamples; i++) {
        const fadeIn = i / fadeSamples;
        channelData[i] *= fadeIn;
      }
      
      // Fade out
      for (let i = 0; i < fadeSamples; i++) {
        const fadeOut = i / fadeSamples;
        const index = buffer.length - fadeSamples + i;
        channelData[index] *= (1 - fadeOut);
      }
    }
  }

  /**
   * Apply spatial reverb effect
   */
  private static applySpatialReverb(buffer: AudioBuffer): void {
    console.log('🎵 Applying spatial reverb...');
    
    // Simple convolution reverb simulation
    const reverbLength = Math.floor(0.1 * buffer.sampleRate); // 100ms reverb
    const decay = 0.3;
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = reverbLength; i < buffer.length; i++) {
        const reverbSample = channelData[i - reverbLength] * decay;
        channelData[i] += reverbSample * 0.3; // 30% reverb mix
      }
    }
  }

  /**
   * Apply wall-filtering effect
   */
  private static applyWallFiltering(buffer: AudioBuffer): void {
    console.log('🎵 Applying wall-filtering...');
    
    // High-pass filter simulation to remove low-frequency artifacts
    const cutoffFreq = 80; // Hz
    const rc = 1 / (2 * Math.PI * cutoffFreq);
    const dt = 1 / buffer.sampleRate;
    const alpha = dt / (rc + dt);
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      let filtered = channelData[0];
      
      for (let i = 1; i < buffer.length; i++) {
        filtered = alpha * (filtered + channelData[i] - channelData[i - 1]);
        channelData[i] = filtered;
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
