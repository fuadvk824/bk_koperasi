import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { VisibilityState } from '@tanstack/react-table';

import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/components/table/datatable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { RefreshCw, FileSpreadsheet, CalendarIcon } from 'lucide-react';

import { columnAngsuran } from './column-angsuran';
import { useTableActions } from '@/lib/useTableAction';
import { useRoute } from '@/lib/route';
import { formatRupiah } from '@/lib/formatRupiah';
import { PaginationMeta } from '@/types/custom/pagination';
import { Angsuran } from '@/types/custom/angsuran';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Option {
    id: number;
    name: string;
}
interface Props {
    angsuran: {
        data: Angsuran[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
        // start_date?: string;
        // end_date?: string;
        bulan?: string | number;
        tahun?: string | number;
        status?: string;
        status_approval?: string;
        office_id?: number;
        statusPinjaman: string;
        perPage?: number;
    };
    offices: Option[];
    totAngsJlnNoBunga: number;
    totAngsJlnWithBunga: number;
    keuntunganBunga: number;
}

export default function Index({
    angsuran,
    filters,
    offices,
    totAngsJlnNoBunga,
    totAngsJlnWithBunga,
    keuntunganBunga,
}: Props) {
    const route = useRoute();
    const { auth } = usePage().props as any;
    const trial = auth?.roles?.some((r: string) => r === 'trial-user');

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [localFilters, setLocalFilters] = useState({
        search: filters.search ?? '',
        bulan: filters.bulan?.toString() ?? '',
        tahun: filters.tahun?.toString() ?? '',
        status: filters.status ?? '',
        status_approval: filters.status ?? '',
        office_id: filters.office_id?.toString() ?? '',
        statusPinjaman: filters.statusPinjaman ?? '',
        perPage: filters.perPage ?? 10,
    });

    const { handleFilterChange, handleExport } = useTableActions({
        filters: localFilters,
        indexRoute: 'angsuran.index',
        exportRoute: 'angsuran.export',
        allColumns: ['angsuran_ke', 'status'],
    });

    const handleResetFilters = () => {
        setIsRefreshing(true);

        setLocalFilters({
            search: '',
            bulan: '',
            tahun: '',
            status: '',
            status_approval: '',
            office_id: '',
            statusPinjaman: '',
            perPage: 10,
        });

        router.get(
            route('angsuran.index'),
            {},
            {
                replace: true,
                onFinish: () => setIsRefreshing(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Angsuran', href: route('angsuran.index') }]}>
            <Head title="Angsuran" />

            <div className="space-y-4 p-5">
                <div className="flex justify-between">
                    <h1 className="text-xl font-semibold">Data Angsuran</h1>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleResetFilters} className="cursor-pointer">
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>

                        <Button disabled variant="outline" onClick={() => handleExport(columnVisibility)}>
                            <FileSpreadsheet /> <span className="hidden sm:inline">Export</span>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                            <Label className="font-bold text-bk-dev">Angsuran (tanpa bunga)</Label>
                            <Input
                                value={formatRupiah(totAngsJlnNoBunga)}
                                disabled
                                className="border-bk-dev font-bold text-bk-dev"
                            />
                        </div>
                        <div>
                            <Label className="font-bold text-bk-dev">Angsuran (dengan bunga)</Label>
                            <Input
                                value={formatRupiah(totAngsJlnWithBunga)}
                                disabled
                                className="border-bk-dev font-bold text-bk-dev"
                            />
                        </div>
                        <div>
                            <Label className="font-bold text-bk-dev">Keuntungan (bunga)</Label>
                            <Input
                                value={formatRupiah(keuntunganBunga)}
                                disabled
                                className="border-bk-dev font-bold text-bk-dev"
                            />
                        </div>
                    </div>
                    <div className="h-px w-full border-t" />
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                            <Label>Search</Label>
                            <Input
                                value={localFilters.search}
                                onChange={(e) => handleFilterChange(localFilters, setLocalFilters, 'search', e.target.value)}
                                placeholder="Cari nama/refcode anggota..."
                            />
                        </div>
                        <div>
                            <Label>Kantor</Label>
                            <Select
                                value={localFilters.office_id?.toString() ?? 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange(localFilters, setLocalFilters, 'office_id', value)
                                }
                            >
                                <SelectTrigger className="h-7 w-full p-4">
                                    <SelectValue placeholder="Pilih kantor" />
                                </SelectTrigger>
                                <SelectContent className="max-h-80 overflow-y-auto">
                                    <SelectItem value="all">ALL OFFICE</SelectItem>
                                    {offices.map((office) => (
                                        <SelectItem key={office.id} value={office.id.toString()}>
                                            {office.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Status Angsuran</Label>
                            <Select
                                value={localFilters.status ?? 'all'}
                                onValueChange={(value) => handleFilterChange(localFilters, setLocalFilters, 'status', value)}
                            >
                                <SelectTrigger className="h-7 w-full p-4">
                                    <SelectValue placeholder="Pilih Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="sudah_bayar">Sudah Bayar</SelectItem>
                                    <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div>
                            <Label>Status Pengajuan</Label>
                            <Select
                                value={localFilters.status_approval ?? 'all'}
                                onValueChange={(value) => handleFilterChange(localFilters, setLocalFilters, 'status', value)}
                            >
                                <SelectTrigger className="h-7 w-full p-4">
                                    <SelectValue placeholder="Pilih Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="belum_diajukan">Belum diajukan</SelectItem>
                                    <SelectItem value="menunggu">Menunggu</SelectItem>
                                    <SelectItem value="disetujui">Disetujui</SelectItem>
                                    <SelectItem value="ditolak">Ditolak</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Bulan Angsuran</Label>
                            <Select
                                value={localFilters.bulan || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange(localFilters, setLocalFilters, 'bulan', value === 'all' ? '' : value)
                                }
                            >
                                <SelectTrigger className="h-7 w-full p-4">
                                    <SelectValue placeholder="Pilih Bulan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Bulan</SelectItem>
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
                                        <SelectItem key={index + 1} value={(index + 1).toString()}>
                                            {nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Tahun Angsuran</Label>
                            <Select
                                value={localFilters.tahun || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange(localFilters, setLocalFilters, 'tahun', value === 'all' ? '' : value)
                                }
                            >
                                <SelectTrigger className="h-7 w-full p-4">
                                    <SelectValue placeholder="Pilih Tahun" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tahun</SelectItem>
                                    {Array.from({ length: 2050 - 2020 + 1 }, (_, index) => 2020 + index).map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columnAngsuran(trial)}
                    data={angsuran.data}
                    meta={angsuran.meta}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                    perPage={localFilters.perPage}
                    onPerPageChange={(val) => handleFilterChange(localFilters, setLocalFilters, 'perPage', val)}
                />
            </div>
        </AppLayout>
    );
}
