import { Head, router, usePage } from '@inertiajs/react';
import { useRoute } from '@/lib/route';
import type { VisibilityState } from '@tanstack/react-table';
import { useState } from 'react';

import { DataTable } from '@/components/table/datatable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

import type { PaginationMeta } from '@/types/custom/pagination';
import { columnSimpanan } from './column-simpanan';
import { useTableActions } from '@/lib/useTableAction';
import { Label } from '@/components/ui/label';
import { CalendarIcon, FilePlus, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Simpanan } from '@/types/custom/simpanan';
import Form from './form';
import { formatRupiah } from '@/lib/formatRupiah';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Option {
    id: number;
    name: string;
}

interface Props {
    simpanan: {
        data: Simpanan[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
        start_date?: string;
        end_date?: string;
        office_id?: number;
        jenis: string;
        statusUser: string;
        perPage?: number;
    };
    users: Option[];
    offices: Option[];
    simpananWajib: number;
    simpananSukarela: number;
    simpananModal: number;
    totalSimpanan: number;
}

export default function Index({
    simpanan,
    filters,
    users,
    offices,
    simpananWajib,
    simpananSukarela,
    totalSimpanan,
    simpananModal,
}: Props) {
    const route = useRoute();
    const { auth } = usePage().props as any;
    const trial = auth?.roles?.some((r: string) => r === 'trial-user');

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<Simpanan | null>(null);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const [localFilters, setLocalFilters] = useState({
        search: filters.search ?? '',
        start_date: filters.start_date ?? '',
        end_date: filters.end_date ?? '',
        office_id: filters.office_id ?? '',
        jenis: filters.jenis ?? '',
        statusUser: filters.statusUser ?? '',
        perPage: filters.perPage ?? 10,
    });

    const { handleFilterChange, handleExport } = useTableActions({
        filters: localFilters,
        indexRoute: 'simpanan.index',
        exportRoute: 'simpanan.export',
        allColumns: ['jenis', 'jumlah', 'tanggal'],
    });

    const handleResetFilters = () => {
        setIsRefreshing(true);
        setLocalFilters({ search: '', perPage: 10, start_date: '', end_date: '', office_id: '', jenis: '', statusUser: '' });
        router.get(
            route('simpanan.index'),
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

    const openEdit = (data: Simpanan) => {
        setSelected(data);
        setOpen(true);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Simpanan', href: route('simpanan.index') }]}>
            <Head title="Simpanan" />

            <div className="space-y-4 p-5">
                <div className="flex justify-between">
                    <h1 className="text-xl font-semibold">Data Simpanan</h1>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleResetFilters} className="cursor-pointer">
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>

                        <Button disabled variant="outline" onClick={() => handleExport(columnVisibility)}>
                            <FileSpreadsheet className="h-4 w-4" /> <span className="hidden sm:inline">Export</span>
                        </Button>

                        <Button onClick={openCreate} disabled={trial} className="cursor-pointer">
                            <FilePlus className="h-4 w-4" /> <span className="hidden sm:inline">Tambah</span>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                            <Label className="font-bold text-bk-dev">Total Semua Simpanan</Label>
                            <Input
                                value={formatRupiah(totalSimpanan)}
                                disabled
                                className="border-bk-dev font-bold text-bk-dev"
                            />
                        </div>
                        <div>
                            <Label className="font-bold text-bk-dev">Total Simpanan Wajib</Label>
                            <Input
                                value={formatRupiah(simpananWajib)}
                                disabled
                                className="border-bk-dev font-bold text-bk-dev opacity-100"
                            />
                        </div>
                        <div>
                            <Label className="font-bold text-bk-dev">Total Simpanan Sukarela</Label>
                            <Input
                                value={formatRupiah(simpananSukarela)}
                                disabled
                                className="border-bk-dev font-bold text-bk-dev"
                            />
                        </div>
                        <div>
                            <Label className="font-bold text-bk-dev">Total Simpanan Modal</Label>
                            <Input
                                value={formatRupiah(simpananModal)}
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
                                    <SelectItem value="wajib">Wajib</SelectItem>
                                    <SelectItem value="sukarela">Sukarela</SelectItem>
                                    <SelectItem value="modal">Modal</SelectItem>
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
                        <div>
                            <Label>Periode</Label>

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

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selected ? 'Edit' : 'Tambah'} Simpanan</DialogTitle>
                            <DialogDescription>Silahkan lengkapi data simpanan</DialogDescription>
                        </DialogHeader>

                        <Form close={() => setOpen(false)} initialData={selected ?? undefined} users={users} />
                    </DialogContent>
                </Dialog>

                <DataTable
                    columns={columnSimpanan(openEdit, trial)}
                    data={simpanan.data}
                    meta={simpanan.meta}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                    perPage={localFilters.perPage}
                    onPerPageChange={(val) => handleFilterChange(localFilters, setLocalFilters, 'perPage', val)}
                />
            </div>
        </AppLayout>
    );
}
