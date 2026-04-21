import { Head, router } from '@inertiajs/react';
import { useRoute } from '@/lib/route';
import { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/components/table/datatable';
import { Button } from '@/components/ui/button';

import { RefreshCw } from 'lucide-react';

import type { VisibilityState } from '@tanstack/react-table';
import type { PaginationMeta } from '@/types/custom/pagination';
import type { Shu } from '@/types/custom/shu';

import { columnShu } from './column-shu';

interface Props {
    shu: {
        data: Shu[];
        meta: PaginationMeta;
    };
    filters: {
        perPage?: number;
    };
}

export default function Index({ shu, filters }: Props) {
    const route = useRoute();

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const [localFilters, setLocalFilters] = useState({
        perPage: filters.perPage ?? 10,
    });

    const handleResetFilters = () => {
        setLocalFilters({ perPage: 10 });
        router.get(route('shu.index'), {}, { replace: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'SHU', href: route('shu.index') }]}>
            <Head title="SHU" />

            <div className="space-y-4 p-5">
                <div className="flex justify-between">
                    <h1 className="text-xl font-semibold">SHU</h1>

                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={handleResetFilters}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                    SHU berdasarkan bunga dari angsuran yang sudah dibayar
                </div>

                <DataTable
                    columns={columnShu()}
                    data={shu.data}
                    meta={shu.meta}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                    perPage={localFilters.perPage}
                    onPerPageChange={(val) => setLocalFilters((prev) => ({ ...prev, perPage: val }))}
                />
            </div>
        </AppLayout>
    );
}
