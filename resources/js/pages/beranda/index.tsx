import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useRoute } from '@/lib/route';
import { formatRupiah } from '@/lib/formatRupiah';

type User = {
    id: number;
    name: string;
};

type Role = {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
};
type AuthUser = {
    id: number;
    name: string;
    roles: Role[];
};

type Transaksi = {
    id: number;
    user?: User | null;
    jenis: 'masuk' | 'keluar';
    jumlah: number;
    tanggal: string;
};

type DashboardProps = {
    auth: {
        user: AuthUser;
    };
    totalSimpanan: number;
    totalPinjaman: number;
    sisaPinjaman: number;
    totalAnggota: number;
    saldoKas: number;
    angsuranMenunggak: number;
    pinjamanAktif: number;
    transaksiTerbaru: Transaksi[];
};

export default function Dashboard() {
    const route = useRoute();
    const { props } = usePage<DashboardProps>();

    const {
        auth,
        totalSimpanan,
        totalPinjaman,
        sisaPinjaman,
        totalAnggota,
        saldoKas,
        angsuranMenunggak,
        pinjamanAktif,
        transaksiTerbaru,
    } = props;

    const roles = props.auth.user?.roles ?? [];

    const isUser = roles.some((r) => r.name === 'user');
    const isAdmin = roles.some((r) => ['super-admin', 'admin', 'trial-user'].includes(r.name));

    if (isUser) {
        return (
            <AppLayout breadcrumbs={[{ title: 'Koperasi', href: route('dashboardKoperasi.index') }]}>
                <Head title="Koperasi" />

                <div className="space-y-4 p-5">
                    <div className="flex justify-between">
                        <h1 className="text-xl font-semibold">Dalam Perbaikan Sementara 😊</h1>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (isAdmin) {
        return (
            <AppLayout breadcrumbs={[{ title: 'Dashboard', href: route('dashboard') }]}>
                <Head title="Dashboard" />

                <div className="flex flex-col gap-6 p-4">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card title="Saldo Kas" value={formatRupiah(saldoKas)} />
                        <Card title="Total Anggota" value={totalAnggota.toString()} />
                        <Card title="Total Simpanan" value={formatRupiah(totalSimpanan)} />
                        <Card title="Total Pinjaman" value={formatRupiah(totalPinjaman)} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Card title="Pinjaman Aktif" value={pinjamanAktif.toString()} />
                        <Card title="Sisa Pinjaman" value={formatRupiah(sisaPinjaman)} />
                        <Card title="Angsuran Berjalan" value={angsuranMenunggak.toString()} />
                    </div>

                    <div className="rounded-xl border p-4 shadow-sm">
                        <h2 className="mb-4 font-semibold">Transaksi Terbaru</h2>

                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="py-3">Nama</th>
                                    <th>Jenis</th>
                                    <th>Jumlah</th>
                                    <th>Tanggal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transaksiTerbaru.length > 0 ? (
                                    transaksiTerbaru.map((t) => (
                                        <tr key={t.id} className="border-b">
                                            <td className="py-3 text-xs">{t.user?.name ?? '-'}</td>
                                            <td className="text-xs capitalize">{t.jenis}</td>
                                            <td className="text-xs">{formatRupiah(t.jumlah)}</td>
                                            <td className="text-xs">{t.tanggal}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-center text-gray-500">
                                            Belum ada transaksi
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </AppLayout>
        );
    }
}

type CardProps = {
    title: string;
    value: string;
};

function Card({ title, value }: CardProps) {
    return (
        <div className="rounded-xl border p-4 shadow-sm border-l-4 border-l-bk-dev">
            <p className="text-xs text-bk-dev">{title}</p>
            <h2 className={`mt-1 text-lg font-bold `}>{value}</h2>
        </div>

    );
}
