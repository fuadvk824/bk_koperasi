import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { VisibilityState } from '@tanstack/react-table';

import AppLayout from '@/layouts/app-layout';
import { useRoute } from '@/lib/route';
import { useTableActions } from '@/lib/useTableAction';

import { DataTable } from '@/components/table/datatable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { RefreshCw, FileSpreadsheet, Tickets } from 'lucide-react';
import { columnTransaksiKas } from './column-transaksi-kas';

import type { TransaksiKas } from '@/types/custom/transaksikas';
import type { PaginationMeta } from '@/types/custom/pagination';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatRupiah } from '@/lib/formatRupiah';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Form from './form';

interface Option {
    id: number;
    name: string;
}

interface Props {
    transaksiKas: {
        data: TransaksiKas[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
        perPage?: number;
        jenis?: string;
        kategori?: string;
        office_id?: number;
        statusUser: string;
    };
    users: Option[];
    offices: Option[];
    saldoKas: number;
    kasKeluar: number;
    kasMasuk: number;
}

export default function Index({ transaksiKas, filters, offices, saldoKas, kasMasuk, kasKeluar }: Props) {
    const route = useRoute();
    const { auth } = usePage().props as any;
    const trial = auth?.roles?.some((r: string) => r === 'trial-user');

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<TransaksiKas | null>(null);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const [localFilters, setLocalFilters] = useState({
        search: filters.search ?? '',
        perPage: filters.perPage ?? 10,
        jenis: filters.jenis,
        kategori: filters.kategori,
        office_id: filters.office_id ?? '',
        statusUser: filters.statusUser ?? '',
    });

    const { handleFilterChange, handleExport } = useTableActions({
        filters: localFilters,
        indexRoute: 'transaksikas.index',
        exportRoute: 'transaksikas.export',
        allColumns: ['jenis', 'kategori', 'jumlah', 'tanggal', 'status'],
    });

    const handleResetFilters = () => {
        setIsRefreshing(true);
        setLocalFilters({ search: '', perPage: 10, jenis: '', kategori: '', office_id: '', statusUser: '' });
        router.get(
            route('transaksikas.index'),
            {},
            {
                replace: true,
                onFinish: () => setIsRefreshing(false),
            },
        );
    };
    const openCreate = () => {
        setSelected(null);
        setOpen(true);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Transaksi Kas', href: route('transaksikas.index') }]}>
            <Head title="Transaksi Kas" />

            <div className="space-y-4 p-5">
                <div className="flex justify-between">
                    <h1 className="text-xl font-semibold">Data Transaksi Kas</h1>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleResetFilters} className="cursor-pointer">
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>

                        <Button disabled variant="outline" onClick={() => handleExport(columnVisibility)}>
                            <FileSpreadsheet className="h-4 w-4" /> <span className="hidden sm:inline">Export</span>
                        </Button>

                        <Button onClick={openCreate} disabled={trial} className="cursor-pointer">
                            <Tickets className="h-4 w-4" /> <span className="hidden sm:inline">Mutasi</span>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                            <Label className="font-bold text-bk-dev">Total Saldo Kas</Label>
                            <Input value={formatRupiah(saldoKas)} disabled className="border-bk-dev font-bold text-bk-dev" />
                        </div>
                        <div>
                            <Label className="font-bold text-bk-dev">Total Kas Masuk</Label>
                            <Input value={formatRupiah(kasMasuk)} disabled className="border-bk-dev font-bold text-bk-dev" />
                        </div>
                        <div>
                            <Label className="font-bold text-bk-dev">Total Kas Keluar</Label>
                            <Input
                                value={formatRupiah(kasKeluar)}
                                disabled
                                className="border-bk-dev font-bold text-bk-dev"
                            />
                        </div>
                    </div>
                    <div className="h-px w-full border-t" />
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                            <Label>Seacrh</Label>
                            <Input
                                value={localFilters.search}
                                onChange={(e) => handleFilterChange(localFilters, setLocalFilters, 'search', e.target.value)}
                                placeholder="Cari nama anggota..."
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
                            <Label>Jenis</Label>
                            <Select
                                value={localFilters.jenis ?? 'all'}
                                onValueChange={(value) => handleFilterChange(localFilters, setLocalFilters, 'jenis', value)}
                            >
                                <SelectTrigger className="h-7 w-full p-4">
                                    <SelectValue placeholder="Pilih Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Jenis</SelectItem>
                                    <SelectItem value="masuk">Masuk</SelectItem>
                                    <SelectItem value="keluar">Keluar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Kategori</Label>
                            <Select
                                value={localFilters.kategori ?? 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange(localFilters, setLocalFilters, 'kategori', value)
                                }
                            >
                                <SelectTrigger className="h-7 w-full p-4">
                                    <SelectValue placeholder="Pilih Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    <SelectItem value="simpanan">Simpanan</SelectItem>
                                    <SelectItem value="pinjaman">Pinjaman</SelectItem>
                                    <SelectItem value="angsuran">Angsuran</SelectItem>
                                    <SelectItem value="mutasi">Mutasi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Status Anggota</Label>
                            <Select
                                value={localFilters.statusUser ?? 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange(localFilters, setLocalFilters, 'statusUser', value)
                                }
                            >
                                <SelectTrigger className="h-7 w-full p-4">
                                    <SelectValue placeholder="Pilih Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Mutasi Saldo Kas</DialogTitle>
                            <DialogDescription>Silahkan lengkapi data transaksi berikut</DialogDescription>
                        </DialogHeader>

                        <Form close={() => setOpen(false)} initialData={selected ?? undefined} />
                    </DialogContent>
                </Dialog>

                <DataTable
                    columns={columnTransaksiKas()}
                    data={transaksiKas.data}
                    meta={transaksiKas.meta}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                    perPage={localFilters.perPage}
                    onPerPageChange={(val) => handleFilterChange(localFilters, setLocalFilters, 'perPage', val)}
                />
            </div>
        </AppLayout>
    );
}
