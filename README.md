# ep-web — Fluen (Frontend)

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

### Logo & favicon

Mark Fluen hidup di dua tempat yang **harus diubah bersamaan**: `src/components/logo.tsx` (komponen React, tanpa latar) dan `src/app/icon.svg` (favicon, dengan latar putih membulat). `favicon.ico` dan `apple-icon.png` adalah turunan `icon.svg` — regenerate sesudah mark berubah:

```bash
node -e "const s=require('sharp'),f=require('fs'),A='src/app';const p=n=>s(f.readFileSync(A+'/icon.svg'),{density:384}).resize(n,n).png().toBuffer();(async()=>{const sz=[16,32,48],im=await Promise.all(sz.map(async n=>({n,d:await p(n)})));let o=6+im.length*16;const d=Buffer.alloc(6);d.writeUInt16LE(1,2);d.writeUInt16LE(im.length,4);const e=im.map(({n,d:b})=>{const x=Buffer.alloc(16);x.writeUInt8(n,0);x.writeUInt8(n,1);x.writeUInt16LE(1,4);x.writeUInt16LE(32,6);x.writeUInt32LE(b.length,8);x.writeUInt32LE(o,12);o+=b.length;return x});f.writeFileSync(A+'/favicon.ico',Buffer.concat([d,...e,...im.map(i=>i.d)]));f.writeFileSync(A+'/apple-icon.png',await p(180))})()"
```

`sharp` sudah ikut sebagai dependensi Next; `.ico` ditulis manual karena sharp tidak mengekspor format itu (entri PNG-in-ICO, didukung semua browser modern).

## Hutang teknis (disengaja untuk pilot)

- **Token di `localStorage`** (bukan cookie httpOnly) — rentan XSS; migrasikan ke cookie httpOnly + refresh token sebelum skala produksi.
- **Guard route hanya di client** (`useEffect`) — ada flash singkat sebelum redirect di koneksi lambat; belum ada proteksi middleware/server.
- Belum ada test otomatis FE — UI diverifikasi manual terskrip per fase (checklist di repo ep-workflow).
