import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Wallet,
    Users,
    CreditCard,
    AlertTriangle,
    PiggyBank,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Clock3,
    CircleDollarSign,
    Banknote,
    Landmark,
    ChevronDown,
    Info,
    UserPlus,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import AppLayout from '@/layouts/app-layout';
import { useRoute } from '@/lib/route';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DashboardProps {
    periode: {
        bulan: number;
        tahun: number;
        nama_bulan: string;
    };
    pilihan_tahun: number[];

    total_anggota: number;
    anggota_baru_bulan_ini: number;

    total_kas: number;
    total_kas_masuk: number;
    total_kas_keluar: number;

    total_simpanan: number;
    total_simpanan_wajib: number;
    total_simpanan_sukarela: number;
    total_simpanan_modal: number;
    total_penarikan: number;

    simpanan_bulan_ini: {
        wajib: number;
        sukarela: number;
        modal: number;
        penarikan: number;
        total: number;
    };

    target_simpanan_wajib: number;
    simpanan_wajib_bulan_ini: number;
    persentase_simpanan_wajib: number;
    kekurangan_simpanan_wajib: number;

    pinjaman: {
        aktif: number;
        lunas: number;
        macet: number;
        total_diberikan: number;
        total_sisa: number;
        total_macet: number;
    };
    pinjaman_bulan_ini: {
        jumlah: number;
        total_diberikan: number;
        total_pokok: number;
        rata_rata: number;
        keuntungan: number;
    };

    angsuran: {
        target: number;
        sudah_bayar: number;
        belum_bayar: number;
        jumlah_target: number;
        jumlah_sudah_bayar: number;
        jumlah_belum_bayar: number;

        persentase: number;
        kekurangan: number;
        tunggakan: number;
        jumlah_tunggakan: number;
    };

    kas_bulan_ini: {
        masuk: number;
        keluar: number;
        bersih: number;
    };

    kas_masuk_kategori: Record<string, number>;
    kas_keluar_kategori: Record<string, number>;

    grafik_kas: GrafikKas[];

    transaksi_terbaru: TransaksiKas[];
}

interface GrafikKas {
    tanggal: string;
    masuk: number;
    keluar: number;
}

interface TransaksiKas {
    id: number;
    tanggal: string;
    jenis: 'masuk' | 'keluar';
    kategori: 'simpanan' | 'pinjaman' | 'angsuran' | 'mutasi';
    jumlah: number;
    keterangan: string | null;
    status: 'pending' | 'berhasil' | 'dibatalkan';
    user: string | null;
    admin: string | null;
}

const formatRupiah = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
};

const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('id-ID').format(value);
};

const formatTanggal = (value: string): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const kategoriLabel = (kategori: string): string => {
    const labels: Record<string, string> = {
        simpanan: 'Simpanan',
        pinjaman: 'Pinjaman',
        angsuran: 'Angsuran',
        angsuran_bulan_ini: 'Angsuran Bulan Ini',
        angsuran_bulan_lainnya: 'Angsuran Bulan Lainnya',
        mutasi: 'Mutasi',
    };

    return labels[kategori] ?? kategori;
};

