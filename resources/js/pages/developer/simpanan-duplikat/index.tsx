
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import type { VisibilityState } from '@tanstack/react-table';
import { RefreshCw } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/components/table/datatable';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { useRoute } from '@/lib/route';
import { useTableActions } from '@/lib/useTableAction';

import { columnSimpananDuplikat } from './column-simpanan-duplikat';
import { columnAnggotaBelumBayar } from './column-anggota-belum-bayar';

import type {
    SimpananDuplikat,
    AnggotaBelumBayar,
} from '@/types/custom/simpanan-duplikat';
import { PaginationMeta } from '@/types/custom/pagination';

type ModeTampilan = 'duplikat' | 'belum-bayar';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

 
interface Props {
    simpanan: {
        data: SimpananDuplikat[] | AnggotaBelumBayar[];
        links: PaginationLink[];
        meta: PaginationMeta;
    };
    filters: {
        tahun: number;
        bulan: number;
        perPage: number;
        jenis: string;
        mode: 'duplikat' | 'belum-bayar';
    };
    tahunOptions: number[];
}

const namaBulan = [
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
];

export default function Index({
    simpanan,
    filters,
    tahunOptions,
}: Props) {
    const route = useRoute();

    const [isRefreshing, setIsRefreshing] = useState(false);

    const [columnVisibility, setColumnVisibility] =
        useState<VisibilityState>({});

    const [localFilters, setLocalFilters] = useState({
        tahun: filters.tahun,
        bulan: filters.bulan,
        perPage: filters.perPage ?? 10,
        jenis: filters.jenis || 'all',
        mode: filters.mode || 'duplikat',
    });

    const { handleFilterChange } = useTableActions({
        filters: localFilters,
        indexRoute: 'simpanan-duplikat.index',
        exportRoute: 'simpanan-duplikat.export',
        allColumns: ['jenis', 'jumlah', 'tanggal'],
    });

    const handleResetFilters = () => {
        setIsRefreshing(true);

        const defaultFilters = {
            tahun: new Date().getFullYear(),
            bulan: new Date().getMonth() + 1,
            perPage: 10,
            jenis: 'all',
            mode: 'duplikat' as ModeTampilan,
        };

        setLocalFilters(defaultFilters);

        router.get(
            route('simpanan-duplikat.index'),
            {},
            {
                preserveScroll: true,
                preserveState: false,
                replace: true,
                onFinish: () => setIsRefreshing(false),
            },
        );
    };

    const handleJenisChange = (value: string) => {
        handleFilterChange(
            localFilters,
            setLocalFilters,
            'jenis',
            value,
        );
    };

    const handleTahunChange = (value: string) => {
        handleFilterChange(
            localFilters,
            setLocalFilters,
            'tahun',
            Number(value),
        );
    };

    const handleBulanChange = (value: string) => {
        handleFilterChange(
            localFilters,
            setLocalFilters,
            'bulan',
            Number(value),
        );
    };

    const handleModeChange = (value: string) => {
        if (value !== 'duplikat' && value !== 'belum-bayar') {
            return;
        }

        handleFilterChange(
            localFilters,
            setLocalFilters,
            'mode',
            value,
        );
    };

    const handlePerPageChange = (value: number) => {
        handleFilterChange(
            localFilters,
            setLocalFilters,
            'perPage',
            value,
        );
    };

    const isBelumBayar = localFilters.mode === 'belum-bayar';

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Simpanan Duplikat',
                    href: route('simpanan-duplikat.index'),
                },
            ]}
        >
            <Head title="Simpanan Duplikat" />

            <div className="space-y-4 p-5">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">
                            {isBelumBayar
                                ? 'Daftar Anggota Belum Membayar'
                                : 'Data Simpanan Ganda'}
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {namaBulan[localFilters.bulan - 1]}{' '}
                            {localFilters.tahun}
                        </p>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleResetFilters}
                        disabled={isRefreshing}
                        className="cursor-pointer"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${
                                isRefreshing ? 'animate-spin' : ''
                            }`}
                        />
                        <span className="hidden sm:inline">
                            Refresh
                        </span>
                    </Button>
                </div>

                {/* Filter */}
                <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                        {/* Mode */}
                        <div className="space-y-2">
                            <Label>Mode Tampilan</Label>

                            <Select
                                value={localFilters.mode}
                                onValueChange={handleModeChange}
                            >
                                <SelectTrigger className="h-9 w-full">
                                    <SelectValue placeholder="Pilih tampilan" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="duplikat">
                                        Simpanan Ganda
                                    </SelectItem>

                                    <SelectItem value="belum-bayar">
                                        Belum Membayar
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Jenis */}
                        <div className="space-y-2">
                            <Label>Jenis Simpanan</Label>

                            <Select
                                value={localFilters.jenis}
                                onValueChange={handleJenisChange}
                            >
                                <SelectTrigger className="h-9 w-full">
                                    <SelectValue placeholder="Pilih jenis simpanan" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Jenis
                                    </SelectItem>

                                    <SelectItem value="wajib">
                                        Wajib
                                    </SelectItem>

                                    <SelectItem value="sukarela">
                                        Sukarela
                                    </SelectItem>

                                    <SelectItem value="modal">
                                        Modal
                                    </SelectItem>

                                    <SelectItem value="penarikan">
                                        Penarikan
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Bulan */}
                        <div className="space-y-2">
                            <Label>Bulan Simpanan</Label>

                            <Select
                                value={String(localFilters.bulan)}
                                onValueChange={handleBulanChange}
                            >
                                <SelectTrigger className="h-9 w-full">
                                    <SelectValue placeholder="Pilih bulan" />
                                </SelectTrigger>

                                <SelectContent>
                                    {namaBulan.map((nama, index) => (
                                        <SelectItem
                                            key={index + 1}
                                            value={String(index + 1)}
                                        >
                                            {nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tahun */}
                        <div className="space-y-2">
                            <Label>Tahun Simpanan</Label>

                            <Select
                                value={String(localFilters.tahun)}
                                onValueChange={handleTahunChange}
                            >
                                <SelectTrigger className="h-9 w-full">
                                    <SelectValue placeholder="Pilih tahun" />
                                </SelectTrigger>

                                <SelectContent>
                                    {tahunOptions.map((tahun) => (
                                        <SelectItem
                                            key={tahun}
                                            value={String(tahun)}
                                        >
                                            {tahun}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Per halaman */}
                        <div className="space-y-2">
                            <Label>Data Per Halaman</Label>

                            <Select
                                value={String(localFilters.perPage)}
                                onValueChange={(value) =>
                                    handlePerPageChange(Number(value))
                                }
                            >
                                <SelectTrigger className="h-9 w-full">
                                    <SelectValue placeholder="Data per halaman" />
                                </SelectTrigger>

                                <SelectContent>
                                    {[10, 25, 50, 100].map((jumlah) => (
                                        <SelectItem
                                            key={jumlah}
                                            value={String(jumlah)}
                                        >
                                            {jumlah} data
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <p className="mt-4 text-sm text-muted-foreground">
                        {isBelumBayar
                            ? `Menampilkan anggota aktif yang belum memiliki data simpanan jenis ${
                                  localFilters.jenis === 'all'
                                      ? 'apa pun'
                                      : localFilters.jenis
                              } pada ${namaBulan[localFilters.bulan - 1]} ${
                                  localFilters.tahun
                              }.`
                            : `Menampilkan transaksi simpanan ganda pada tahun ${localFilters.tahun}. Filter bulan digunakan untuk memilih periode tampilan.`}
                    </p>
                </div>

                {/* Tabel anggota belum membayar */}
                {isBelumBayar ? (
                    <DataTable<AnggotaBelumBayar>
                        columns={columnAnggotaBelumBayar}
                        data={simpanan.data as AnggotaBelumBayar[]}
                        meta={simpanan.meta}
                        columnVisibility={columnVisibility}
                        onColumnVisibilityChange={setColumnVisibility}
                        perPage={localFilters.perPage}
                        onPerPageChange={handlePerPageChange}
                    />
                ) : (
                    /* Tabel simpanan duplikat */
                    <DataTable<SimpananDuplikat>
                        columns={columnSimpananDuplikat}
                        data={simpanan.data as SimpananDuplikat[]}
                        meta={simpanan.meta}
                        columnVisibility={columnVisibility}
                        onColumnVisibilityChange={setColumnVisibility}
                        perPage={localFilters.perPage}
                        onPerPageChange={handlePerPageChange}
                    />
                )}
            </div>
        </AppLayout>
    );
}
