// GPT Ultrasound Analyzer
// Uses GPT-4 Vision to analyze ultrasound images and provide detailed audio characteristics
// for generating authentic heartbeat sounds with waveform extraction integration

import { WaveformExtractor, ImageAnalysisResult } from './waveform-extractor';

export interface UltrasoundAnalysis {
  bpm: number;
  confidence: number;
  beat_times_sec: number[]; // ascending onsets within [0, 8)
  double_pulse_offset_ms: number | null; // e.g. 55 if two sub-bursts per beat; null if single
  amplitude_scalars: number[]; // 0..1, same length as beat_times_sec; default 0.8 if unknown
  analysis: string;
  waveform_extracted: boolean; // Whether waveform was successfully extracted
  waveform_confidence: number; // Confidence in waveform extraction (0-1)
}

export class GPTUltrasoundAnalyzer {
  private static readonly GPT_API_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly GPT_MODEL = 'gpt-4-vision-preview'; // Use GPT-4 Vision for better analysis

  /**
   * Analyze ultrasound image with GPT-4 Vision and waveform extraction
   */
  static async analyzeUltrasound(imageFile: File): Promise<UltrasoundAnalysis> {
    console.log('🔍 Starting comprehensive ultrasound analysis for file:', imageFile.name, 'Size:', imageFile.size);

    try {
      // First, attempt waveform extraction using computer vision
      console.log('🔍 Attempting waveform extraction...');
      let waveformResult: ImageAnalysisResult;
      
      try {
        waveformResult = await WaveformExtractor.extractWaveform(imageFile);
        console.log('🔍 Waveform extraction result:', waveformResult);
      } catch (waveformError) {
        console.warn('🔍 Waveform extraction failed, continuing with GPT analysis:', waveformError);
        waveformResult = this.getFallbackWaveformResult();
      }
      
      if (waveformResult.waveformData.hasWaveform && waveformResult.confidence > 0.5) {
        console.log('🔍 Waveform extraction successful, using extracted data');
        return this.createAnalysisFromWaveform(waveformResult);
      }

      // If waveform extraction fails or has low confidence, try GPT analysis
      console.log('🔍 Waveform extraction failed or low confidence, trying GPT analysis...');
      let gptResult: Partial<UltrasoundAnalysis>;
      
      try {
        gptResult = await this.analyzeWithGPT(imageFile);
        console.log('🔍 GPT analysis result:', gptResult);
      } catch (gptError) {
        console.warn('🔍 GPT analysis failed, using fallback:', gptError);
        gptResult = this.getFallbackGPTResult();
      }
      
      // Combine GPT results with waveform data if available
      return this.combineResults(gptResult, waveformResult);
      
    } catch (error) {
      console.error('🔍 Comprehensive analysis failed:', error);
      // Return fallback analysis
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Get fallback waveform result when extraction fails
   */
  private static getFallbackWaveformResult(): ImageAnalysisResult {
    return {
      waveformData: {
        beatTimes: [],
        amplitudes: [],
        doublePulseOffsets: [],
        confidence: 0.0,
        hasWaveform: false,
        extractedPoints: []
      },
      bpm: 140,
      confidence: 0.0,
      analysis: 'Waveform extraction failed - using fallback'
    };
  }

  /**
   * Get fallback GPT result when API fails
   */
  private static getFallbackGPTResult(): { bpm: number; confidence: number; analysis: string; beatTimesSec: number[]; doublePulseOffsetMs: number | null; amplitudeScalars: number[] } {
    // Generate uniform beat timing for fallback
    const bpm = 140;
    const beatInterval = 60 / bpm;
    const startTime = 0.12;
    const beatTimes: number[] = [];
    for (let time = startTime; time < 8.0; time += beatInterval) {
      beatTimes.push(Number(time.toFixed(3)));
    }

    return {
      bpm,
      confidence: 0.3,
      beatTimesSec: beatTimes,
      doublePulseOffsetMs: null,
      amplitudeScalars: beatTimes.map(() => 0.8),
      analysis: 'GPT analysis failed - using fallback'
    };
  }

  /**
   * Create analysis result from extracted waveform data
   */
  private static createAnalysisFromWaveform(waveformResult: ImageAnalysisResult): UltrasoundAnalysis {
    const { waveformData, bpm, confidence, analysis } = waveformResult;
    
    // Convert waveform data to the expected format
    const beatTimes = waveformData.beatTimes.map(time => Number(time.toFixed(3)));
    const amplitudeScalars = waveformData.amplitudes.map(amp => Math.max(0, Math.min(1, amp)));
    
    // Handle double pulse offsets
    let doublePulseOffset: number | null = null;
    if (waveformData.doublePulseOffsets.length > 0) {
      const validOffsets = waveformData.doublePulseOffsets.filter(offset => offset !== null);
      if (validOffsets.length > 0) {
        // Use the most common offset or average
        doublePulseOffset = validOffsets[0];
      }
    }

    return {
      bpm: Math.round(bpm),
      confidence: Math.max(0.6, confidence), // Boost confidence for extracted waveform
      beat_times_sec: beatTimes,
      double_pulse_offset_ms: doublePulseOffset,
      amplitude_scalars: amplitudeScalars,
      analysis: analysis,
      waveform_extracted: true,
      waveform_confidence: waveformData.confidence
    };
  }

  /**
   * Analyze image with GPT-4 Vision API
   */
  private static async analyzeWithGPT(imageFile: File): Promise<{ bpm: number; confidence: number; analysis: string; beatTimesSec: number[]; doublePulseOffsetMs: number | null; amplitudeScalars: number[] }> {
    const base64Image = await this.fileToBase64(imageFile);
    console.log('🔍 Image converted to base64, length:', base64Image.length);

    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please check your .env.local file.');
    }

    console.log('🔍 API key found, length:', apiKey.length);

    const prompt = `Analyze this fetal ultrasound image and return only the timing and amplitude data needed to recreate a realistic Doppler fetal heartbeat from the waveform.

CRITICAL INSTRUCTIONS:
1. **PRIORITY: Look for FHR (Fetal Heart Rate) numbers displayed on the image** - these are often the most accurate source (e.g., "FHR 155bpm")
2. **Examine Doppler waveforms** - look for regular peaks/spikes that represent heartbeats
3. **Count visible peaks** in the waveform over a time period to calculate BPM
4. **Look for time scales** on the waveform (usually in seconds)
5. **Identify measurement markers** or grid lines that indicate timing

WAVEFORM ANALYSIS:
- Look for regular, repeating peaks in Doppler traces
- Count peaks over visible time period (e.g., if you see 7 peaks in 3 seconds = ~140 BPM)
- Measure time between consecutive peaks
- Look for double-pulse patterns (two close peaks per heartbeat)

SPECIFIC DETECTION:
- If you see "FHR 155bpm" or similar, use that exact value
- If you see a Doppler waveform with regular peaks, count them over the visible time period
- Look for time markers on the waveform (e.g., -3.0 to 0 seconds)
- Calculate BPM from peak count and time period

Return JSON only with this schema:
{
  "bpm": number,                        // exact FHR if shown, otherwise calculated from waveform
  "confidence": number,                 // 0..1 for bpm confidence
  "beat_times_sec": number[],           // ascending onsets within [0, 8), e.g. [0.12, 0.50, 0.89, ...]
  "double_pulse_offset_ms": number|null,// e.g. 55 if two sub-bursts per beat; null if single
  "amplitude_scalars": number[]         // 0..1, same length as beat_times_sec; default 0.8 if unknown
}

Constraints:
- If FHR is clearly displayed (like "FHR 155bpm"), use that exact value
- Calculate beat_times_sec based on the detected BPM over 8 seconds
- amplitude_scalars should be gentle variations (0.7-0.9)
- Return only valid JSON, no other text`;

    console.log('🔍 Making API request to GPT-4 Vision...');

    const response = await fetch(this.GPT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: this.GPT_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      })
    });

    console.log('🔍 API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 API error response:', errorText);
      throw new Error(`GPT API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🔍 API response data:', data);

    const content = data.choices[0]?.message?.content;
    console.log('🔍 API response content:', content);

    if (!content) {
      throw new Error('No response from GPT API');
    }

    // Parse JSON response
    try {
      const result = JSON.parse(content);
      console.log('🔍 Parsed JSON result:', result);
      return this.validateGPTResult(result);
    } catch (parseError) {
      console.error('🔍 JSON parsing failed, extracting BPM from text:', parseError);
      return this.extractFromText(content);
    }
  }

  /**
   * Combine GPT results with waveform data
   */
  private static combineResults(gptResult: { bpm: number; confidence: number; analysis: string; beatTimesSec: number[]; doublePulseOffsetMs: number | null; amplitudeScalars: number[] }, waveformResult: ImageAnalysisResult): UltrasoundAnalysis {
    const { waveformData } = waveformResult;
    
    // Use GPT BPM if available and waveform BPM if not
    const bpm = gptResult.bpm || waveformResult.bpm;
    
    // Use waveform beat times if available, otherwise use GPT or generate uniform
    let beatTimes = waveformData.beatTimes.length > 0 ? 
      waveformData.beatTimes.map(time => Number(time.toFixed(3))) : 
      gptResult.beatTimesSec || [];
    
    if (beatTimes.length === 0) {
      // Generate uniform beat timing
      const beatInterval = 60 / bpm;
      const startTime = 0.12;
      beatTimes = [];
      for (let time = startTime; time < 8.0; time += beatInterval) {
        beatTimes.push(Number(time.toFixed(3)));
      }
    }
    
    // Use waveform amplitudes if available, otherwise use GPT or default
    let amplitudeScalars = waveformData.amplitudes.length > 0 ? 
      waveformData.amplitudes.map(amp => Math.max(0, Math.min(1, amp))) : 
      gptResult.amplitudeScalars || [];
    
    if (amplitudeScalars.length !== beatTimes.length) {
      amplitudeScalars = beatTimes.map(() => 0.8);
    }
    
    // Use GPT double pulse offset if available
    const doublePulseOffset = gptResult.doublePulseOffsetMs || null;
    
    // Calculate combined confidence
    const gptConfidence = gptResult.confidence || 0.5;
    const waveformConfidence = waveformData.confidence;
    const combinedConfidence = (gptConfidence + waveformConfidence) / 2;
    
    return {
      bpm: Math.round(bpm),
      confidence: combinedConfidence,
      beat_times_sec: beatTimes,
      double_pulse_offset_ms: doublePulseOffset,
      amplitude_scalars: amplitudeScalars,
      analysis: `Combined analysis: ${gptResult.analysis || 'GPT analysis'} + ${waveformResult.analysis}`,
      waveform_extracted: waveformData.hasWaveform,
      waveform_confidence: waveformData.confidence
    };
  }

  /**
   * Validate and enhance the GPT analysis with reasonable defaults
   */
  private static validateGPTResult(result: Record<string, unknown>): { bpm: number; confidence: number; analysis: string; beatTimesSec: number[]; doublePulseOffsetMs: number | null; amplitudeScalars: number[] } {
    const bpm = this.validateBPM((result.bpm as number) || 140);
    const confidence = Math.max(0, Math.min(1, (result.confidence as number) || 0.5));
    
    // Handle beat timing - create uniform timing if not provided
    let beatTimes = (result.beat_times_sec as number[]) || [];
    if (beatTimes.length === 0) {
      // Generate uniform beat timing based on BPM for 8 seconds
      const beatInterval = 60 / bpm;
      const startTime = 0.12; // Start near 0.12s as per spec
      beatTimes = [];
      for (let time = startTime; time < 8.0; time += beatInterval) {
        beatTimes.push(Number(time.toFixed(3)));
      }
    }
    
    // Validate beat times are within [0, 8) and ascending
    beatTimes = beatTimes.filter(time => time >= 0 && time < 8.0).sort((a, b) => a - b);
    
    // Handle amplitude scalars - default to 0.8 if not provided
    let amplitudeScalars = (result.amplitude_scalars as number[]) || [];
    if (amplitudeScalars.length !== beatTimes.length) {
      amplitudeScalars = beatTimes.map(() => 0.8); // Default amplitude
    }
    
    // Validate amplitude scalars are between 0 and 1
    amplitudeScalars = amplitudeScalars.map(amp => Math.max(0, Math.min(1, amp)));
    
    // Handle double pulse offset
    const doublePulseOffset = result.double_pulse_offset_ms as number | null;
    const validatedOffset = doublePulseOffset && doublePulseOffset >= 40 && doublePulseOffset <= 70 
      ? doublePulseOffset 
      : null;

    return {
      bpm,
      confidence,
      beatTimesSec: beatTimes,
      doublePulseOffsetMs: validatedOffset,
      amplitudeScalars: amplitudeScalars,
      analysis: (result.analysis as string) || 'GPT-4 Vision analysis completed'
    };
  }

  /**
   * Extract BPM and basic info from text if JSON parsing fails
   */
  private static extractFromText(content: string): { bpm: number; confidence: number; analysis: string; beatTimesSec: number[]; doublePulseOffsetMs: number | null; amplitudeScalars: number[] } {
    const bpmMatch = content.match(/(\d{3})\s*(?:BPM|bpm|beats?)/i);
    const bpm = this.validateBPM(bpmMatch ? parseInt(bpmMatch[1]) : 140);
    
    // Generate uniform beat timing
    const beatInterval = 60 / bpm;
    const startTime = 0.12;
    const beatTimes: number[] = [];
    for (let time = startTime; time < 8.0; time += beatInterval) {
      beatTimes.push(Number(time.toFixed(3)));
    }

    return {
      bpm,
      confidence: 0.6,
      beatTimesSec: beatTimes,
      doublePulseOffsetMs: null,
      amplitudeScalars: beatTimes.map(() => 0.8),
      analysis: content
    };
  }

  /**
   * Get fallback analysis when all methods fail
   */
  private static getFallbackAnalysis(): UltrasoundAnalysis {
    const bpm = 140;
    const beatInterval = 60 / bpm;
    const startTime = 0.12;
    const beatTimes: number[] = [];
    for (let time = startTime; time < 8.0; time += beatInterval) {
      beatTimes.push(Number(time.toFixed(3)));
    }

    return {
      bpm,
      confidence: 0.3,
      beat_times_sec: beatTimes,
      double_pulse_offset_ms: null,
      amplitude_scalars: beatTimes.map(() => 0.8),
      analysis: 'Fallback analysis: Using default fetal heart rate characteristics',
      waveform_extracted: false,
      waveform_confidence: 0.0
    };
  }

  /**
   * Validate BPM is within reasonable fetal range
   */
  private static validateBPM(bpm: number): number {
    return Math.max(100, Math.min(200, bpm));
  }

  /**
   * Convert file to base64 for API transmission
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
