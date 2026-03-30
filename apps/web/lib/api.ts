import { Difficulty, SubmissionResponse } from '@sqlcat/types';
import type { SchemaMetadata } from '@sqlcat/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

type ApiRequestOptions = {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
};

export type NextQuestionResponse = {
  question: {
    id: number;
    schemaId: number;
    prompt: string;
    difficulty: Difficulty;
    tags: string[];
    explanationStub?: string | null;
  };
  schema: SchemaMetadata;
  difficulty: Difficulty;
  remainingHintCount: number;
};

export async function fetchNextQuestion(sessionId: string, difficulty: Difficulty): Promise<NextQuestionResponse> {
  return request<NextQuestionResponse>('/session/next', {
    method: 'POST',
    body: JSON.stringify({ sessionId, difficulty }),
  });
}

export async function submitAnswer(payload: {
  sessionId: string;
  questionId: number;
  userSql: string;
}): Promise<SubmissionResponse> {
  return request<SubmissionResponse>('/session/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchGuidance(guidanceId: string) {
  return request(`/ai/guidance/${guidanceId}`, { method: 'GET' });
}

async function request<T>(path: string, options: ApiRequestOptions): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'API request failed');
  }
  return (await res.json()) as T;
}
