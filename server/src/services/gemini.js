import { ApiError } from '../utils/ApiError.js';

// Thin wrapper around the Gemini API's generateContent endpoint. Configurable
// via env so the model can be bumped without a code change as Google ships
// newer Gemini releases.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function requireApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new ApiError(503, 'AI features are not configured — set GEMINI_API_KEY in the server .env file.');
  }
  return key;
}

/**
 * @param {Object} params
 * @param {Array<{role: 'user'|'model', parts: Array<{text: string}>}>} params.contents
 * @param {string} [params.systemInstruction]
 * @param {Object} [params.jsonSchema] - if provided, asks Gemini to return JSON matching this schema
 * @param {number} [params.temperature]
 */
export async function generateContent({ contents, systemInstruction, jsonSchema, temperature = 0.7 }) {
  const apiKey = requireApiKey();

  const body = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: 2048,
      ...(jsonSchema ? { responseMimeType: 'application/json', responseSchema: jsonSchema } : {}),
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  let response;
  try {
    response = await fetch(`${GEMINI_BASE}/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new ApiError(502, 'Could not reach the Gemini API.');
  }

  if (response.status === 429) {
    throw new ApiError(429, 'Gemini API rate limit hit — try again in a moment.');
  }
  if (response.status === 401 || response.status === 403) {
    throw new ApiError(502, 'Gemini API rejected the configured API key.');
  }
  if (!response.ok) {
    const errBody = await response.json().catch(() => null);
    throw new ApiError(502, errBody?.error?.message || 'Gemini API returned an error.');
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];

  if (!candidate) {
    throw new ApiError(502, 'Gemini API returned no response.');
  }
  if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
    throw new ApiError(422, 'Gemini declined to respond to that request.');
  }

  const text = candidate.content?.parts?.map((p) => p.text || '').join('') ?? '';
  return { text, raw: data };
}

// Gemini's JSON mode is generally reliable, but this guards against the
// occasional response still wrapped in a ```json code fence.
export function parseJsonResponse(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (err2) {
      throw new ApiError(502, 'Gemini returned a response that could not be parsed.');
    }
  }
}
