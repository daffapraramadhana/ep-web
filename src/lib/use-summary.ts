'use client';

/**
 * useSummary — cache modul untuk GET /me/summary, pola sama dengan use-me
 * (satu fetch dibagi semua consumer: sidebar + rail + siapa pun berikutnya).
 * Gagal fetch → summary null, consumer memutuskan sendiri fallback-nya
 * (sidebar menyembunyikan blok target; rail menampilkan skeleton).
 * `refreshSummary()` untuk refetch manual (mis. setelah sesi selesai).
 */

import { useEffect, useState } from 'react';
import { api } from './api';
import type { SummaryView } from './api-types';

interface SummaryState {
  summary: SummaryView | null;
  loading: boolean;
}

type Listener = (state: SummaryState) => void;

let cache: SummaryState = { summary: null, loading: true };
let inFlight: Promise<void> | null = null;
const listeners = new Set<Listener>();

function setCache(next: SummaryState): void {
  cache = next;
  listeners.forEach((l) => l(cache));
}

function fetchSummary(): Promise<void> {
  if (inFlight) return inFlight;
  setCache({ summary: cache.summary, loading: true });
  inFlight = api<SummaryView>('/me/summary')
    .then((summary) => setCache({ summary, loading: false }))
    .catch(() => setCache({ summary: null, loading: false }))
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export function refreshSummary(): Promise<void> {
  cache = { summary: null, loading: true };
  return fetchSummary();
}

export function resetSummary(): void {
  cache = { summary: null, loading: true };
  inFlight = null;
}

export function useSummary(): SummaryState {
  const [state, setState] = useState<SummaryState>(cache);

  useEffect(() => {
    const listener: Listener = (s) => setState(s);
    listeners.add(listener);
    if (cache.summary === null && !inFlight) void fetchSummary();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return state;
}
