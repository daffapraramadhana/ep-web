import { Card } from '@/components/ui';

// Placeholder — tabel karyawan penuh (filter status, pencarian, CSV, panel
// detail /admin/karyawan/[id]) dibangun di Task 5 (spec §5 "/admin/karyawan").
export default function KaryawanPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-black text-ink">Karyawan</h1>
      <p className="mb-6 text-sm font-semibold text-muted">
        Pantau aktivitas dan status setiap karyawan.
      </p>
      <Card title="Segera hadir">
        <p className="text-sm font-semibold text-muted">
          Tabel karyawan (aktivitas, streak, tren, status) akan tampil di sini.
        </p>
      </Card>
    </div>
  );
}
