/**
 * Logo Fluen — toga (belajar) + buku terbuka + dua gelembung percakapan
 * (bahasa Inggris untuk dipakai bicara, bukan sekadar dibaca).
 *
 * Garis putih di antara bentuk adalah BAGIAN dari mark, bukan latar —
 * jadi logo selalu diletakkan di atas permukaan terang (tile putih
 * `.auth-wordmark-icon` / `.user-nav-brand-icon` di globals.css). Di
 * atas navy tanpa tile, teal & ungu nyaris hilang kontrasnya.
 *
 * Tali rumbai digambar dua lapis (putih tebal = pemisah, emas tipis =
 * isi) karena talinya melintas di atas papan toga yang sewarna.
 *
 * Path di sini DUPLIKAT dengan `src/app/icon.svg` (yang menambah latar
 * putih membulat) — favicon memakai konvensi file Next.js, bukan
 * komponen React, jadi keduanya harus diubah bersamaan bila mark
 * direvisi. Sesudah mengubah icon.svg, regenerate favicon.ico &
 * apple-icon.png (lihat catatan di README).
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path
        fill="#1D6A8C"
        d="M11 25h16v15a4 4 0 0 1-4 4h-5l-5 7v-7h-2a4 4 0 0 1-4-4V29a4 4 0 0 1 4-4z"
      />
      <path
        fill="#7B3F9D"
        d="M53 25H37v15a4 4 0 0 0 4 4h5l5 7v-7h2a4 4 0 0 0 4-4V29a4 4 0 0 0-4-4z"
      />
      <g stroke="#fff" strokeWidth={1.6} strokeLinejoin="round">
        <path fill="#7CAB4E" d="M17 20l15 5.5V46c-5-5-9.5-7-15-7z" />
        <path fill="#DD5B21" d="M47 20l-15 5.5V46c5-5 9.5-7 15-7z" />
        <path fill="#C09A22" d="M24 12.5h16V21l-8 4.8-8-4.8z" />
        <path fill="#CBA62D" d="M32 4.5l16.5 6.8L32 18 15.5 11.3z" />
      </g>
      <path
        d="M31.5 10.4C27 14 24.5 13.6 21.5 17.5"
        fill="none"
        stroke="#fff"
        strokeWidth={4.4}
        strokeLinecap="round"
      />
      <path
        d="M31.5 10.4C27 14 24.5 13.6 21.5 17.5"
        fill="none"
        stroke="#C09A22"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <circle cx="21.2" cy="19.8" r="3.6" fill="#fff" />
      <circle cx="21.2" cy="19.8" r="2.4" fill="#C09A22" />
    </svg>
  );
}
