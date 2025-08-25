// Reference Audio Analyzer for Fetal Doppler Ultrasound
// Analyzes real Doppler samples to extract acoustic characteristics for synthesis matching

export interface ReferenceAudioAnalysis {
  // Timing characteristics
  bpm: number;
  beatIntervals: number[]; // Time between beats in seconds
  timingVariability: {
    meanInterval: number;
    stdDeviation: number;
    jitterRange: number;
  };
  
  // Amplitude characteristics
  pulseToNoiseRatio: number;
  beatAmplitudes: number[];
  amplitudeVariability: {
    meanAmplitude: number;
    stdDeviation: number;
    dynamicRange: number;
  };
  
  // Spectral characteristics
  spectralProfile: {
    thumpBand: { low: number; high: number; emphasis: number }; // 150-300 Hz thump
    hissBand: { low: number; high: number; level: number }; // 800-1500 Hz hiss
    warmthBand: { low: number; high: number; level: number }; // 60-120 Hz warmth
    overallBalance: number; // Balance between bands
  };
  
  // Envelope characteristics
  beatEnvelope: {
    attackTime: number; // Time to peak in seconds
    sustainTime: number; // Time at peak in seconds
    decayTime: number; // Time to decay in seconds
    attackShape: 'linear' | 'exponential' | 's-curve';
    decayShape: 'linear' | 'exponential' | 's-curve';
  };
  
  // Background noise characteristics
  backgroundNoise: {
    modulationDepth: number; // How much background rises with beats
    gateThreshold: number; // Level at which background drops
    gateAttack: number; // Time for background to rise
    gateRelease: number; // Time for background to fall
    spectralContent: { low: number; mid: number; high: number };
  };
  
  // Double pulse characteristics
  doublePulse?: {
    frequency: number; // Percentage of beats with double pulse
    spacing: number; // Average spacing between pulses in ms
    relativeLoudness: number; // Secondary pulse amplitude relative to primary
    spacingVariability: number; // Variation in spacing
  };
  
  // Overall characteristics
  overallCharacteristics: {
    warmth: number; // 0-1 scale of low-frequency warmth
    clarity: number; // 0-1 scale of mid-frequency clarity
    air: number; // 0-1 scale of high-frequency air
    fluidity: number; // 0-1 scale of movement/fluidity
    organicness: number; // 0-1 scale of natural/organic sound
  };
  
  // Analysis metadata
  analysisMetadata: {
    sampleRate: number;
    duration: number;
    channels: number;
    analysisQuality: number; // 0-1 confidence in analysis
    beatCount: number;
    analysisMethod: string;
  };
}

export class ReferenceAudioAnalyzer {
  /**
   * Analyze reference audio to extract acoustic characteristics
   */
  static async analyzeReferenceAudio(audioBuffer: AudioBuffer, startTime: number = 2, endTime: number = 10): Promise<ReferenceAudioAnalysis> {
    console.log('🎵 Starting reference audio analysis:', { startTime, endTime });
    
    try {
      // Extract the analysis segment
      const analysisSegment = this.extractAnalysisSegment(audioBuffer, startTime, endTime);
      
      // Detect beats and timing
      const beatDetection = this.detectBeats(analysisSegment);
      
      // Analyze spectral characteristics
      const spectralAnalysis = this.analyzeSpectralProfile(analysisSegment, beatDetection);
      
      // Analyze envelope characteristics
      const envelopeAnalysis = this.analyzeBeatEnvelope(analysisSegment, beatDetection);
      
      // Analyze background noise
      const backgroundAnalysis = this.analyzeBackgroundNoise(analysisSegment, beatDetection);
      
      // Analyze double pulse patterns
      const doublePulseAnalysis = this.analyzeDoublePulsePatterns(analysisSegment, beatDetection);
      
      // Calculate overall characteristics
      const overallCharacteristics = this.calculateOverallCharacteristics(spectralAnalysis, envelopeAnalysis, backgroundAnalysis);
      
      // Calculate BPM from beat intervals
      const bpm = this.calculateBPM(beatDetection.intervals);
      
      // Calculate timing variability
      const timingVariability = this.calculateTimingVariability(beatDetection.intervals);
      
      // Calculate amplitude characteristics
      const amplitudeAnalysis = this.analyzeAmplitudes(analysisSegment, beatDetection);
      
      const analysis: ReferenceAudioAnalysis = {
        bpm,
        beatIntervals: beatDetection.intervals,
        timingVariability,
        pulseToNoiseRatio: amplitudeAnalysis.pulseToNoiseRatio,
        beatAmplitudes: amplitudeAnalysis.amplitudes,
        amplitudeVariability: amplitudeAnalysis.variability,
        spectralProfile: spectralAnalysis,
        beatEnvelope: envelopeAnalysis,
        backgroundNoise: backgroundAnalysis,
        doublePulse: doublePulseAnalysis,
        overallCharacteristics,
        analysisMetadata: {
          sampleRate: audioBuffer.sampleRate,
          duration: endTime - startTime,
          channels: audioBuffer.numberOfChannels,
          analysisQuality: this.calculateAnalysisQuality(beatDetection, spectralAnalysis),
          beatCount: beatDetection.beatTimes.length,
          analysisMethod: 'comprehensive_analysis'
        }
      };
      
      console.log('🎵 Reference audio analysis completed:', analysis);
      return analysis;
      
    } catch (error) {
      console.error('❌ Reference audio analysis failed:', error);
      throw new Error('Failed to analyze reference audio');
    }
  }
  
