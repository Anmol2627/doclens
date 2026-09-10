import Groq from 'groq-sdk';

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
 * Translate medical report data into a target language using Groq LLM.
 * Accepts an object with string/array fields and returns a translated copy.
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

  const prompt = `You are a professional medical translator. Translate ALL the human-readable string values in the following JSON into ${langName}.

Rules:
- Keep all JSON keys exactly as they are (do not translate keys).
- Translate the values of string fields only.
- Preserve numbers, dates (YYYY-MM-DD), null values, and booleans exactly as they are.
- Preserve medical accuracy – use the standard medical terminology in ${langName}.
- Return ONLY the translated JSON object, with no extra text or markdown formatting.

JSON to translate:
${JSON.stringify(data, null, 2)}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.2,
    });

    let jsonText = completion.choices[0]?.message?.content || '{}';
    // Strip any markdown code fences
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const translated = JSON.parse(jsonText);
    return translated;
  } catch (e: any) {
    console.error('Translation failed:', e.message);
    return data; // Fallback to untranslated
  }
}
