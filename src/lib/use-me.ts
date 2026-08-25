'use client';

/**
 * useMe — hook super-ringan untuk GET /me (Task 8).
 *
 * Bukan SWR: fetch sekali per sesi browser (cache di level modul, dibagi
 * oleh semua consumer) + `mutate()` manual untuk refetch setelah PATCH /me
 * atau aksi lain yang mengubah data user. Tanpa dependency `swr` (YAGNI —
 * kebutuhan kita hanya "satu fetch, banyak pemakai, bisa di-refresh manual").
 *
 * Tidak fetch sama sekali kalau tidak ada token di localStorage — gate
 * (root page.tsx, (user)/layout.tsx) yang menentukan kapan token itu ada;
 * hook ini hanya menghormatinya supaya tidak memicu request 401 yang sia-sia
 * sebelum redirect ke /login selesai.
 */

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import type { MeView } from './api-types';

interface MeState {
  me: MeView | null;
  loading: boolean;
  error: string | null;
}

type Listener = (state: MeState) => void;

let cache: MeState = { me: null, loading: true, error: null };
let inFlight: Promise<void> | null = null;
const listeners = new Set<Listener>();

function setCache(next: MeState): void {
  cache = next;
  listeners.forEach((listener) => listener(cache));
}

function hasToken(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage.getItem('token');
}

function fetchMe(): Promise<void> {
  if (inFlight) return inFlight;

  setCache({ me: cache.me, loading: true, error: null });
  inFlight = api<MeView>('/me')
    .then((me) => {
      setCache({ me, loading: false, error: null });
    })
    .catch((err) => {
      setCache({
        me: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/**
 * resetMe — clears the module-scope cache (C1 fix). Without this, logging
 * out and logging back in as a DIFFERENT user on the same tab kept showing
 * the previous user's `me` data until the next natural refetch, because the
 * cache lives at module scope (shared across every consumer) and neither
 * localStorage.removeItem() nor navigation ever touched it. Call this
 * anywhere localStorage's token/role/name gets cleared (profile logout, and
 * the token-invalid branches in page.tsx / (user)/layout.tsx) so the next
 * mount starts from a clean slate instead of stale cached `me`.
 */
export function resetMe(): void {
  inFlight = null;
  setCache({ me: null, loading: true, error: null });
}

export function useMe() {
  const [state, setState] = useState<MeState>(cache);

  useEffect(() => {
    listeners.add(setState);

    if (!hasToken()) {
      setCache({ me: null, loading: false, error: null });
    } else if (cache.me === null && cache.error === null && !inFlight) {
      fetchMe();
    }

    return () => {
      listeners.delete(setState);
    };
  }, []);

  const mutate = useCallback(() => fetchMe(), []);

  return { me: state.me, loading: state.loading, error: state.error, mutate };
}
