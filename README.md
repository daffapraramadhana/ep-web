# ep-web — Daily English Learning Platform (Frontend)

Frontend untuk platform belajar bahasa Inggris harian karyawan. Satu proyek Next.js berisi **dua area**:

- **App user** (`/`) — onboarding, beranda (target harian + streak), sesi belajar interaktif (pilihan ganda, isian, susun kalimat + audio/gambar/bacaan), perayaan XP, peta perjalanan, progress, profil. Mobile-first dengan layout desktop dua kolom (app-frame + rail widget).
- **Dashboard admin** (`/admin`) — import soal via template xlsx, kelola lesson/soal + status terbit, upload media, import & undang karyawan.

**Murni lapisan tampilan** — semua penilaian, XP, dan logika bisnis dihitung [ep-api](https://github.com/daffapraramadhana/ep-api). Dokumen produk, spec UI/UX, dan design system: [ep-workflow](https://github.com/daffapraramadhana/ep-workflow) (`docs/design-system.md` wajib dibaca sebelum menyentuh UI).

**Stack:** Next.js 15 (App Router) · Tailwind 4 · Lucide · Nunito · WebAudio (sfx tanpa aset).

## Setup

```bash
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > .env.local
npm run dev                   # http://localhost:3000
```

Butuh ep-api berjalan (lihat README-nya). Login admin memakai kredensial seed API; akun karyawan dibuat lewat menu Karyawan (CSV) → link undangan.

## Skrip

```bash
npm run dev      # dev server (Turbopack)
npm run build    # build produksi (jangan dijalankan saat dev server hidup — sama-sama menulis .next/)
npm run start    # serve hasil build
npm run lint
```

## Struktur

```
src/
├── app/
│   ├── (user)/        # home, journey, progress, profile, session, onboarding
│   ├── admin/         # login, import, content, media, users
│   ├── login/         # login karyawan
│   └── invite/[token] # aktivasi akun dari undangan
├── components/        # ui.tsx (ChunkyButton dkk), hero, rail, nav, session/*
└── lib/               # api client, api-types (mirror kontrak BE), sfx, hooks
```

Konvensi penting: token desain hidup di `globals.css` (disalin dari design system — jangan hardcode warna); `src/lib/api-types.ts` harus selalu cermin kontrak BE; ikon Lucide `strokeWidth 2.25`; emoji hanya untuk perayaan/kalender.

## Hutang teknis (disengaja untuk pilot)

- **Token di `localStorage`** (bukan cookie httpOnly) — rentan XSS; migrasikan ke cookie httpOnly + refresh token sebelum skala produksi.
- **Guard route hanya di client** (`useEffect`) — ada flash singkat sebelum redirect di koneksi lambat; belum ada proteksi middleware/server.
- Belum ada test otomatis FE — UI diverifikasi manual terskrip per fase (checklist di repo ep-workflow).
