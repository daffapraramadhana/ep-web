import { Card } from '@/components/ui';

// Placeholder — daftar laporan soal (tab OPEN/RESOLVED, Lihat soal, Tandai
// selesai) dibangun di Task 6 (spec §5 "/admin/laporan").
export default function LaporanPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-black text-ink">Laporan Soal</h1>
      <p className="mb-6 text-sm font-semibold text-muted">
        Tinjau laporan soal bermasalah dari karyawan.
      </p>
      <Card title="Segera hadir">
        <p className="text-sm font-semibold text-muted">
          Daftar laporan soal (terbuka/selesai) akan tampil di sini.
        </p>
      </Card>
    </div>
  );
}
