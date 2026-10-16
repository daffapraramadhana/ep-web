export async function api<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...opts,
    headers: {
      ...(opts.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(Array.isArray(body.message) ? body.message[0] : body.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

/** URL dari API: path relatif (/media/…, /tts/…) diberi prefix NEXT_PUBLIC_API_URL; absolut (S3/MinIO) apa adanya. */
export function resolveApiUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${process.env.NEXT_PUBLIC_API_URL ?? ''}${url}`;
}
