// GPT Ultrasound Analyzer
// Uses GPT-4 Vision to analyze ultrasound images and provide detailed audio characteristics
// for generating authentic heartbeat sounds

export interface UltrasoundAnalysis {
  bpm: number;
  confidence: number;
  audioCharacteristics: {
    systolicIntensity: number; // 0-1, how strong the first "whoosh" is
    diastolicIntensity: number; // 0-1, how strong the second "whoosh" is
    frequencyRange: {
      systolic: { min: number; max: number }; // Hz
      diastolic: { min: number; max: number }; // Hz
    };
    rhythm: 'regular' | 'irregular' | 'variable';
    clarity: 'clear' | 'moderate' | 'faint';
    backgroundNoise: 'low' | 'medium' | 'high';
    dopplerEffect: 'strong' | 'moderate' | 'weak';
  };
  analysis: string;
  recommendations: string[];
}

export class GPTUltrasoundAnalyzer {
  private static readonly GPT_API_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly GPT_MODEL = 'gpt-4-vision-preview';

  /**
   * Analyze ultrasound image with GPT-4 Vision and get detailed audio characteristics
   */
  static async analyzeUltrasound(imageFile: File): Promise<UltrasoundAnalysis> {
    try {
      const base64Image = await this.fileToBase64(imageFile);
      // In browser environment, we need to use NEXT_PUBLIC_ prefix
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please check your .env.local file.');
      }

      const prompt = `Analyze this fetal ultrasound image with extreme detail for heartbeat audio recreation.

Focus on these specific aspects:

1. **BPM Detection**: Look for any visible BPM numbers, heart rate displays, or waveform patterns that indicate beats per minute.

2. **Audio Characteristics Analysis**:
   - Systolic intensity (first "whoosh" sound strength): 0-1 scale
   - Diastolic intensity (second "whoosh" sound strength): 0-1 scale
   - Frequency ranges for both systolic and diastolic phases
   - Rhythm pattern (regular/irregular/variable)
   - Sound clarity (clear/moderate/faint)
   - Background noise level (low/medium/high)
   - Doppler effect strength (strong/moderate/weak)

3. **Visual Cues**:
   - Look for waveform patterns, heart chambers, blood flow indicators
   - Identify any text or numbers showing heart rate
   - Analyze image quality and clarity
   - Check for any artifacts or noise patterns

Respond in this exact JSON format:
{
  "bpm": number,
  "confidence": number (0-1),
  "audioCharacteristics": {
    "systolicIntensity": number (0-1),
    "diastolicIntensity": number (0-1),
    "frequencyRange": {
      "systolic": {"min": number, "max": number},
      "diastolic": {"min": number, "max": number}
    },
    "rhythm": "regular" | "irregular" | "variable",
    "clarity": "clear" | "moderate" | "faint",
    "backgroundNoise": "low" | "medium" | "high",
    "dopplerEffect": "strong" | "moderate" | "weak"
  },
  "analysis": "detailed description of what you see",
  "recommendations": ["array", "of", "audio", "generation", "tips"]
}

If you cannot determine specific values, provide reasonable estimates based on typical fetal heart characteristics.`;

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
          max_tokens: 1000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`GPT API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from GPT API');
      }

      // Parse JSON response
      try {
        const result = JSON.parse(content);
        return this.validateAndEnhanceAnalysis(result);
      } catch (parseError) {
        console.error('JSON parsing failed, extracting BPM from text:', parseError);
        return this.extractFromText(content);
      }
    } catch (error) {
      console.error('GPT Ultrasound analysis failed:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Validate and enhance the GPT analysis with reasonable defaults
   */
  private static validateAndEnhanceAnalysis(result: Record<string, unknown>): UltrasoundAnalysis {
    const audioChars = result.audioCharacteristics as Record<string, unknown> || {};
    const freqRange = audioChars.frequencyRange as Record<string, unknown> || {};
    const systolic = freqRange.systolic as Record<string, unknown> || {};
    const diastolic = freqRange.diastolic as Record<string, unknown> || {};

    return {
      bpm: this.validateBPM((result.bpm as number) || 140),
      confidence: Math.max(0, Math.min(1, (result.confidence as number) || 0.5)),
      audioCharacteristics: {
        systolicIntensity: Math.max(0, Math.min(1, (audioChars.systolicIntensity as number) || 0.8)),
        diastolicIntensity: Math.max(0, Math.min(1, (audioChars.diastolicIntensity as number) || 0.6)),
        frequencyRange: {
          systolic: {
            min: Math.max(800, Math.min(1200, (systolic.min as number) || 900)),
            max: Math.max(1000, Math.min(1400, (systolic.max as number) || 1100))
          },
          diastolic: {
            min: Math.max(600, Math.min(900, (diastolic.min as number) || 650)),
            max: Math.max(700, Math.min(1000, (diastolic.max as number) || 800))
          }
        },
        rhythm: (audioChars.rhythm as 'regular' | 'irregular' | 'variable') || 'regular',
        clarity: (audioChars.clarity as 'clear' | 'moderate' | 'faint') || 'moderate',
        backgroundNoise: (audioChars.backgroundNoise as 'low' | 'medium' | 'high') || 'medium',
        dopplerEffect: (audioChars.dopplerEffect as 'strong' | 'moderate' | 'weak') || 'moderate'
      },
      analysis: (result.analysis as string) || 'GPT analysis completed',
      recommendations: Array.isArray(result.recommendations) ? (result.recommendations as string[]) : ['Use moderate intensity for authentic sound']
    };
  }

  /**
   * Extract BPM and basic info from text if JSON parsing fails
   */
  private static extractFromText(content: string): UltrasoundAnalysis {
    const bpmMatch = content.match(/(\d{3})\s*(?:BPM|bpm|beats?)/i);
    const bpm = bpmMatch ? parseInt(bpmMatch[1]) : 140;

    return {
      bpm: this.validateBPM(bpm),
      confidence: 0.6,
      audioCharacteristics: {
        systolicIntensity: 0.8,
        diastolicIntensity: 0.6,
        frequencyRange: {
          systolic: { min: 900, max: 1100 },
          diastolic: { min: 650, max: 800 }
        },
        rhythm: 'regular',
        clarity: 'moderate',
        backgroundNoise: 'medium',
        dopplerEffect: 'moderate'
      },
      analysis: content,
      recommendations: ['Use extracted BPM for audio generation']
    };
  }

  /**
   * Get default analysis when GPT fails
   */
  private static getDefaultAnalysis(): UltrasoundAnalysis {
    return {
      bpm: 140,
      confidence: 0.3,
      audioCharacteristics: {
        systolicIntensity: 0.8,
        diastolicIntensity: 0.6,
        frequencyRange: {
          systolic: { min: 900, max: 1100 },
          diastolic: { min: 650, max: 800 }
        },
        rhythm: 'regular',
        clarity: 'moderate',
        backgroundNoise: 'medium',
        dopplerEffect: 'moderate'
      },
      analysis: 'Default analysis due to GPT failure',
      recommendations: ['Use standard fetal heartbeat characteristics']
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
