import { Head, router } from '@inertiajs/react';
import type { VisibilityState } from '@tanstack/react-table';
import { useState } from 'react';

import { DataTable } from '@/components/table/datatable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

import type { PaginationMeta } from '@/types/custom/pagination';
import type { Anggota } from '@/types/custom/anggota';
import { columnAnggota } from './column-anggota';
import { useTableActions } from '@/lib/useTableAction';
import { Label } from '@/components/ui/label';
import { FileSpreadsheet, RefreshCw } from 'lucide-react';
import { useRoute } from '@/lib/route';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Option {
    id: number;
    name: string;
}

interface Props {
    anggota: {
        data: Anggota[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
        perPage?: number;
        office_id: string;
        statusUser: string;
    };
    offices: Option[];
}

export default function Index({ anggota, filters, offices }: Props) {
    const route = useRoute();
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [localFilters, setLocalFilters] = useState({
        search: filters.search ?? '',
        perPage: filters.perPage ?? 10,
        office_id: filters.office_id ?? '',
        statusUser: filters.statusUser ?? 'active',
    });

    const { handleFilterChange, handleExport } = useTableActions({
        filters: localFilters,
        indexRoute: 'anggota.index',
        exportRoute: 'anggota.export',
        allColumns: ['nama', 'office_name', 'total_simpanan', 'total_pinjaman', 'total_angsuran'],
    });

    const handleResetFilters = () => {
        setIsRefreshing(true);
        setLocalFilters({ search: '', perPage: 10, office_id: '', statusUser: 'active' });
        router.get(
            route('anggota.index'),
            { statusUser: 'active' },
            {
                replace: true,
                onFinish: () => setIsRefreshing(false),
            },
        );
    };
    const handleStatusUserChange = (value: string) => {
        const updated = {
            ...localFilters,
            statusUser: value,
            page: 1,
        };

        setLocalFilters(updated);

        router.get(route('anggota.index'), updated, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Anggota', href: route('anggota.index') }]}>
            <Head title="Anggota" />

            <div className="space-y-4 p-5">
                <div className="flex justify-between">
                    <h1 className="text-xl font-semibold">Data Anggota</h1>

                    <div className="fuad flex gap-2">
                        <Button variant="outline" onClick={handleResetFilters} className="cursor-pointer">
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>

                        <Button disabled variant="outline" onClick={() => handleExport(columnVisibility)}>
                            <FileSpreadsheet className="h-4 w-4" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-3">
                    <div>
                        <Label>Nama Anggota</Label>
                        <Input
                            value={localFilters.search}
                            onChange={(e) => handleFilterChange(localFilters, setLocalFilters, 'search', e.target.value)}
                            placeholder="Cari nama anggota..."
                        />
                    </div>
                    <div>
                        <Label>Status Anggota</Label>
                        <Select value={localFilters.statusUser ?? 'active'} onValueChange={handleStatusUserChange}>
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
                        <Label>Kantor</Label>
                        <Select
                            value={localFilters.office_id?.toString() ?? 'all'}
                            onValueChange={(value) => handleFilterChange(localFilters, setLocalFilters, 'office_id', value)}
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
                </div>

                <DataTable<Anggota>
                    columns={columnAnggota()}
                    data={anggota.data}
                    meta={anggota.meta}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                    perPage={localFilters.perPage}
                    onPerPageChange={(v) => handleFilterChange(localFilters, setLocalFilters, 'perPage', v)}
                />
            </div>
        </AppLayout>
    );
}