interface StatCardProps {
    title: string;
    value: string;
    description?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendText?: string;
    action?: React.ReactNode;
}
const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, trend = 'neutral', trendText, action }) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>

                    <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{value}</p>

                    {(description || action) && (
                        <div className="mt-1 flex w-full items-center justify-between gap-2">
                            {description && <p className="text-xs leading-5 text-gray-500">{description}</p>}

                            {action && <div className="flex shrink-0 items-center leading-5">{action}</div>}
                        </div>
                    )}

                    {trendText && (
                        <div
                            className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${
                                trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
                            }`}
                        >
                            {trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5" />}
                            {trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5" />}
                            {trendText}
                        </div>
                    )}
                </div>

                <div className="rounded-xl bg-gray-100 p-3 text-gray-700">{icon}</div>
            </div>
        </div>
    );
};

interface ProgressBarProps {
    percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
    const safePercentage = Math.min(Math.max(percentage, 0), 100);

    return (
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
                className="h-full rounded-full bg-gray-900 transition-all duration-500"
                style={{
                    width: `${safePercentage}%`,
                }}
            />
        </div>
    );
};

interface MoneyRowProps {
    label: string;
    value: number;
    icon?: React.ReactNode;
}

const MoneyRow: React.FC<MoneyRowProps> = ({ label, value, icon }) => {
    return (
        <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
                {icon && <div className="rounded-lg bg-gray-100 p-2">{icon}</div>}

                <span className="text-sm text-gray-600">{label}</span>
            </div>

            <span className="text-sm font-semibold text-gray-900">{formatRupiah(value)}</span>
        </div>
    );
};

interface ChartTooltipProps {
    active?: boolean;
    payload?: Array<{
        value?: number;
        dataKey?: string;
        name?: string;
    }>;
    label?: string;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
            <p className="mb-2 text-xs font-semibold text-gray-500">Tanggal {label}</p>

            {payload.map((item, index) => (
                <div key={`${item.dataKey}-${index}`} className="flex items-center justify-between gap-5 text-xs">
                    <span className="text-gray-500">{item.dataKey === 'masuk' ? 'Kas Masuk' : 'Kas Keluar'}</span>

                    <span className="font-semibold text-gray-900">{formatRupiah(Number(item.value ?? 0))}</span>
                </div>
            ))}
        </div>
    );
};

const Index: React.FC<DashboardProps> = ({
    periode,
    pilihan_tahun,

    total_anggota,
    anggota_baru_bulan_ini,

    total_kas,
    total_kas_masuk,
    total_kas_keluar,

    total_simpanan,
    total_simpanan_wajib,
    total_simpanan_sukarela,
    total_simpanan_modal,
    total_penarikan,

    simpanan_bulan_ini,

    target_simpanan_wajib,
    simpanan_wajib_bulan_ini,
    persentase_simpanan_wajib,
    kekurangan_simpanan_wajib,

    pinjaman,
    pinjaman_bulan_ini,

    angsuran,

    kas_bulan_ini,

    kas_masuk_kategori,
    kas_keluar_kategori,

    grafik_kas,

    transaksi_terbaru,
}) => {
    const route = useRoute();

    const [isInfoModalOpen, setIsInfoModalOpen] = React.useState(true);

    const dataSimpanan = [
        {
            name: 'Wajib',
            value: total_simpanan_wajib,
        },
        {
            name: 'Sukarela',
            value: total_simpanan_sukarela,
        },
        {
            name: 'Modal',
            value: total_simpanan_modal,
        },
    ].filter((item) => item.value > 0);

    const totalKomposisiSimpanan = dataSimpanan.reduce((total, item) => total + item.value, 0);

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: route('dashboard') }]}>
            <Head title="Dashboard" />

            {isInfoModalOpen && (
                <div
                    className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="dashboard-info-title"
                >
                    <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                        {/* Header */}
                        <div className="border-b border-green-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-bk-dev">
                                    <Info className="h-6 w-6" />
                                </div>

                                <div>
                                    <h2 id="dashboard-info-title" className="text-lg font-bold text-gray-900">
                                        Informasi Dashboard
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">Kelengkapan Data Koperasi</p>
                                </div>
                            </div>
                        </div>

                        {/* Isi Informasi */}
                        <div className="px-6 py-6">
                            <p className="text-sm leading-6 text-gray-600">
                                Untuk memastikan informasi yang ditampilkan pada dashboard sesuai dengan kondisi terkini,
                                mohon Admin Dashboard memeriksa kembali kelengkapan data koperasi, khususnya pada bagian
                                berikut:
                            </p>

                            <div className="mt-4 space-y-3">
                                {['Data Simpanan', 'Data Pinjaman', 'Data Angsuran', 'Status Anggota'].map((item) => (
                                    <div key={item} className="flex items-center gap-3 rounded-lg bg-green-50 px-4 py-3">
                                        <AlertTriangle className="h-5 w-5 shrink-0 text-bk-dev" />

                                        <span className="text-sm font-medium text-gray-700">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-5 text-sm leading-6 text-gray-600">
                                Silakan tinjau data pada setiap bagian tersebut dan lakukan pembaruan apabila masih terdapat
                                data yang belum lengkap atau belum sesuai.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-6 py-4">
                            <Button type="button" className="cursor-pointer" onClick={() => setIsInfoModalOpen(false)}>
                                Tutup dan Lanjutkan
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="max-full mx-auto space-y-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Dashboard</h1>

                            <p className="mt-1 text-sm text-gray-500">
                                Monitoring koperasi • {periode.nama_bulan} {periode.tahun}
                            </p>
                        </div>

                        <form
                            method="GET"
                            action={route('dashboard')}
                            className="flex w-full flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:w-auto sm:flex-row sm:items-center"
                        >
                            <Select name="bulan" defaultValue={String(periode.bulan)}>
                                <SelectTrigger className="w-full sm:w-36">
                                    <SelectValue placeholder="Pilih bulan" />
                                </SelectTrigger>

                                <SelectContent>
                                    {[
                                        'Januari',
                                        'Februari',
                                        'Maret',
                                        'April',
                                        'Mei',
                                        'Juni',
                                        'Juli',
                                        'Agustus',
                                        'September',
                                        'Oktober',
                                        'November',
                                        'Desember',
                                    ].map((nama, index) => (
                                        <SelectItem key={nama} value={String(index + 1)}>
                                            {nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select name="tahun" defaultValue={String(periode.tahun)}>
                                <SelectTrigger className="w-full sm:w-28">
                                    <SelectValue placeholder="Pilih tahun" />
                                </SelectTrigger>

                                <SelectContent>
                                    {pilihan_tahun.map((tahun) => (
                                        <SelectItem key={tahun} value={String(tahun)}>
                                            {tahun}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button type="submit" className="gap-2 cursor-pointer">
                                <Clock3 className="h-4 w-4" />
                                Terapkan
                            </Button>

                            <Button type="button" variant="outline" className='cursor-pointer' asChild>
                                <a href={route('dashboard')}>Reset</a>
                            </Button>
                        </form>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Total Kas"
                            value={formatRupiah(total_kas)}
                            description="Saldo total sejak koperasi berdiri"
                            icon={<Wallet className="h-5 w-5" />}
                            // trend={kas_bulan_ini.bersih >= 0 ? 'up' : 'down'}
                            // trendText={`Net bulan ini ${formatRupiah(kas_bulan_ini.bersih)}`}
                        />

                        <StatCard
                            title="Anggota Aktif"
                            value={formatNumber(total_anggota)}
                            description={`${formatNumber(anggota_baru_bulan_ini)} anggota baru bulan ini`}
                            icon={<Users className="h-5 w-5" />}
                            action={
                                <a
                                    href={route('userManagement.index', {
                                        bulan: periode.bulan,
                                        tahun: periode.tahun,
                                    })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs leading-5 font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    Lihat
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </a>
                            }
                        />

                        <StatCard
                            title="Pinjaman Aktif"
                            value={formatNumber(pinjaman.aktif)}
                            description={`Sisa ${formatRupiah(pinjaman.total_sisa)}`}
                            icon={<CreditCard className="h-5 w-5" />}
                            action={
                                <a
                                    href={route('pinjaman.index', {
                                        status: 'aktif',
                                        statusUser: 'all',
                                    })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs leading-5 font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    Lihat
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </a>
                            }
                        />

                        <StatCard
                            title="Total Tunggakan"
                            value={formatRupiah(angsuran.jumlah_tunggakan)}
                            description={`${formatNumber(angsuran.tunggakan)} angsuran terlambat`}
                            icon={<AlertTriangle className="h-5 w-5" />}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="text-sm text-gray-500">Total Semua Simpanan</p>

                            <p className="mt-2 text-xl font-bold text-gray-900">{formatRupiah(total_simpanan)}</p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="text-sm text-gray-500">Total Semua Kas Masuk</p>

                            <p className="mt-2 text-xl font-bold text-gray-900">{formatRupiah(total_kas_masuk)}</p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="text-sm text-gray-500">Total Semua Kas Keluar</p>

                            <p className="mt-2 text-xl font-bold text-gray-900">{formatRupiah(total_kas_keluar)}</p>
                        </div>
                    </div>

                    <div className="h-0.5 w-full bg-gray-300"></div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-lg bg-gray-100 p-2">
                                        <PiggyBank className="h-5 w-5" />
                                    </div>

                                    <h2 className="font-semibold text-gray-900">Simpanan Wajib</h2>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{persentase_simpanan_wajib}%</div>
                            </div>

                            <div className="mt-3 flex items-start justify-between text-sm text-gray-500">
                                <p>Realisasi bulan ini</p>
                                <p className="text-right">{formatNumber(total_anggota)} anggota aktif</p>
                            </div>

                            <div className="mt-5">
                                <ProgressBar percentage={persentase_simpanan_wajib} />
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Sudah diterima</p>

                                    <p className="mt-1 font-semibold text-gray-900">
                                        {formatRupiah(simpanan_wajib_bulan_ini)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500">Target</p>
                                    <p className="mt-1 font-semibold text-gray-900">{formatRupiah(target_simpanan_wajib)}</p>
                                </div>
                            </div>

                            {/* <div className="mt-5 flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                                <AlertTriangle className="h-4 w-4" />
                                Kekurangan <strong>{formatRupiah(kekurangan_simpanan_wajib)}</strong>
                            </div> */}

                            <div className="mt-5 flex flex-col gap-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <span>
                                        Kekurangan <strong>{formatRupiah(kekurangan_simpanan_wajib)}</strong>
                                    </span>
                                </div>

                                <Button
                                    type="button"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={() => {
                                        const tanggalAkhir = new Date(periode.tahun, periode.bulan, 0).getDate();

                                        const url = route('simpanan.index', {
                                            start_date: `${periode.tahun}-${String(periode.bulan).padStart(2, '0')}-01`,
                                            end_date: `${periode.tahun}-${String(periode.bulan).padStart(2, '0')}-${String(tanggalAkhir).padStart(2, '0')}`,
                                            jenis: 'wajib',
                                            statusUser: 'all',
                                        });

                                        window.open(url, '_blank', 'noopener,noreferrer');
                                    }}
                                >
                                    Lihat Simpanan
                                    <ArrowUpRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-lg bg-gray-100 p-2">
                                        <Banknote className="h-5 w-5" />
                                    </div>

                                    <h2 className="font-semibold text-gray-900">Angsuran</h2>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{angsuran.persentase}%</div>
                            </div>
                            <div>
                                <p className="mt-3 text-sm text-gray-500">Realisasi pembayaran bulan ini</p>
                            </div>

                            <div className="mt-5">
                                <ProgressBar percentage={angsuran.persentase} />
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Sudah dibayar</p>

                                    <p className="mt-1 font-semibold text-gray-900">
                                        {formatNumber(angsuran.sudah_bayar)} <span className="text-xs">Angsuran</span>
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500">Target</p>

                                    <p className="mt-1 font-semibold text-gray-900">
                                        {formatNumber(angsuran.target)} <span className="text-xs">Angsuran</span>
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-col gap-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <span>
                                        Belum dibayar <strong>{formatNumber(angsuran.belum_bayar)} Angsuran</strong>
                                    </span>
                                </div>

                                <Button
                                    type="button"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={() => {
                                        const url = route('angsuran.index', {
                                            bulan: periode.bulan,
                                            tahun: periode.tahun,
                                            status: 'belum_bayar',
                                        });

                                        window.open(url, '_blank', 'noopener,noreferrer');
                                    }}
                                >
                                    Lihat Angsuran
                                    <ArrowUpRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-gray-100 p-3">
                                    <TrendingUp className="h-5 w-5" />
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Kas Masuk</p>

                                    <p className="mt-1 text-xl font-bold text-gray-900">
                                        {formatRupiah(kas_bulan_ini.masuk)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-gray-100 p-3">
                                    <TrendingDown className="h-5 w-5" />
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Kas Keluar</p>

                                    <p className="mt-1 text-xl font-bold text-gray-900">
                                        {formatRupiah(kas_bulan_ini.keluar)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-gray-100 p-3">
                                    <CircleDollarSign className="h-5 w-5" />
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Arus Kas Bersih</p>

                                    <p className="mt-1 text-xl font-bold text-gray-900">
                                        {formatRupiah(kas_bulan_ini.bersih)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* <div className="grid gap-6 lg:grid-cols-3"> */}
                    <div className="grid items-stretch gap-6 lg:grid-cols-3">
                        <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
                            <div className="mb-6">
                                <h2 className="font-semibold text-gray-900">Arus Kas</h2>

                                <p className="mt-1 text-sm text-gray-500">Kas masuk dan keluar bulan {periode.nama_bulan}</p>
                            </div>

                            <div className="min-h-80 w-full flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={grafik_kas}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: 0,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />

                                        <XAxis dataKey="tanggal" tickLine={false} axisLine={false} fontSize={12} />

                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            fontSize={12}
                                            tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}jt`}
                                        />

                                        <Tooltip content={<ChartTooltip />} />

                                        <Area
                                            type="monotone"
                                            dataKey="masuk"
                                            name="Kas Masuk"
                                            stroke="#2563eb"
                                            fill="#2563eb"
                                            strokeWidth={2}
                                            fillOpacity={0.15}
                                        />

                                        <Area
                                            type="monotone"
                                            dataKey="keluar"
                                            name="Kas Keluar"
                                            stroke="#f97316"
                                            fill="#f97316"
                                            strokeWidth={2}
                                            fillOpacity={0.15}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div>
                                <h2 className="font-semibold text-gray-900">Komposisi Simpanan</h2>

                                <p className="mt-1 text-sm text-gray-500">Total saldo simpanan</p>
                            </div>

                            <div className="relative mt-4 min-h-56 w-full flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dataSimpanan}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={65}
                                            outerRadius={90}
                                            paddingAngle={3}
                                        >
                                            {dataSimpanan.map((_, index) => {
                                                const colors = [
                                                    '#3B82F6',
                                                    '#10B981',
                                                    '#F59E0B',
                                                    '#8B5CF6',
                                                    '#EF4444',
                                                    '#06B6D4',
                                                ];

                                                return (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={colors[index % colors.length]}
                                                        stroke="none"
                                                    />
                                                );
                                            })}
                                        </Pie>

                                        <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500">Total</p>

                                        <p className="mt-1 text-sm font-bold text-gray-900">
                                            {formatRupiah(totalKomposisiSimpanan)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 space-y-1 divide-y divide-gray-100">
                                <MoneyRow label="Simpanan Wajib" value={total_simpanan_wajib} />

                                <MoneyRow label="Simpanan Sukarela" value={total_simpanan_sukarela} />

                                <MoneyRow label="Simpanan Modal" value={total_simpanan_modal} />

                                {total_penarikan && <MoneyRow label="Total Penarikan" value={-total_penarikan} />}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-gray-100 p-3">
                                    <ArrowUpRight className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-gray-900">Kas Masuk</h2>

                                    <p className="text-sm text-gray-500">Berdasarkan kategori</p>
                                </div>
                            </div>

                            <div className="mt-4 divide-y divide-gray-100">
                                {Object.entries(kas_masuk_kategori).map(([kategori, value]) => (
                                    <MoneyRow key={kategori} label={kategoriLabel(kategori)} value={Number(value)} />
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-gray-100 p-3">
                                    <ArrowDownRight className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-gray-900">Kas Keluar</h2>

                                    <p className="text-sm text-gray-500">Berdasarkan kategori</p>
                                </div>
                            </div>

                            <div className="mt-4 divide-y divide-gray-100">
                                {Object.entries(kas_keluar_kategori).map(([kategori, value]) => (
                                    <MoneyRow key={kategori} label={kategoriLabel(kategori)} value={Number(value)} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-5">
                                <h2 className="font-semibold text-gray-900">Monitoring Simpanan Bulan Ini</h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Ringkasan simpanan berdasarkan periode bulan ini
                                </p>
                            </div>

                            <div className="divide-y divide-gray-100">
                                <MoneyRow label="Wajib" value={simpanan_bulan_ini.wajib} />

                                <MoneyRow label="Sukarela" value={simpanan_bulan_ini.sukarela} />

                                <MoneyRow label="Modal" value={simpanan_bulan_ini.modal} />

                                <MoneyRow label="Penarikan" value={-simpanan_bulan_ini.penarikan} />

                                <div className="flex items-center justify-between py-4">
                                    <span className="font-semibold text-gray-900">Total Bersih</span>

                                    <span className="text-lg font-bold text-gray-900">
                                        {formatRupiah(simpanan_bulan_ini.total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Monitoring Pinjaman Bulan Ini</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Ringkasan pinjaman berdasarkan periode bulan ini
                                </p>
                            </div>

                            <div className="divide-y divide-gray-100">
                                <MoneyRow label="Total Pinjaman" value={pinjaman_bulan_ini?.total_diberikan ?? 0} />

                                <MoneyRow label="Total Pinjaman Dikeluarkan" value={pinjaman_bulan_ini?.total_pokok ?? 0} />

                                <MoneyRow label="Keuntungan Pinjaman" value={pinjaman_bulan_ini?.keuntungan ?? 0} />

                                <MoneyRow label="Rata-rata Pinjaman" value={pinjaman_bulan_ini?.rata_rata ?? 0} />

                                <div className="flex items-center justify-between py-4">
                                    <span className="font-semibold text-gray-900">Jumlah Pinjaman</span>

                                    <span className="text-lg font-bold text-gray-900">
                                        {pinjaman_bulan_ini?.jumlah ?? 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="font-semibold text-gray-900">Monitoring Angsuran</h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Status pembayaran angsuran bulan {periode.nama_bulan}
                                </p>
                            </div>

                            <div className="rounded-xl bg-gray-50 px-4 py-2">
                                <span className="text-xs text-gray-500">Tingkat pembayaran</span>

                                <p className="text-lg font-bold text-gray-900">{angsuran.persentase}%</p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5" />

                                    <span className="text-sm text-gray-500">Sudah Bayar</span>
                                </div>

                                <p className="mt-3 text-xl font-bold text-gray-900">
                                    {formatRupiah(angsuran.jumlah_sudah_bayar)}
                                </p>

                                <p className="mt-1 text-sm text-gray-500">{formatNumber(angsuran.sudah_bayar)}</p>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center gap-3">
                                    <Clock3 className="h-5 w-5" />

                                    <span className="text-sm text-gray-500">Belum Bayar</span>
                                </div>

                                <p className="mt-3 text-xl font-bold text-gray-900">
                                    {formatRupiah(angsuran.jumlah_belum_bayar)}
                                </p>

                                <p className="mt-1 text-sm text-gray-500">{formatNumber(angsuran.belum_bayar)}</p>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center gap-3">
                                    <Info className="h-5 w-5" />

                                    <span className="text-sm text-gray-500">Total Angsuran</span>
                                </div>

                                <p className="mt-3 text-xl font-bold text-gray-900">
                                    {formatRupiah(angsuran.jumlah_target)}
                                </p>

                                <p className="mt-1 text-sm text-gray-500">{formatNumber(angsuran.target)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold text-gray-900">Transaksi Terbaru</h2>

                                    <p className="mt-1 text-sm text-gray-500">Aktivitas kas terbaru</p>
                                </div>

                                <Landmark className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>

                        {transaksi_terbaru.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-sm text-gray-500">Belum ada transaksi.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {transaksi_terbaru.map((transaksi) => {
                                    const isMasuk = transaksi.jenis === 'masuk';

                                    return (
                                        <div
                                            key={transaksi.id}
                                            className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex min-w-0 items-center gap-4">
                                                <div className="rounded-xl bg-gray-100 p-3">
                                                    {isMasuk ? (
                                                        <ArrowUpRight className="h-5 w-5" />
                                                    ) : (
                                                        <ArrowDownRight className="h-5 w-5" />
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-gray-900">
                                                        {transaksi.keterangan || kategoriLabel(transaksi.kategori)}
                                                    </p>

                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                        <span>{transaksi.user}</span>

                                                        <span>•</span>

                                                        <span>{formatTanggal(transaksi.tanggal)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-4 sm:justify-end">
                                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                                    {kategoriLabel(transaksi.kategori)}
                                                </span>

                                                <span
                                                    className={`text-sm font-bold whitespace-nowrap ${
                                                        isMasuk ? 'text-emerald-600' : 'text-red-600'
                                                    }`}
                                                >
                                                    {isMasuk ? '+' : '-'}
                                                    {formatRupiah(transaksi.jumlah)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Index;