  /**
   * Extract analysis segment from audio buffer
   */
  private static extractAnalysisSegment(audioBuffer: AudioBuffer, startTime: number, endTime: number): AudioBuffer {
    const startSample = Math.floor(startTime * audioBuffer.sampleRate);
    const endSample = Math.floor(endTime * audioBuffer.sampleRate);
    const segmentLength = endSample - startSample;
    
    const segment = new AudioContext().createBuffer(
      audioBuffer.numberOfChannels,
      segmentLength,
      audioBuffer.sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const sourceData = audioBuffer.getChannelData(channel);
      const targetData = segment.getChannelData(channel);
      
      for (let i = 0; i < segmentLength; i++) {
        targetData[i] = sourceData[startSample + i];
      }
    }
    
    return segment;
  }
  
  /**
   * Detect beats in the audio segment
   */
  private static detectBeats(audioBuffer: AudioBuffer): { beatTimes: number[]; intervals: number[] } {
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const sampleRate = audioBuffer.sampleRate;
    const windowSize = Math.floor(0.1 * sampleRate); // 100ms window
    
    const beatTimes: number[] = [];
    const intervals: number[] = [];
    
    // Calculate RMS energy over sliding windows
    const energies: number[] = [];
    for (let i = 0; i < channelData.length - windowSize; i += windowSize / 2) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += channelData[i + j] * channelData[i + j];
      }
      energies.push(Math.sqrt(energy / windowSize));
    }
    
    // Find peaks in energy (beats)
    const threshold = Math.max(...energies) * 0.6;
    let lastPeakTime = -1;
    
    for (let i = 1; i < energies.length - 1; i++) {
      if (energies[i] > threshold && 
          energies[i] > energies[i - 1] && 
          energies[i] > energies[i + 1]) {
        
        const peakTime = (i * windowSize / 2) / sampleRate;
        
        // Ensure minimum interval between beats (0.3 seconds = 200 BPM max)
        if (lastPeakTime === -1 || peakTime - lastPeakTime > 0.3) {
          beatTimes.push(peakTime);
          
          if (lastPeakTime !== -1) {
            intervals.push(peakTime - lastPeakTime);
          }
          
          lastPeakTime = peakTime;
        }
      }
    }
    
    return { beatTimes, intervals };
  }
  
  /**
   * Analyze spectral profile of the audio
   */
  private static analyzeSpectralProfile(audioBuffer: AudioBuffer, beatDetection: any): any {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Calculate FFT for spectral analysis
    const fftSize = 2048;
    const fft = new FFT(fftSize);
    const spectrum = fft.forward(channelData.slice(0, fftSize));
    
    // Analyze frequency bands
    const thumpBand = this.analyzeFrequencyBand(spectrum, sampleRate, 150, 300);
    const hissBand = this.analyzeFrequencyBand(spectrum, sampleRate, 800, 1500);
    const warmthBand = this.analyzeFrequencyBand(spectrum, sampleRate, 60, 120);
    
    // Calculate overall balance
    const totalEnergy = thumpBand.energy + hissBand.energy + warmthBand.energy;
    const overallBalance = thumpBand.energy / totalEnergy; // Thump should dominate
    
    return {
      thumpBand: { low: 150, high: 300, emphasis: thumpBand.energy },
      hissBand: { low: 800, high: 1500, level: hissBand.energy },
      warmthBand: { low: 60, high: 120, level: warmthBand.energy },
      overallBalance
    };
  }
  
  /**
   * Analyze frequency band energy
   */
  private static analyzeFrequencyBand(spectrum: any, sampleRate: number, lowFreq: number, highFreq: number): { energy: number; peakFreq: number } {
    const lowBin = Math.floor(lowFreq * spectrum.length / sampleRate);
    const highBin = Math.floor(highFreq * spectrum.length / sampleRate);
    
    let energy = 0;
    let peakBin = lowBin;
    let peakMagnitude = 0;
    
    for (let i = lowBin; i <= highBin && i < spectrum.length; i++) {
      const magnitude = Math.abs(spectrum[i]);
      energy += magnitude * magnitude;
      
      if (magnitude > peakMagnitude) {
        peakMagnitude = magnitude;
        peakBin = i;
      }
    }
    
    const peakFreq = (peakBin * sampleRate) / spectrum.length;
    
    return { energy, peakFreq };
  }
  
  /**
   * Analyze beat envelope characteristics
   */
  private static analyzeBeatEnvelope(audioBuffer: AudioBuffer, beatDetection: any): any {
    if (beatDetection.beatTimes.length === 0) {
      return {
        attackTime: 0.01,
        sustainTime: 0.02,
        decayTime: 0.05,
        attackShape: 'exponential' as const,
        decayShape: 'exponential' as const
      };
    }
    
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Analyze the first few beats for envelope characteristics
    const analysisWindow = 0.2; // 200ms window around each beat
    let totalAttackTime = 0;
    let totalSustainTime = 0;
    let totalDecayTime = 0;
    let analyzedBeats = 0;
    
    for (let i = 0; i < Math.min(3, beatDetection.beatTimes.length); i++) {
      const beatTime = beatDetection.beatTimes[i];
      const startSample = Math.floor((beatTime - analysisWindow / 2) * sampleRate);
      const endSample = Math.floor((beatTime + analysisWindow / 2) * sampleRate);
      
      if (startSample >= 0 && endSample < channelData.length) {
        const envelope = this.extractEnvelope(channelData.slice(startSample, endSample));
        const envelopeAnalysis = this.analyzeEnvelopeShape(envelope, sampleRate);
        
        totalAttackTime += envelopeAnalysis.attackTime;
        totalSustainTime += envelopeAnalysis.sustainTime;
        totalDecayTime += envelopeAnalysis.decayTime;
        analyzedBeats++;
      }
    }
    
    return {
      attackTime: totalAttackTime / analyzedBeats,
      sustainTime: totalSustainTime / analyzedBeats,
      decayTime: totalDecayTime / analyzedBeats,
      attackShape: 'exponential' as const,
      decayShape: 'exponential' as const
    };
  }
  
  /**
   * Extract envelope from audio data
   */
  private static extractEnvelope(audioData: Float32Array): Float32Array {
    const envelope = new Float32Array(audioData.length);
    const attackTime = 0.001; // 1ms attack
    const releaseTime = 0.01; // 10ms release
    
    let attackCoeff = Math.exp(-1 / (attackTime * 44100));
    let releaseCoeff = Math.exp(-1 / (releaseTime * 44100));
    
    let envelopeValue = 0;
    
    for (let i = 0; i < audioData.length; i++) {
      const input = Math.abs(audioData[i]);
      
      if (input > envelopeValue) {
        envelopeValue = attackCoeff * (envelopeValue - input) + input;
      } else {
        envelopeValue = releaseCoeff * (envelopeValue - input) + input;
      }
      
      envelope[i] = envelopeValue;
    }
    
    return envelope;
  }
  
  /**
   * Analyze envelope shape
   */
  private static analyzeEnvelopeShape(envelope: Float32Array, sampleRate: number): { attackTime: number; sustainTime: number; decayTime: number } {
    const peakIndex = envelope.indexOf(Math.max(...envelope));
    const peakValue = envelope[peakIndex];
    const threshold = peakValue * 0.1;
    
    // Find attack time (time to reach 90% of peak)
    let attackIndex = peakIndex;
    while (attackIndex > 0 && envelope[attackIndex] > peakValue * 0.9) {
      attackIndex--;
    }
    const attackTime = (peakIndex - attackIndex) / sampleRate;
    
    // Find decay time (time to fall to 10% of peak)
    let decayIndex = peakIndex;
    while (decayIndex < envelope.length && envelope[decayIndex] > peakValue * 0.1) {
      decayIndex++;
    }
    const decayTime = (decayIndex - peakIndex) / sampleRate;
    
    // Sustain time is the time at peak level
    const sustainTime = 0.02; // Assume 20ms sustain
    
    return { attackTime, sustainTime, decayTime };
  }
  
  /**
   * Analyze background noise characteristics
   */
  private static analyzeBackgroundNoise(audioBuffer: AudioBuffer, beatDetection: any): any {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Calculate background levels between beats
    const backgroundLevels: number[] = [];
    
    for (let i = 0; i < beatDetection.beatTimes.length - 1; i++) {
      const startTime = beatDetection.beatTimes[i] + 0.1; // 100ms after beat
      const endTime = beatDetection.beatTimes[i + 1] - 0.05; // 50ms before next beat
      
      if (endTime > startTime) {
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.floor(endTime * sampleRate);
        
        let backgroundEnergy = 0;
        let sampleCount = 0;
        
        for (let j = startSample; j < endSample && j < channelData.length; j++) {
          backgroundEnergy += channelData[j] * channelData[j];
          sampleCount++;
        }
        
        if (sampleCount > 0) {
          backgroundLevels.push(Math.sqrt(backgroundEnergy / sampleCount));
        }
      }
    }
    
    const avgBackgroundLevel = backgroundLevels.length > 0 ? 
      backgroundLevels.reduce((a, b) => a + b, 0) / backgroundLevels.length : 0.1;
    
    return {
      modulationDepth: 0.6, // Background rises 60% with beats
      gateThreshold: avgBackgroundLevel * 0.8,
      gateAttack: 0.05, // 50ms attack
      gateRelease: 0.1, // 100ms release
      spectralContent: { low: 0.3, mid: 0.4, high: 0.3 }
    };
  }
  
  /**
   * Analyze double pulse patterns
   */
  private static analyzeDoublePulsePatterns(audioBuffer: AudioBuffer, beatDetection: any): any | undefined {
    if (beatDetection.beatTimes.length < 2) return undefined;
    
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    const doublePulseSpacings: number[] = [];
    const secondaryAmplitudes: number[] = [];
    
    // Analyze each beat for double pulse characteristics
    for (let i = 0; i < beatDetection.beatTimes.length; i++) {
      const beatTime = beatDetection.beatTimes[i];
      const analysisWindow = 0.15; // 150ms window
      
      const startSample = Math.floor((beatTime - analysisWindow / 2) * sampleRate);
      const endSample = Math.floor((beatTime + analysisWindow / 2) * sampleRate);
      
      if (startSample >= 0 && endSample < channelData.length) {
        const beatSegment = channelData.slice(startSample, endSample);
        const peaks = this.findPeaks(beatSegment);
        
        if (peaks.length >= 2) {
          // Calculate spacing between peaks
          const spacing = (peaks[1] - peaks[0]) / sampleRate * 1000; // Convert to ms
          if (spacing > 20 && spacing < 100) { // Valid double pulse spacing
            doublePulseSpacings.push(spacing);
            
            // Calculate relative amplitude of secondary peak
            const primaryAmplitude = Math.abs(beatSegment[peaks[0]]);
            const secondaryAmplitude = Math.abs(beatSegment[peaks[1]]);
            secondaryAmplitudes.push(secondaryAmplitude / primaryAmplitude);
          }
        }
      }
    }
    
    if (doublePulseSpacings.length === 0) return undefined;
    
    const frequency = doublePulseSpacings.length / beatDetection.beatTimes.length;
    const spacing = doublePulseSpacings.reduce((a, b) => a + b, 0) / doublePulseSpacings.length;
    const relativeLoudness = secondaryAmplitudes.reduce((a, b) => a + b, 0) / secondaryAmplitudes.length;
    const spacingVariability = this.calculateStandardDeviation(doublePulseSpacings);
    
    return {
      frequency,
      spacing,
      relativeLoudness,
      spacingVariability
    };
  }
  
  /**
   * Find peaks in audio data
   */
  private static findPeaks(audioData: Float32Array): number[] {
    const peaks: number[] = [];
    const threshold = Math.max(...audioData) * 0.5;
    
    for (let i = 1; i < audioData.length - 1; i++) {
      if (audioData[i] > threshold && 
          audioData[i] > audioData[i - 1] && 
          audioData[i] > audioData[i + 1]) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }
  
  /**
   * Calculate overall characteristics
   */
  private static calculateOverallCharacteristics(spectralAnalysis: any, envelopeAnalysis: any, backgroundAnalysis: any): any {
    // Calculate warmth based on low-frequency content
    const warmth = Math.min(1, spectralAnalysis.warmthBand.level * 2);
    
    // Calculate clarity based on mid-frequency balance
    const clarity = Math.min(1, spectralAnalysis.overallBalance * 1.5);
    
    // Calculate air based on high-frequency content
    const air = Math.min(1, spectralAnalysis.hissBand.level * 1.2);
    
    // Calculate fluidity based on background modulation
    const fluidity = Math.min(1, backgroundAnalysis.modulationDepth * 1.3);
    
    // Calculate organicness based on envelope characteristics
    const organicness = Math.min(1, (envelopeAnalysis.attackTime + envelopeAnalysis.decayTime) * 10);
    
    return { warmth, clarity, air, fluidity, organicness };
  }
  
  /**
   * Calculate BPM from beat intervals
   */
  private static calculateBPM(intervals: number[]): number {
    if (intervals.length === 0) return 140; // Default BPM
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return Math.round(60 / avgInterval);
  }
  
  /**
   * Calculate timing variability
   */
  private static calculateTimingVariability(intervals: number[]): { meanInterval: number; stdDeviation: number; jitterRange: number } {
    if (intervals.length === 0) {
      return { meanInterval: 0.428, stdDeviation: 0.02, jitterRange: 0.04 };
    }
    
    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const stdDeviation = this.calculateStandardDeviation(intervals);
    const jitterRange = Math.max(...intervals) - Math.min(...intervals);
    
    return { meanInterval, stdDeviation, jitterRange };
  }
  
  /**
   * Analyze amplitude characteristics
   */
  private static analyzeAmplitudes(audioBuffer: AudioBuffer, beatDetection: any): { pulseToNoiseRatio: number; amplitudes: number[]; variability: any } {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    const amplitudes: number[] = [];
    
    // Calculate amplitude at each beat
    for (const beatTime of beatDetection.beatTimes) {
      const sampleIndex = Math.floor(beatTime * sampleRate);
      if (sampleIndex < channelData.length) {
        amplitudes.push(Math.abs(channelData[sampleIndex]));
      }
    }
    
    // Calculate pulse-to-noise ratio
    const avgPulseAmplitude = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
    const backgroundAmplitude = this.calculateBackgroundAmplitude(channelData, beatDetection.beatTimes);
    const pulseToNoiseRatio = avgPulseAmplitude / backgroundAmplitude;
    
    // Calculate amplitude variability
    const meanAmplitude = avgPulseAmplitude;
    const stdDeviation = this.calculateStandardDeviation(amplitudes);
    const dynamicRange = Math.max(...amplitudes) - Math.min(...amplitudes);
    
    return {
      pulseToNoiseRatio,
      amplitudes,
      variability: { meanAmplitude, stdDeviation, dynamicRange }
    };
  }
  
  /**
   * Calculate background amplitude
   */
  private static calculateBackgroundAmplitude(channelData: Float32Array, beatTimes: number[]): number {
    const sampleRate = 44100; // Assume standard sample rate
    let totalBackgroundEnergy = 0;
    let totalSamples = 0;
    
    // Calculate background energy between beats
    for (let i = 0; i < beatTimes.length - 1; i++) {
      const startTime = beatTimes[i] + 0.1; // 100ms after beat
      const endTime = beatTimes[i + 1] - 0.05; // 50ms before next beat
      
      if (endTime > startTime) {
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.floor(endTime * sampleRate);
        
        for (let j = startSample; j < endSample && j < channelData.length; j++) {
          totalBackgroundEnergy += channelData[j] * channelData[j];
          totalSamples++;
        }
      }
    }
    
    return totalSamples > 0 ? Math.sqrt(totalBackgroundEnergy / totalSamples) : 0.1;
  }
  
  /**
   * Calculate standard deviation
   */
  private static calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => (v - mean) * (v - mean));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    
    return Math.sqrt(avgSquaredDiff);
  }
  
  /**
   * Calculate analysis quality
   */
  private static calculateAnalysisQuality(beatDetection: any, spectralAnalysis: any): number {
    let quality = 1.0;
    
    // Reduce quality if few beats detected
    if (beatDetection.beatTimes.length < 3) {
      quality *= 0.7;
    }
    
    // Reduce quality if spectral analysis is weak
    if (spectralAnalysis.overallBalance < 0.3) {
      quality *= 0.8;
    }
    
    return Math.max(0.1, quality);
  }
}

// Simple FFT implementation for spectral analysis
class FFT {
  private size: number;
  
  constructor(size: number) {
    this.size = size;
  }
  
  forward(buffer: Float32Array): Float32Array {
    // Simple FFT implementation - in production, use a proper FFT library
    const output = new Float32Array(this.size);
    
    for (let k = 0; k < this.size; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < this.size; n++) {
        const angle = -2 * Math.PI * k * n / this.size;
        const sample = n < buffer.length ? buffer[n] : 0;
        real += sample * Math.cos(angle);
        imag += sample * Math.sin(angle);
      }
      
      output[k] = Math.sqrt(real * real + imag * imag);
    }
    
    return output;
  }
}
