'use client';

/**
 * Ngobrol dengan AI — talking agent (ElevenLabs Conversational AI).
 *
 * BE tidak pernah di jalur panggilan: POST /voice-conversation/start hanya
 * mint signed URL + mencatat row PENDING; browser connect WebSocket LANGSUNG
 * ke ElevenLabs lewat @elevenlabs/client. Selesai ngobrol → poll
 * GET /voice-conversation/:id sampai GRADED. Grading di BE via dua jalur:
 * (a) webhook post-call ElevenLabs; (b) fallback reconcile — browser daftarkan
 * conversationId (onConnect → POST :id/register), poll-status tarik detail
 * dari ElevenLabs API & grade sendiri bila webhook tak sampai. Keputusan
 * desain §4 dokumen plan — jangan dirubah jadi "server relays audio" tanpa
 * pertimbangan biaya/keterlambatan.
 *
 * Layar live memakai tiga aliran dari SDK (terverifikasi di node_modules —
 * dist/BaseConversation.js, jangan diubah tanpa cek ulang):
 * - onModeChange({mode}) — 'speaking' | 'listening' → visual dua arah.
 * - onMessage({role, message}) — teks FINAL lengkap kedua sisi (agent lewat
 *   event agent_response, user lewat user_transcript) → sumber transkrip.
 *   Karena final, tidak dobel dengan aliran streaming di bawah.
 * - onAgentChatResponsePart({text, type:'start'|'delta'|'stop'}) — teks yang
 *   sedang dibacakan agent, buat baris "sedang diucapkan". Dikosongkan tiap
 *   kali onMessage commit (agent tuntas / user mulai bicara), jadi baris ini
 *   murni kosmetik, bukan sumber transkrip.
 *
 * @elevenlabs/client di-import dinamis (bukan top-level) supaya bundle tak
 * dimuat saat SSR — paket itu menempel API WebSocket/AudioContext browser.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, PhoneOff, MessagesSquare } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  VoiceConversationStartView,
  VoiceConversationStatusView,
} from '@/lib/api-types';
import { Card, ChunkyButton } from '@/components/ui';

type Phase = 'idle' | 'starting' | 'live' | 'evaluating' | 'done';
type LiveMode = 'listening' | 'speaking';
type ChatMessage = { id: number; role: 'user' | 'agent'; text: string };

// Polling status pasca-call: tiap 2 dtk, paling lama 60 dtk (30 × 2).
const POLL_INTERVAL_MS = 2_000;
const POLL_MAX_TRIES = 30;

function fmtElapsed(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TalkPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<VoiceConversationStatusView | null>(null);
  const [gradingTimeout, setGradingTimeout] = useState(false);
  const [micOn, setMicOn] = useState(true);
  // ref live: handler callback (onDisconnect) butuh instance tanpa re-run effect
  const recordIdRef = useRef<string | null>(null);
  // Struktur minimal instance @elevenlabs/client yang kita pakai (tipe penuh
  // hanya terlihat via dynamic import runtime).
  const convRef = useRef<{
    endSession(): Promise<void>;
    setMicMuted(isMuted: boolean): void;
  } | null>(null);
  const pollingRef = useRef(false);

  // ---- state layar live -------------------------------------------------
  const [mode, setMode] = useState<LiveMode>('listening');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [liveAgent, setLiveAgent] = useState('');
  const msgIdRef = useRef(0);
  const feedRef = useRef<HTMLOListElement | null>(null);
  // Autoscroll feed hanya bila user sedang di dasar (tidak menyambar baca
  // riwayat saat pesan baru masuk).
  const stickRef = useRef(true);

  // Bila user meninggalkan halaman saat call berjalan, tutup koneksi agar
  // tidak ada WebSocket yatim (biaya menit tetap berjalan di sisi ElevenLabs).
  useEffect(() => {
    return () => {
      convRef.current?.endSession().catch(() => {});
    };
  }, []);

  // Timer durasi panggilan — berjalan hanya selama phase live.
  useEffect(() => {
    if (phase !== 'live') return;
    const t = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Ikut scroll ke bawah hanya saat user di dasar feed.
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    if (stickRef.current) feed.scrollTop = feed.scrollHeight;
  }, [messages]);

  function onFeedScroll() {
    const feed = feedRef.current;
    if (!feed) return;
    stickRef.current = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 48;
  }

  function appendMessage(role: 'user' | 'agent', text: string) {
    msgIdRef.current += 1;
    const id = msgIdRef.current;
    setMessages((m) => [...m, { id, role, text }]);
  }

  async function start() {
    setError('');
    setPhase('starting');
    // Mulai percakapan baru: bersihkan sisa tampilan live dari sesi lalu.
    setElapsedSec(0);
    setMessages([]);
    setLiveAgent('');
    setMode('listening');
    stickRef.current = true;
    try {
      const s = await api<VoiceConversationStartView>('/voice-conversation/start', {
        method: 'POST',
      });
      recordIdRef.current = s.conversationRecordId;
      const { Conversation } = await import('@elevenlabs/client');
      const conv = await Conversation.startSession({
        signedUrl: s.signedUrl,
        dynamicVariables: s.dynamicVariables,
        onConnect: ({ conversationId }) => {
          setPhase('live');
          // Fallback reconcile: daftarkan id percakapan ElevenLabs ke BE
          // supaya status-poll bisa menggradasi sendiri bila webhook tak
          // sampai. Best-effort — gagal daftar tidak menggagalkan panggilan.
          void api(`/voice-conversation/${s.conversationRecordId}/register`, {
            method: 'POST',
            body: JSON.stringify({ conversationId }),
          }).catch(() => {});
        },
        onDisconnect: () => {
          // Selesai (dari sisi mana pun: tombol AKHIRI atau agent menutup
          // sendiri) → mulai penilaian polling.
          beginEvaluation();
        },
        onError: (message) => {
          setPhase('idle');
          setError(`Koneksi ke tutor AI terputus: ${message}`);
        },
        // Layar live — lihat doc comment di atas untuk sumber tiap aliran.
        onModeChange: ({ mode: nextMode }) => setMode(nextMode),
        onMessage: ({ role, message }) => {
          const text = (message ?? '').trim();
          if (!text) return;
          appendMessage(role, text);
          // Teks final sudah di-commit ke transkrip → streaming line selesai.
          setLiveAgent('');
        },
        onAgentChatResponsePart: (part) => {
          if (part.type === 'delta') setLiveAgent((p) => p + part.text);
          else if (part.type === 'start') setLiveAgent(part.text);
          // 'stop': biarkan teks tampil; onMessage(agent) menambahkannya ke
          // transkrip lalu membersihkan baris ini.
        },
      });
      convRef.current = conv;
    } catch (err) {
      setPhase('idle');
      setError(err instanceof Error ? err.message : 'Gagal memulai percakapan');
    }
  }

  const beginEvaluation = useCallback(() => {
    if (pollingRef.current) return; // onDisconnect bisa terpanggil dua kali
    pollingRef.current = true;
    setPhase('evaluating');
    void pollStatus();
  }, []);

  /** poll GET /voice-conversation/:id sampai GRADED / timeout 60 dtk. */
  async function pollStatus() {
    const id = recordIdRef.current;
    if (!id) return;
    for (let i = 0; i < POLL_MAX_TRIES; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      try {
        const st = await api<VoiceConversationStatusView>(`/voice-conversation/${id}`);
        if (st.status === 'GRADED') {
          setResult(st);
          setPhase('done');
          return;
        }
      } catch {
        // satu poll gagal (mis. sesat jaringan) → lanjut, jangan bunuh loop
      }
    }
    setGradingTimeout(true);
    setPhase('done');
  }

  async function hangUp() {
    // endSession SDK akan memicu onDisconnect → beginEvaluation.
    try {
      await convRef.current?.endSession();
    } catch {
      beginEvaluation();
    }
  }

  function toggleMic() {
    const next = !micOn;
    setMicOn(next);
    convRef.current?.setMicMuted(!next);
  }

  // ---- UI idle / starting ------------------------------------------------
  if (phase === 'idle' || phase === 'starting') {
    return (
      <div className="space-y-3.5 px-5 pt-6 pb-6">
        {error ? (
          <Card eyebrow="Gagal" title="Tidak bisa mulai ngobrol" className="text-center">
            <p className="mb-3 text-sm font-semibold text-muted">{error}</p>
            <ChunkyButton variant="ghost" onClick={() => setPhase('idle')}>
              Coba lagi
            </ChunkyButton>
          </Card>
        ) : null}

        <Card eyebrow="Ngobrol" title="Ngobrol dengan AI">
          <p className="card-meta">
            Bicara bebas dengan AI tutor dalam bahasa Inggris — bukan menjawab
            soal, tapi percakapan sungguhan. Pakai mikrofonmu, dengarkan balasan
            AI, dan sambung terus.
          </p>
          <ul className="talk-bullets">
            <li>
              <MessagesSquare size={16} strokeWidth={2.25} />
              <span>Durasi ngobrol dibatasi harian & mingguan (kontrol biaya).</span>
            </li>
            <li>
              <Mic size={16} strokeWidth={2.25} />
              <span>XP didapat bila percakapan cukup lama & kamu cukup bicara.</span>
            </li>
          </ul>
          <ChunkyButton onClick={start} disabled={phase === 'starting'}>
            {phase === 'starting' ? 'MENGHUBUNGKAN...' : 'MULAI NGROBOL'}
          </ChunkyButton>
        </Card>
      </div>
    );
  }

  // ---- UI live -----------------------------------------------------------
  if (phase === 'live') {
    const speaking = mode === 'speaking';
    const muted = !micOn;
    const stateTone = speaking ? 'speaking' : muted ? 'muted' : 'listening';
    const stateLabel = speaking
      ? 'AI tutor berbicara'
      : muted
        ? 'Mikrofon mati'
        : 'Giliranmu bicara';
    const hint = muted
      ? 'Nyalakan mikrofon untuk menyambung.'
      : speaking
        ? liveAgent
          ? 'AI sedang bicara — kamu bisa memotong kapan saja.'
          : 'AI tutor sedang bicara…'
        : 'Tutor AI mendengarkan — sampaikan sesuatu.';

    return (
      <div className="space-y-3.5 px-5 pt-6 pb-6">
        <Card eyebrow="Ngobrol" title="Sedang ngobrol">
          <div className="talk-live-head">
            <span className={`talk-state ${stateTone}`}>{stateLabel}</span>
            <span className="talk-timer">{fmtElapsed(elapsedSec)}</span>
          </div>

          {/* Visual dua arah: AI bersuara → equalizer; giliranmu → cincin mic.
              Mute → cincin diam abu-abu (mode speaking tetap tampil walau mic
              mati — AI masih bicara, itu urusan terpisah dari mic). */}
          {speaking ? (
            <div className="talk-wave" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          ) : (
            <div
              className={muted ? 'talk-mic-visual is-muted' : 'talk-mic-visual'}
              aria-hidden="true"
            >
              <span className="talk-mic-ring" />
              <span className="talk-mic-ring d2" />
              <span className="talk-mic-badge">
                {muted ? <MicOff size={26} /> : <Mic size={26} />}
              </span>
            </div>
          )}
          <p className="talk-live-hint">{hint}</p>

          <ol ref={feedRef} onScroll={onFeedScroll} className="talk-feed">
            {messages.length === 0 ? (
              <li className="talk-feed-empty">
                Belum ada percakapan — mulai dengan sapaan sederhana, misalnya
                “Hello, how are you?”
              </li>
            ) : (
              messages.map((m) => (
                <li
                  key={m.id}
                  className={
                    m.role === 'user'
                      ? 'talk-bubble talk-bubble-user'
                      : 'talk-bubble talk-bubble-agent'
                  }
                >
                  <small>{m.role === 'user' ? 'Kamu' : 'Tutor AI'}</small>
                  <p>{m.text}</p>
                </li>
              ))
            )}
          </ol>

          {/* Teks yang sedang diucapkan agent — bubble "belum selesai". */}
          {speaking && liveAgent ? (
            <div className="talk-live-line" aria-live="polite">
              <b>Tutor AI</b>
              <span>{liveAgent}</span>
            </div>
          ) : null}

          <div className="talk-live-actions">
            <ChunkyButton
              variant="ghost"
              onClick={toggleMic}
              aria-label={micOn ? 'Matikan mikrofon' : 'Nyalakan mikrofon'}
            >
              {micOn ? <MicOff size={18} /> : <Mic size={18} />}
            </ChunkyButton>
            <ChunkyButton variant="danger" onClick={hangUp}>
              <span className="inline-flex items-center gap-2">
                <PhoneOff size={18} strokeWidth={2.25} />
                AKHIRI
              </span>
            </ChunkyButton>
          </div>
        </Card>
      </div>
    );
  }

  // ---- UI evaluating / done ---------------------------------------------
  return (
    <div className="space-y-3.5 px-5 pt-6 pb-6">
      <Card eyebrow="Ngobrol" title={gradingTimeout ? 'Percakapan selesai' : 'Menilai percakapanmu'} className="text-center">
        {phase === 'evaluating' && !gradingTimeout ? (
          <>
            <p className="mb-4 text-sm font-semibold text-muted">
              Tutor AI mengecek durasi & giliran bicaramu… sebentar lagi.
            </p>
            <div className="talk-live-ring talk-evaluating-spinner" />
          </>
        ) : gradingTimeout ? (
          <p className="mb-4 text-sm font-semibold text-muted">
            Nilai belum masuk. XP akan muncul di profil begitu webhook BE selesai
            memproses — percakapan ini aman tersimpan.
          </p>
        ) : result?.passed ? (
          <>
            <p className="mb-1 text-3xl font-black text-brand">+{result.xpAwarded} XP</p>
            <p className="mb-4 text-sm font-semibold text-muted">
              Percakapan yang asyik! Kamu ngobrol {result.durationSecs} detik.
            </p>
          </>
        ) : (
          <p className="mb-4 text-sm font-semibold text-muted">
            Percakapan selesai. XP diberikan saat percakapan cukup lama — coba
            lebih panjang lain kali!
          </p>
        )}
        <ChunkyButton variant="ghost" onClick={() => router.push('/home')}>
          KEMBALI KE BERANDA
        </ChunkyButton>
      </Card>
    </div>
  );
}
