
import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import type { InactiveNodata } from '@/types/custom/riwayat-aktivitas';

interface ColumnOptions {
    selectedIds: number[];
    allSelected: boolean;
    someSelected: boolean;
    onToggle: (id: number, checked: boolean) => void;
    onToggleAll: (checked: boolean) => void;
    onDelete: (user: InactiveNodata) => void;
    deletingId: number | null;
}

export function getColumnInactiveNodata({
    selectedIds,
    allSelected,
    someSelected,
    onToggle,
    onToggleAll,
    onDelete,
    deletingId,
}: ColumnOptions): ColumnDef<InactiveNodata>[] {
    const selectedSet = new Set(selectedIds);

    return [
        {
            id: 'select',
            header: () => (
                <div className="">
                    <Checkbox
                        checked={
                            allSelected
                                ? true
                                : someSelected
                                  ? 'indeterminate'
                                  : false
                        }
                        onCheckedChange={(checked) =>
                            onToggleAll(checked === true)
                        }
                        aria-label="Pilih semua anggota di halaman ini"
                        disabled={deletingId !== null}
                    />
                </div>
            ),
            cell: ({ row }) => {
                const user = row.original;

                return (
                    <div className="">
                        <Checkbox
                            checked={selectedSet.has(user.id)}
                            onCheckedChange={(checked) =>
                                onToggle(user.id, checked === true)
                            }
                            aria-label={`Pilih ${user.nama}`}
                            disabled={deletingId !== null}
                        />
                    </div>
                );
            },
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: 'nomor',
            header: () => (
                <div className="w-10 text-center">No.</div>
            ),
            cell: ({ row }) => (
                <div className="w-10 text-center">
                    {row.index + 1}.
                </div>
            ),
            enableSorting: false,
        },
        {
            accessorKey: 'nama',
            header: 'Nama Anggota',
        },
        {
            accessorKey: 'status',
            header: 'Status Anggota',
        },
        {
            accessorKey: 'active_at',
            header: 'Aktif Sejak',
            cell: ({ row }) => row.original.active_at ?? '-',
        },
        {
            accessorKey: 'inactive_at',
            header: 'Non Aktif Sejak',
            cell: ({ row }) => row.original.inactive_at ?? '-',
        },
        {
            id: 'aksi',
            header: () => (
                <div className="text-center">Aksi</div>
            ),
            cell: ({ row }) => {
                const user = row.original;
                const isDeleting = deletingId === user.id;

                return (
                    <div className="flex justify-center">
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deletingId !== null}
                            onClick={() => onDelete(user)}
                        >
                            <Trash2 className="mr-1 h-4 w-4" />
                            {isDeleting ? 'Menghapus...' : 'Hapus'}
                        </Button>
                    </div>
                );
            },
            enableSorting: false,
        },
    ];
}
