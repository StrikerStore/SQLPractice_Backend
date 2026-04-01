import { Request, Response } from 'express';
import { z } from 'zod';
import { ai } from '../ai';
import pino from 'pino';

const logger = pino();

const bodySchema = z.object({
  sql: z.string().min(1).max(50_000),
  questionId: z.string().max(64).optional(),
  questionTitle: z.string().max(500).optional(),
  // User-facing question text (not internal teacher notes)
  questionPrompt: z.string().max(20_000).optional(),
  // The canonical correct SQL (passed from backend after grading)
  canonicalSql: z.string().max(50_000).nullable().optional(),
  executionError: z.string().max(10_000).nullable().optional(),
  graded: z.boolean().optional(),
  isCorrect: z.boolean().nullable().optional(),
  verdict: z.string().max(64).optional(),
  rowCount: z.number().int().min(0).max(1_000_000).optional(),
  canonicalRowCount: z.number().int().min(0).max(1_000_000).nullable().optional(),
});

function buildUserPrompt(input: z.infer<typeof bodySchema>): string {
  const parts: string[] = [
    'The learner submitted the following SQL in a practice sandbox (read-only training DB):',
    '```sql',
    input.sql.trim(),
    '```',
  ];

  if (input.questionTitle) parts.push(`Task title: ${input.questionTitle}`);
  if (input.questionPrompt) parts.push(`Task description:\n${input.questionPrompt}`);

  if (input.executionError) {
    parts.push(`The query produced an execution error:\n${input.executionError}`);
    parts.push('Explain what caused this error and how to fix it.');
  } else if (input.graded === true) {
    if (input.isCorrect) {
      parts.push(
        `Automated check: ✅ Matches the expected result set (${input.rowCount ?? '?'} rows).`,
      );
      if (input.canonicalSql) {
        parts.push(
          `Reference solution for comparison:\n\`\`\`sql\n${input.canonicalSql.trim()}\n\`\`\``,
          "Note: the learner's query is correct. Praise what they did well, then suggest any optimisations vs the reference (e.g. better joins, index usage, simpler expressions).",
        );
      } else {
        parts.push('Praise what is good and suggest any optimisations.');
      }
    } else {
      const rowInfo =
        input.canonicalRowCount != null
          ? `Their query returned ${input.rowCount ?? '?'} rows; expected ${input.canonicalRowCount}.`
          : `Their query returned ${input.rowCount ?? '?'} rows but the result set did not match.`;
      parts.push(`Automated check: ❌ Does NOT match expected result set. ${rowInfo}`);
      if (input.canonicalSql) {
        parts.push(
          `Reference (correct) SQL:\n\`\`\`sql\n${input.canonicalSql.trim()}\n\`\`\``,
          "Explain what the learner's query got wrong compared to the reference, and guide them toward the correct approach without just giving the answer away.",
        );
      } else {
        parts.push(
          'Explain what the learner\'s query is likely to have gotten wrong and how to fix it.',
        );
      }
    }
  } else {
    parts.push(
      `Execution succeeded. Rows returned: ${input.rowCount ?? 'unknown'}.`,
      'No automated answer key for this question — focus on query quality, clarity, and correctness relative to the task description.',
    );
  }

  parts.push(
    'Format your feedback with:',
    '1. What the query does well (1–2 sentences).',
    '2. Issues or mistakes (bullet points if more than one).',
    '3. One concrete "next step" improvement with an example snippet if helpful.',
  );

  return parts.join('\n\n');
}

export const aiCoachHandler = async (req: Request, res: Response): Promise<void> => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body.', details: parsed.error.flatten() });
    return;
  }

  if (!process.env.OPENROUTER_API_KEY?.trim()) {
    res.status(503).json({
      error: 'AI coach is not configured. Set OPENROUTER_API_KEY on the server.',
    });
    return;
  }

  const input = parsed.data;
  const model = process.env.OPENROUTER_MODEL?.trim() || 'anthropic/claude-3.5-sonnet';

  try {
    const completion = await ai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert SQL mentor for beginners and intermediates. Be accurate, concise, and encouraging. Use structured responses with numbered steps and optional code blocks. Never reveal the full canonical answer directly if the learner answered incorrectly — guide them instead.',
        },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      max_tokens: 2000,
    });

    const analysis = completion.choices[0]?.message?.content?.trim() ?? '';
    if (!analysis) {
      res.status(502).json({ error: 'The model returned an empty response. Try again.' });
      return;
    }

    res.json({
      analysis,
      model: completion.model ?? model,
    });
  } catch (err: unknown) {
    logger.error({ err }, 'OpenRouter / AI coach request failed');
    const message = err instanceof Error ? err.message : 'AI request failed';
    res.status(502).json({ error: message });
  }
};
