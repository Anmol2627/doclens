import Groq from 'groq-sdk';
import { jsonrepair } from 'jsonrepair';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  zh: 'Taiwanese (Traditional Chinese)',
};

/**
 * Translate a small JSON chunk into the target language using Groq LLM.
 */
async function translateChunk(
  chunk: any,
  langName: string
): Promise<any> {
  const input = JSON.stringify(chunk);
  
  const prompt = `Translate the string values in this JSON to ${langName}. Keep keys, numbers, dates, nulls, booleans unchanged. Return ONLY valid JSON, no markdown.

${input}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'openai/gpt-oss-20b',
    temperature: 0.1,
    max_tokens: 4096,
  });

  let jsonText = completion.choices[0]?.message?.content || '{}';
  // Strip any markdown code fences
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(jsonText);
  } catch {
    // Try to repair malformed JSON
    try {
      const repaired = jsonrepair(jsonText);
      return JSON.parse(repaired);
    } catch {
      console.error('Could not repair JSON chunk, returning original');
      return chunk;
    }
  }
}

/**
 * Translate medical report data into a target language using Groq LLM.
 * Splits the data into smaller chunks for more reliable translation.
 * Keys and structure are preserved; only human-readable string values are translated.
 */
export async function translateMedicalData(
  data: Record<string, any>,
  targetLang: string
): Promise<Record<string, any>> {
  if (!targetLang || targetLang === 'en') return data;

  const langName = SUPPORTED_LANGUAGES[targetLang] || targetLang;

  if (!process.env.GROQ_API_KEY) {
    console.warn('No GROQ_API_KEY – returning untranslated data');
    return data;
  }

  const result: Record<string, any> = {};

  // Translate each top-level key independently for reliability
  const keys = Object.keys(data);
  
  for (const key of keys) {
    try {
      const value = data[key];
      
      // Skip null/undefined/empty values
      if (value === null || value === undefined) {
        result[key] = value;
        continue;
      }

      // For arrays, translate in batches of 5 items
      if (Array.isArray(value)) {
        if (value.length === 0) {
          result[key] = value;
          continue;
        }
        
        const batchSize = 5;
        const translatedArray: any[] = [];
        
        for (let i = 0; i < value.length; i += batchSize) {
          const batch = value.slice(i, i + batchSize);
          try {
            const translatedBatch = await translateChunk(batch, langName);
            if (Array.isArray(translatedBatch)) {
              translatedArray.push(...translatedBatch);
            } else {
              // If the model returns a non-array, keep originals
              translatedArray.push(...batch);
            }
          } catch {
            translatedArray.push(...batch);
          }
        }
        
        result[key] = translatedArray;
      } else if (typeof value === 'object') {
        // Translate object chunks
        try {
          result[key] = await translateChunk(value, langName);
        } catch {
          result[key] = value;
        }
      } else if (typeof value === 'string') {
        // Translate standalone string
        try {
          const wrapper = { text: value };
          const translated = await translateChunk(wrapper, langName);
          result[key] = translated.text || value;
        } catch {
          result[key] = value;
        }
      } else {
        // Numbers, booleans etc – keep as-is
        result[key] = value;
      }
    } catch (e: any) {
      console.error(`Translation failed for key "${key}":`, e.message);
      result[key] = data[key];
    }
  }

  return result;
}
