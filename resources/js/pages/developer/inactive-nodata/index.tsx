import { Head, router } from '@inertiajs/react';
import type { VisibilityState } from '@tanstack/react-table';
import { RefreshCw, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/table/datatable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import AppLayout from '@/layouts/app-layout';
import { useRoute } from '@/lib/route';
import { useTableActions } from '@/lib/useTableAction';

import type { PaginationMeta } from '@/types/custom/pagination';
import type { InactiveNodata } from '@/types/custom/riwayat-aktivitas';

import { getColumnInactiveNodata } from './column-inactive-nodata';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    users: {
        data: InactiveNodata[];
        links: Record<string, unknown>;
        meta: PaginationMeta;
    };
    filters?: {
        search?: string;
        perPage?: number;
        status?: 'all' | 'active' | 'inactive';
    };
}

export default function Index({ users, filters = {} }: Props) {
    const route = useRoute();

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const [isRefreshing, setIsRefreshing] = useState(false);

    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [selectedUser, setSelectedUser] = useState<InactiveNodata | null>(null);

    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [localFilters, setLocalFilters] = useState({
        search: filters.search ?? '',
        status: filters.status ?? 'all',
        perPage: filters.perPage ?? 10,
    });

    const { handleFilterChange } = useTableActions({
        filters: localFilters,
        indexRoute: 'inactive-nodata.index',
        exportRoute: 'inactive-nodata.export',
        allColumns: ['nama', 'status', 'active_at', 'inactive_at'],
    });

    const handleResetFilters = () => {
        setIsRefreshing(true);

        setLocalFilters({
            search: '',
            status: 'all',
            perPage: 10,
        });

        setSelectedIds([]);

        router.get(
            route('inactive-nodata.index'),
            {
                search: '',
                status: 'all',
                perPage: 10,
            },
            {
                replace: true,
                onFinish: () => {
                    setIsRefreshing(false);
                },
            },
        );
    };

    const allSelected = users.data.length > 0 && users.data.every((user) => selectedIds.includes(user.id));

    const someSelected = users.data.some((user) => selectedIds.includes(user.id)) && !allSelected;

    const handleToggle = (id: number, checked: boolean) => {
        setSelectedIds((current) => {
            if (checked) {
                return current.includes(id) ? current : [...current, id];
            }

            return current.filter((selectedId) => selectedId !== id);
        });
    };

    const handleToggleAll = (checked: boolean) => {
        const pageIds = users.data.map((user) => user.id);

        setSelectedIds((current) => {
            if (checked) {
                return [...new Set([...current, ...pageIds])];
            }

            return current.filter((id) => !pageIds.includes(id));
        });
    };

    const handleDeleteClick = (user: InactiveNodata) => {
        setSelectedUser(user);
    };

    const handleConfirmDelete = () => {
        if (!selectedUser || deletingId !== null) {
            return;
        }

        const user = selectedUser;

        setDeletingId(user.id);

        router.delete(route('inactive-nodata.destroy', user.id), {
            preserveScroll: true,

            onSuccess: () => {
                toast.success('Anggota berhasil dihapus', {
                    description: `${user.nama} telah dihapus.`,
                });

                setSelectedIds((current) => current.filter((id) => id !== user.id));

                setSelectedUser(null);
            },

            onError: (errors) => {
                const message = Object.values(errors).find((value): value is string => typeof value === 'string');

                toast.error('Gagal menghapus anggota', {
                    description: message ?? 'Periksa kembali data anggota dan coba lagi.',
                });
            },

            onFinish: () => {
                setDeletingId(null);
            },
        });
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0 || deletingId !== null) {
            return;
        }

        const ids = [...selectedIds];

        setDeletingId(-1);

        router.delete(route('inactive-nodata.bulk-destroy'), {
            data: {
                ids,
            },

            preserveScroll: true,

            onSuccess: () => {
                toast.success('Penghapusan berhasil', {
                    description: `${ids.length} anggota berhasil dihapus.`,
                });

                setSelectedIds([]);
                setIsBulkDeleteOpen(false);
            },

            onError: (errors) => {
                const message = Object.values(errors).find((value): value is string => typeof value === 'string');

                toast.error('Gagal menghapus anggota', {
                    description: message ?? 'Sebagian anggota tidak memenuhi syarat penghapusan.',
                });
            },

            onFinish: () => {
                setDeletingId(null);
            },
        });
    };

    const columns = getColumnInactiveNodata({
        selectedIds,
        allSelected,
        someSelected,
        onToggle: handleToggle,
        onToggleAll: handleToggleAll,
        onDelete: handleDeleteClick,
        deletingId,
    });

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Riwayat Aktivitas',
                    href: route('inactive-nodata.index'),
                },
            ]}
        >
            <Head title="Riwayat Aktivitas Anggota" />

            <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold">Riwayat Aktivitas Anggota </h1>

                        <p className="text-sm text-muted-foreground">Anggota yang belum memiliki data transaksi.</p>
                        <ul className="text-xs mt-3">
                            <li>1. Ahmad Romadhon</li>
                            <li>2. Anisa Aprilia</li>
                            <li>3. Jeffri Agustanto</li>
                            <li>4. Moh. Rifqi Firdaus</li>
                            <li>5. Mohammad Solikin</li>
                            <li>6. Wahyu Indra Dwiki Rahardiansyah</li>
                            <li>7. Wilda Erinda</li>
                        </ul>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleResetFilters}
                        disabled={isRefreshing || deletingId !== null}
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
                                disabled={deletingId !== null}
                                onChange={(e) => handleFilterChange(localFilters, setLocalFilters, 'search', e.target.value)}
                                placeholder="Cari nama anggota..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status Anggota</Label>

                            <Select
                                value={localFilters.status}
                                disabled={deletingId !== null}
                                onValueChange={(value: 'all' | 'active' | 'inactive') =>
                                    handleFilterChange(localFilters, setLocalFilters, 'status', value)
                                }
                            >
                                <SelectTrigger id="status" className='w-full'>
                                    <SelectValue placeholder="Pilih status" />
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

                {selectedIds.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3">
                        <div className="text-sm">
                            <span className="font-semibold">{selectedIds.length}</span> anggota dipilih
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={deletingId !== null}
                                onClick={() => setSelectedIds([])}
                            >
                                Batal Pilih
                            </Button>

                            <Button
                                type="button"
                                variant="destructive"
                                disabled={deletingId !== null}
                                onClick={() => setIsBulkDeleteOpen(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus yang Dipilih ({selectedIds.length})
                            </Button>
                        </div>
                    </div>
                )}

                <DataTable
                    columns={columns}
                    data={users.data}
                    meta={users.meta}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                    perPage={localFilters.perPage}
                    onPerPageChange={(val) => handleFilterChange(localFilters, setLocalFilters, 'perPage', val)}
                />
            </div>

            <AlertDialog
                open={selectedUser !== null}
                onOpenChange={(open) => {
                    if (!open && deletingId === null) {
                        setSelectedUser(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <TriangleAlert className="h-6 w-6 text-destructive" />
                        </div>

                        <AlertDialogTitle>Hapus anggota?</AlertDialogTitle>

                        <AlertDialogDescription>
                            Apakah kamu yakin ingin menghapus anggota{' '}
                            <span className="font-semibold text-foreground">{selectedUser?.nama}</span>? Data pengguna akan
                            dihapus secara permanen dan tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingId !== null}>Batal</AlertDialogCancel>

                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                handleConfirmDelete();
                            }}
                            disabled={deletingId !== null}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />

                            {deletingId !== null ? 'Menghapus...' : 'Ya, Hapus'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={isBulkDeleteOpen}
                onOpenChange={(open) => {
                    if (deletingId === null) {
                        setIsBulkDeleteOpen(open);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <TriangleAlert className="h-6 w-6 text-destructive" />
                        </div>

                        <AlertDialogTitle>Hapus semua anggota yang dipilih?</AlertDialogTitle>

                        <AlertDialogDescription>
                            Kamu akan menghapus{' '}
                            <span className="font-semibold text-foreground">{selectedIds.length} anggota</span> secara
                            permanen. Tindakan ini tidak dapat dibatalkan.
                            <span className="mt-2 block">Pastikan semua anggota yang dipilih memang ingin dihapus.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingId !== null}>Batal</AlertDialogCancel>

                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                handleBulkDelete();
                            }}
                            disabled={deletingId !== null || selectedIds.length === 0}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />

                            {deletingId !== null ? 'Menghapus...' : `Ya, Hapus ${selectedIds.length} Anggota`}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
