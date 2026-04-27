import { Head, router } from '@inertiajs/react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
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
        start_date?: string;
        end_date?: string;
        status?: string;
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
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [localFilters, setLocalFilters] = useState({
        search: filters.search ?? '',
        start_date: filters.start_date ?? '',
        end_date: filters.end_date ?? '',
        status: filters.status,
        office_id: filters.office_id ?? '',
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
            perPage: 10,
            start_date: '',
            end_date: '',
            status: '',
            office_id: '',
            statusPinjaman: '',
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

                <div className="flex flex-col gap-3 rounded-xl border p-4">
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
                            <Label>Periode Terbayar</Label>

                            <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="h-7 flex-1 justify-start p-4 font-normal">
                                            <CalendarIcon className="mr-2 h-3 w-3" />
                                            {localFilters.start_date
                                                ? format(new Date(localFilters.start_date), 'dd/MM/yyyy')
                                                : 'Pilih tanggal'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={
                                                localFilters.start_date ? new Date(localFilters.start_date) : undefined
                                            }
                                            onSelect={(date) =>
                                                handleFilterChange(
                                                    localFilters,
                                                    setLocalFilters,
                                                    'start_date',
                                                    date ? format(date, 'yyyy-MM-dd') : '',
                                                )
                                            }
                                            captionLayout="dropdown"
                                            fromYear={2020}
                                            toYear={2050}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>

                                <span className="text-[10px] whitespace-nowrap text-muted-foreground">s/d</span>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="h-7 flex-1 justify-start p-4 font-normal">
                                            <CalendarIcon className="mr-2 h-3 w-3" />
                                            {localFilters.end_date
                                                ? format(new Date(localFilters.end_date), 'dd/MM/yyyy')
                                                : 'Pilih tanggal'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={localFilters.end_date ? new Date(localFilters.end_date) : undefined}
                                            onSelect={(date) =>
                                                handleFilterChange(
                                                    localFilters,
                                                    setLocalFilters,
                                                    'end_date',
                                                    date ? format(date, 'yyyy-MM-dd') : '',
                                                )
                                            }
                                            captionLayout="dropdown"
                                            fromYear={2020}
                                            toYear={2050}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columnAngsuran()}
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
