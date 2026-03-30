'use client';

import { useCallback, useEffect, useState } from 'react';
import { Difficulty, Verdict } from '@sqlcat/types';

const STORAGE_KEY = 'sqlcat-session';
const ladder: Difficulty[] = ['easy', 'medium', 'hard'];

export type ClientSessionState = {
  sessionId: string;
  currentDifficulty: Difficulty;
  totalAnswered: number;
  correctStreak: number;
  wrongStreak: number;
};

const fallbackState = (): ClientSessionState => ({
  sessionId: crypto.randomUUID(),
  currentDifficulty: 'easy',
  totalAnswered: 0,
  correctStreak: 0,
  wrongStreak: 0,
});

export function useSessionState() {
  const [state, setState] = useState<ClientSessionState>(() => fallbackState());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ClientSessionState;
        setState(parsed);
        return;
      } catch (err) {
        console.warn('Failed to parse stored session state', err);
      }
    }
    const fresh = fallbackState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    setState(fresh);
  }, []);

  const persist = useCallback((next: ClientSessionState) => {
    setState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, []);

  const recordVerdict = useCallback(
    (verdict: Verdict) => {
      let next = { ...state };
      next.totalAnswered += 1;
      if (verdict === 'correct') {
        next.correctStreak += 1;
        next.wrongStreak = 0;
        if (next.correctStreak >= 2 && next.currentDifficulty !== 'hard') {
          next.currentDifficulty = stepDifficulty(next.currentDifficulty, 1);
          next.correctStreak = 0;
        }
      } else {
        next.wrongStreak += 1;
        next.correctStreak = 0;
        if (next.currentDifficulty !== 'easy') {
          next.currentDifficulty = stepDifficulty(next.currentDifficulty, -1);
        }
      }
      persist(next);
    },
    [state, persist],
  );

  const resetSession = useCallback(() => {
    const fresh = fallbackState();
    persist(fresh);
  }, [persist]);

  return { state, recordVerdict, resetSession };
}

function stepDifficulty(current: Difficulty, delta: 1 | -1): Difficulty {
  const index = ladder.indexOf(current);
  const next = Math.min(ladder.length - 1, Math.max(0, index + delta));
  return ladder[next];
}
