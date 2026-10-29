import { Head, router } from '@inertiajs/react';
import type { VisibilityState } from '@tanstack/react-table';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { DataTable } from '@/components/table/datatable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import AppLayout from '@/layouts/app-layout';
import { useRoute } from '@/lib/route';
import { useTableActions } from '@/lib/useTableAction';

import type { PaginationMeta } from '@/types/custom/pagination';
import type { RiwayatAktivitas } from '@/types/custom/riwayat-aktivitas';

import { columnRiwayatAktivitas } from './column-riwayat-aktivitas';

interface Props {
    aktivitas: {
        data: RiwayatAktivitas[];
        links: Record<string, unknown>;
        meta: PaginationMeta;
    };
    filters?: {
        search?: string;
        perPage?: number;
    };
}

export default function Index({ aktivitas, filters = {} }: Props) {
    const route = useRoute();

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const [isRefreshing, setIsRefreshing] = useState(false);

    const [localFilters, setLocalFilters] = useState({
        search: filters.search ?? '',
        perPage: filters.perPage ?? 10,
    });

    const { handleFilterChange } = useTableActions({
        filters: localFilters,
        indexRoute: 'riwayat-aktivitas.index',
        exportRoute: 'riwayat-aktivitas.export',
        allColumns: [
            'nama',
            'status',
            'active_at',
            'inactive_at',
            'tanggal_simpanan',
            'tanggal_pinjaman',
            'tanggal_transaksi_kas',
            'tandai',
        ],
    });

    const handleResetFilters = () => {
        setIsRefreshing(true);

        setLocalFilters({
            search: '',
            perPage: 10,
        });

        router.get(
            route('riwayat-aktivitas.index'),
            {
                perPage: 10,
            },
            {
                replace: true,
                onFinish: () => setIsRefreshing(false),
            },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Riwayat Aktivitas',
                    href: route('riwayat-aktivitas.index'),
                },
            ]}
        >
            <Head title="Riwayat Aktivitas Anggota" />

            <div className="space-y-4 p-5">
                <div className="flex justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Riwayat Aktivitas Anggota</h1>

                        <p className="text-sm text-muted-foreground">
                            Anggota dengan simpanan atau pinjaman sebelum tanggal aktif.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleResetFilters}
                        className="cursor-pointer"
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                </div>

                <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="search">Search</Label>

                            <Input
                                id="search"
                                value={localFilters.search}
                                onChange={(e) => handleFilterChange(localFilters, setLocalFilters, 'search', e.target.value)}
                                placeholder="Cari nama anggota..."
                            />
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columnRiwayatAktivitas}
                    data={aktivitas.data}
                    meta={aktivitas.meta}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                    perPage={localFilters.perPage}
                    onPerPageChange={(val) => handleFilterChange(localFilters, setLocalFilters, 'perPage', val)}
                />
            </div>
        </AppLayout>
    );
}
