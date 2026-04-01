import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY?.trim();

export const ai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: apiKey ?? 'missing-key',
  defaultHeaders: {
    'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER ?? 'http://localhost:3000',
    'X-Title': 'SQL CAT-Style Trainer',
  },
});
