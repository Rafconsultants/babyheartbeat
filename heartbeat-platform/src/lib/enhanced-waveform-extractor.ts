/**
 * Enhanced Waveform Extractor with Computer Vision
 * Extracts heartbeat waveforms from ultrasound images using advanced CV techniques
 */

export interface WaveformPoint {
  x: number;
  y: number;
  amplitude: number;
  confidence: number;
}

export interface ExtractedWaveform {
  points: WaveformPoint[];
  peaks: number[];
  amplitudes: number[];
  timing: number[];
  doublePulseOffsets: (number | null)[];
  confidence: number;
  extracted: boolean;
  bpm: number;
  signalToNoiseRatio: number;
}

export class EnhancedWaveformExtractor {
  private static readonly MIN_PEAK_DISTANCE = 0.3; // Minimum 300ms between peaks
  private static readonly PEAK_THRESHOLD = 0.6; // Peak detection threshold
  private static readonly DOUBLE_PULSE_RANGE = { min: 80, max: 160 }; // ms

  /**
   * Extract waveform from ultrasound image using computer vision
   */
  static async extractWaveformFromImage(imageFile: File): Promise<ExtractedWaveform> {
    console.log('🔍 Starting enhanced waveform extraction...');

    try {
      // Create canvas and load image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      const image = new Image();
      const imageUrl = URL.createObjectURL(imageFile);
      
      return new Promise((resolve, reject) => {
        image.onload = () => {
          try {
            // Set canvas size
            canvas.width = image.width;
            canvas.height = image.height;
            
            // Draw image
            ctx.drawImage(image, 0, 0);
            
            // Extract waveform data
            const waveformData = this.extractWaveformData(ctx, canvas.width, canvas.height);
            
            // Analyze waveform for peaks and timing
            const analysis = this.analyzeWaveform(waveformData);
            
            // Clean up
            URL.revokeObjectURL(imageUrl);
            
            console.log('🔍 Waveform extraction completed:', analysis);
            resolve(analysis);
            
          } catch (error) {
            URL.revokeObjectURL(imageUrl);
            reject(error);
          }
        };
        
        image.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          reject(new Error('Failed to load image'));
        };
        
        image.src = imageUrl;
      });

    } catch (error) {
      console.error('❌ Enhanced waveform extraction failed:', error);
      throw error;
    }
  }

  /**
   * Extract waveform data from image using computer vision
   */
  private static extractWaveformData(ctx: CanvasRenderingContext2D, width: number, height: number): WaveformPoint[] {
    console.log('🔍 Extracting waveform data from image...');
    
    const points: WaveformPoint[] = [];
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Analyze each column for waveform traces
    for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 200))) { // Sample every few pixels
      let maxAmplitude = 0;
      let avgY = 0;
      let pointCount = 0;
      
      // Scan vertical line for waveform traces
      for (let y = 0; y < height; y++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Detect waveform traces (look for dark lines on light background)
        const brightness = (r + g + b) / 3;
        const contrast = Math.abs(brightness - 128) / 128;
        
        if (contrast > 0.3) { // Significant contrast indicates waveform
          const amplitude = 1 - (brightness / 255); // Invert brightness for amplitude
          if (amplitude > maxAmplitude) {
            maxAmplitude = amplitude;
          }
          avgY += y;
          pointCount++;
        }
      }
      
      if (pointCount > 0 && maxAmplitude > 0.1) {
        avgY /= pointCount;
        const normalizedX = x / width;
        const normalizedY = 1 - (avgY / height); // Invert Y for waveform
        
        points.push({
          x: normalizedX,
          y: normalizedY,
          amplitude: maxAmplitude,
          confidence: maxAmplitude
        });
      }
    }
    
    console.log(`🔍 Extracted ${points.length} waveform points`);
    return points;
  }

  /**
   * Analyze waveform data for peaks, timing, and patterns
   */
  private static analyzeWaveform(points: WaveformPoint[]): ExtractedWaveform {
    console.log('🔍 Analyzing waveform for peaks and patterns...');
    
    if (points.length < 10) {
      console.warn('🔍 Insufficient waveform points for analysis');
      return this.createFallbackWaveform();
    }
    
    // Detect peaks in waveform
    const peaks = this.detectPeaks(points);
    
    if (peaks.length < 3) {
      console.warn('🔍 Insufficient peaks detected for reliable analysis');
      return this.createFallbackWaveform();
    }
    
    // Calculate timing and amplitudes
    const timing = this.calculateTiming(peaks);
    const amplitudes = this.calculateAmplitudes(points, peaks);
    
    // Detect double-pulse patterns
    const doublePulseOffsets = this.detectDoublePulsePatterns(peaks, timing);
    
    // Calculate BPM
    const bpm = this.calculateBPM(timing);
    
    // Calculate signal-to-noise ratio
    const signalToNoiseRatio = this.calculateSignalToNoiseRatio(points, peaks);
    
    // Calculate overall confidence
    const confidence = this.calculateConfidence(peaks, signalToNoiseRatio, bpm);
    
    return {
      points,
      peaks,
      amplitudes,
      timing,
      doublePulseOffsets,
      confidence,
      extracted: true,
      bpm,
      signalToNoiseRatio
    };
  }

  /**
   * Detect peaks in waveform data
   */
  private static detectPeaks(points: WaveformPoint[]): number[] {
    console.log('🔍 Detecting peaks in waveform...');
    
    const peaks: number[] = [];
    const threshold = this.PEAK_THRESHOLD;
    
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const prev = points[i - 1];
      const next = points[i + 1];
      
      // Check if current point is a peak
      if (current.amplitude > threshold &&
          current.amplitude > prev.amplitude &&
          current.amplitude > next.amplitude) {
        
        // Check minimum distance from previous peak
        if (peaks.length === 0 || 
            (current.x - points[peaks[peaks.length - 1]].x) > this.MIN_PEAK_DISTANCE) {
          peaks.push(i);
        }
      }
    }
    
    console.log(`🔍 Detected ${peaks.length} peaks`);
    return peaks;
  }

  /**
   * Calculate timing between peaks
   */
  private static calculateTiming(peaks: number[]): number[] {
    const timing: number[] = [];
    
    for (let i = 1; i < peaks.length; i++) {
      const timeDiff = peaks[i] - peaks[i - 1];
      timing.push(timeDiff);
    }
    
    return timing;
  }

  /**
   * Calculate amplitudes at peak positions
   */
  private static calculateAmplitudes(points: WaveformPoint[], peaks: number[]): number[] {
    return peaks.map(peakIndex => points[peakIndex].amplitude);
  }

  /**
   * Detect double-pulse patterns
   */
  private static detectDoublePulsePatterns(peaks: number[], timing: number[]): (number | null)[] {
    console.log('🔍 Detecting double-pulse patterns...');
    
    const doublePulseOffsets: (number | null)[] = [];
    
    for (let i = 0; i < peaks.length; i++) {
      let hasDoublePulse = false;
      let doublePulseOffset = null;
      
      // Look for secondary peak within double-pulse range
      if (i < peaks.length - 1) {
        const timeToNext = timing[i];
        const timeInMs = timeToNext * 1000; // Convert to milliseconds
        
        if (timeInMs >= this.DOUBLE_PULSE_RANGE.min && 
            timeInMs <= this.DOUBLE_PULSE_RANGE.max) {
          hasDoublePulse = true;
          doublePulseOffset = timeInMs;
        }
      }
      
      doublePulseOffsets.push(hasDoublePulse ? doublePulseOffset : null);
    }
    
    const doublePulseCount = doublePulseOffsets.filter(offset => offset !== null).length;
    console.log(`🔍 Detected ${doublePulseCount} double-pulse patterns`);
    
    return doublePulseOffsets;
  }

  /**
   * Calculate BPM from timing data
   */
  private static calculateBPM(timing: number[]): number {
    if (timing.length === 0) {
      return 140; // Default BPM
    }
    
    // Calculate average time between beats
    const avgTimeBetweenBeats = timing.reduce((sum, time) => sum + time, 0) / timing.length;
    
    // Convert to BPM (assuming timing is in normalized units)
    const bpm = 60 / avgTimeBetweenBeats;
    
    // Clamp to physiologically plausible range
    return Math.max(110, Math.min(160, bpm));
  }

  /**
   * Calculate signal-to-noise ratio
   */
  private static calculateSignalToNoiseRatio(points: WaveformPoint[], peaks: number[]): number {
    if (peaks.length === 0) {
      return 0;
    }
    
    // Calculate signal (peak amplitudes)
    const signalAmplitudes = peaks.map(peakIndex => points[peakIndex].amplitude);
    const avgSignal = signalAmplitudes.reduce((sum, amp) => sum + amp, 0) / signalAmplitudes.length;
    
    // Calculate noise (non-peak amplitudes)
    const noiseAmplitudes = points
      .filter((_, index) => !peaks.includes(index))
      .map(point => point.amplitude);
    
    if (noiseAmplitudes.length === 0) {
      return avgSignal;
    }
    
    const avgNoise = noiseAmplitudes.reduce((sum, amp) => sum + amp, 0) / noiseAmplitudes.length;
    
    return avgNoise > 0 ? avgSignal / avgNoise : avgSignal;
  }

  /**
   * Calculate overall confidence score
   */
  private static calculateConfidence(peaks: number[], signalToNoiseRatio: number, bpm: number): number {
    let confidence = 0;
    
    // Peak count factor (more peaks = higher confidence)
    const peakFactor = Math.min(1.0, peaks.length / 10);
    confidence += peakFactor * 0.3;
    
    // Signal-to-noise ratio factor
    const snrFactor = Math.min(1.0, signalToNoiseRatio / 5);
    confidence += snrFactor * 0.4;
    
    // BPM plausibility factor
    const bpmFactor = bpm >= 110 && bpm <= 160 ? 1.0 : 0.5;
    confidence += bpmFactor * 0.3;
    
    return Math.min(1.0, confidence);
  }

  /**
   * Create fallback waveform when extraction fails
   */
  private static createFallbackWaveform(): ExtractedWaveform {
    console.log('🔍 Creating fallback waveform...');
    
    return {
      points: [],
      peaks: [],
      amplitudes: [],
      timing: [],
      doublePulseOffsets: [],
      confidence: 0,
      extracted: false,
      bpm: 140,
      signalToNoiseRatio: 0
    };
  }

  /**
   * Validate extracted waveform data
   */
  static validateWaveform(waveform: ExtractedWaveform): boolean {
    if (!waveform.extracted) {
      return false;
    }
    
    if (waveform.peaks.length < 3) {
      return false;
    }
    
    if (waveform.bpm < 110 || waveform.bpm > 160) {
      return false;
    }
    
    if (waveform.confidence < 0.3) {
      return false;
    }
    
    return true;
  }

  /**
   * Enhance waveform data with additional processing
   */
  static enhanceWaveform(waveform: ExtractedWaveform): ExtractedWaveform {
    if (!waveform.extracted) {
      return waveform;
    }
    
    // Smooth amplitudes
    const smoothedAmplitudes = this.smoothAmplitudes(waveform.amplitudes);
    
    // Normalize timing
    const normalizedTiming = this.normalizeTiming(waveform.timing);
    
    return {
      ...waveform,
      amplitudes: smoothedAmplitudes,
      timing: normalizedTiming
    };
  }

  /**
   * Smooth amplitude data
   */
  private static smoothAmplitudes(amplitudes: number[]): number[] {
    if (amplitudes.length < 3) {
      return amplitudes;
    }
    
    const smoothed: number[] = [];
    
    for (let i = 0; i < amplitudes.length; i++) {
      if (i === 0 || i === amplitudes.length - 1) {
        smoothed.push(amplitudes[i]);
      } else {
        // 3-point moving average
        const avg = (amplitudes[i - 1] + amplitudes[i] + amplitudes[i + 1]) / 3;
        smoothed.push(avg);
      }
    }
    
    return smoothed;
  }

  /**
   * Normalize timing data
   */
  private static normalizeTiming(timing: number[]): number[] {
    if (timing.length === 0) {
      return timing;
    }
    
    const avgTiming = timing.reduce((sum, time) => sum + time, 0) / timing.length;
    const normalized = timing.map(time => time / avgTiming);
    
    return normalized;
  }
}
