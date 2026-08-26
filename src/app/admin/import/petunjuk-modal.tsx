'use client';

import { useEffect } from 'react';
import { X, Download } from 'lucide-react';

/**
 * PetunjukModal — petunjuk pengisian template built-in (konten diport dari
 * deliverables/petunjuk-pengisian.md; kalau dokumen sumbernya berubah,
 * perbarui juga di sini). Dialog: Esc / klik backdrop / tombol ✕ menutup.
 */
export function PetunjukModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="petunjuk-backdrop" onClick={onClose} role="presentation">
      <div
        className="petunjuk-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="petunjuk-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="petunjuk-head">
          <h2 id="petunjuk-title">Petunjuk Pengisian Template</h2>
          <button type="button" className="petunjuk-close" onClick={onClose} aria-label="Tutup">
            <X size={20} strokeWidth={2.25} />
          </button>
        </div>

        <div className="petunjuk-body">
          <p>
            File template akan diimpor langsung ke sistem — ikuti aturan di bawah agar proses impor
            berjalan lancar.
          </p>

          <h3>Konsep lesson</h3>
          <p>
            Satu <b>lesson</b> = satu topik pembelajaran berisi <b>8–10 soal</b>. Semua baris dengan{' '}
            <code>lesson_code</code> yang <b>sama</b> digabung menjadi satu lesson, dan kolom{' '}
            <code>lesson_title</code>, <code>topic</code>, <code>level</code>, <code>cefr</code>,{' '}
            <code>skill</code>-nya harus <b>konsisten</b>. Nomori urutan soal dengan{' '}
            <code>item_order</code>: 1, 2, 3, dst.
          </p>

          <h3>3 tipe soal</h3>
          <div className="petunjuk-tipe">
            <div>
              <b>
                1. Pilihan ganda — <code>pilihan_ganda</code>
              </b>
              <p>
                <code>option_a</code> s.d. <code>option_d</code> wajib terisi semua;{' '}
                <code>answer</code> = huruf <code>A</code>/<code>B</code>/<code>C</code>/
                <code>D</code>.
              </p>
              <p className="petunjuk-contoh">
                Contoh: prompt <i>What does &quot;schedule&quot; mean?</i> · opsi{' '}
                <i>Jadwal / Pertemuan / Perjalanan / Tujuan</i> · answer <code>A</code>
              </p>
            </div>
            <div>
              <b>
                2. Isian — <code>isian</code>
              </b>
              <p>
                Tulis <code>___</code> (3 garis bawah) di bagian yang dikosongkan pada{' '}
                <code>prompt</code>. <code>answer</code> = jawaban utama;{' '}
                <code>accepted_answers</code> = variasi lain yang juga benar, dipisah{' '}
                <code>;</code>.
              </p>
              <p className="petunjuk-contoh">
                Contoh: prompt <i>Please ___ the report before Friday.</i> · answer{' '}
                <code>submit</code> · accepted <code>submit;send;hand in</code>
              </p>
            </div>
            <div>
              <b>
                3. Susun kalimat — <code>susun_kalimat</code>
              </b>
              <p>
                <code>answer</code> = kalimat lengkap yang benar, minimal 3 kata. Sistem yang
                mengacak kepingan katanya.
              </p>
              <p className="petunjuk-contoh">
                Contoh: answer <i>I will send the report tomorrow</i>
              </p>
            </div>
          </div>

          <h3>Media (audio/gambar)</h3>
          <p>
            <b>Upload dulu file media di halaman Media</b>, baru tulis nama file-nya{' '}
            <b>persis sama</b> (huruf besar/kecil & ekstensi) di kolom <code>media_file</code> —
            contoh <code>audio_001.mp3</code>. Nama yang belum diunggah membuat baris itu gagal
            impor. Kosongkan bila soal tidak butuh media.
          </p>

          <h3>Kolom lain</h3>
          <ul>
            <li>
              <code>level</code> / <code>cefr</code> / <code>skill</code> — pilih dari dropdown di
              template, jangan mengetik nilai lain.
            </li>
            <li>
              <code>explanation</code> — <b>wajib untuk semua soal</b>; muncul ke karyawan saat
              menjawab salah.
            </li>
            <li>
              <code>passage</code> — teks bacaan untuk soal reading; kosongkan bila tidak ada.
            </li>
          </ul>

          <div className="petunjuk-warning">
            <b>Jangan mengubah nama atau urutan kolom di baris pertama.</b> Sistem membaca data
            berdasarkan nama kolom persis seperti pada template.
          </div>

          <h3>Boleh dikirim bertahap</h3>
          <p>
            Impor aman diulang: soal yang sudah ada <b>diperbarui</b> (bukan diduplikasi), soal
            baru ditambahkan. Tidak perlu menunggu semua lesson lengkap.
          </p>
        </div>

        <div className="petunjuk-foot">
          <a href="/petunjuk-pengisian.md" download className="petunjuk-dl">
            <Download size={15} strokeWidth={2.25} />
            Unduh versi dokumen
          </a>
          <button type="button" className="btn btn-ghost petunjuk-tutup" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
