import type { ColumnDef } from '@tanstack/react-table';
import { SquarePen } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Simpanan } from '@/types/custom/simpanan';
import { formatRupiah } from '@/lib/formatRupiah';

export const columnSimpanan = (openEdit: any, trial: boolean): ColumnDef<Simpanan>[] => [
    {
        accessorKey: 'tanggal',
        header: 'Tanggal',
    },
    {
        accessorKey: 'nama_user',
        header: 'Nama',
    },
    {
        accessorKey: 'jenis',
        header: 'Jenis',
    },
    {
        accessorKey: 'jumlah',
        header: 'Jumlah',
        cell: ({ row }) => {
            return formatRupiah(row.original.jumlah);
        },
    },

    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const data = row.original;

            return (
                <Button onClick={() => openEdit(data)} disabled={trial} className="cursor-pointer hover:scale-105">
                    <SquarePen size={16} /> Edit
                </Button>
                
            );
        },
    },
];
