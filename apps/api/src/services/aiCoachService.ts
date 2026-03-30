import OpenAI from 'openai';
import { randomUUID, createHash } from 'crypto';
import { AiCoachPayload, Verdict } from '@sqlcat/types';
import { env } from '../config/env';
import { TtlCache } from '../utils/cache';
import { logger } from '../config/logger';

const cache = new TtlCache<AiCoachPayload>(env.AI_GUIDANCE_CACHE_TTL);
const store = new Map<string, AiCoachPayload>();
const openai = env.OPENROUTER_API_KEY
  ? new OpenAI({ apiKey: env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1' })
  : null;

type GuidanceInput = {
  questionId: number;
  verdict: Verdict;
  prompt: string;
  schemaDescription: string;
  canonicalSql: string;
  userSql: string;
  diffSummary: Record<string, unknown>;
  optimalityNotes?: string | null;
};

export async function generateGuidance(input: GuidanceInput): Promise<AiCoachPayload | null> {
  if (!openai) {
    return null;
  }
  const cacheKey = createHash('sha1')
    .update([input.questionId, input.verdict, input.userSql.slice(0, 200)].join('|'))
    .digest('hex');
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const completion = await openai.chat.completions.create({
    model: env.OPENROUTER_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert SQL tutor. Explain mistakes succinctly, suggest an optimal query, and summarize why it is better. Respond as JSON: {"explanation": string, "optimalSql": string, "whyOptimal": string}.',
      },
      {
        role: 'user',
        content: buildPrompt(input),
      },
    ],
  });
  const content = completion.choices[0]?.message?.content ?? '';
  let parsed: { explanation: string; optimalSql: string; whyOptimal: string };
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    logger.warn({ content }, 'Failed to parse AI response as JSON; wrapping raw content.');
    parsed = {
      explanation: content,
      optimalSql: input.canonicalSql,
      whyOptimal: input.optimalityNotes ?? 'Matches the reference answer and uses efficient joins/filters.',
    };
  }
  const payload: AiCoachPayload = {
    id: randomUUID(),
    questionId: input.questionId,
    verdict: input.verdict,
    explanation: parsed.explanation,
    optimalSql: parsed.optimalSql || input.canonicalSql,
    whyOptimal: parsed.whyOptimal || input.optimalityNotes || 'Matches the official solution.',
  };
  cache.set(cacheKey, payload);
  store.set(payload.id, payload);
  return payload;
}

export function getGuidanceById(id: string) {
  return store.get(id) ?? null;
}

function buildPrompt(input: GuidanceInput) {
  return `Schema description: ${input.schemaDescription}\n\nQuestion: ${input.prompt}\n\nCanonical SQL:\n${input.canonicalSql}\n\nUser SQL:\n${input.userSql}\n\nVerdict: ${input.verdict}\nDiff summary: ${JSON.stringify(
    input.diffSummary,
    null,
    2,
  )}\n\nHints: ${input.optimalityNotes ?? 'N/A'}\n`;
}
