import type { ColumnDef } from '@tanstack/react-table';

import type { TransaksiKas } from '@/types/custom/transaksikas';
import { formatRupiah } from '@/lib/formatRupiah';

export const columnTransaksiKas = (): ColumnDef<TransaksiKas>[] => [
    {
        accessorKey: 'admin.name',
        header: 'Admin',
        cell: ({ row }) => row.original.admin?.name ?? '-',
    },
    {
        accessorKey: 'user.name',
        header: 'User',
        cell: ({ row }) => row.original.user?.name ?? '-',
    },
    {
        accessorKey: 'jenis',
        header: 'Jenis',
    },
    {
        accessorKey: 'kategori',
        header: 'Kategori',
    },
    {
        accessorKey: 'ref_id',
        header: 'RefCode',
        cell: ({ row }) => {
            return '#' + row.original.ref_id;
        },
    },
    {
        accessorKey: 'keterangan',
        header: 'Keterangan',
        cell: ({ row }) => row.original.keterangan ?? '-',
    },
    {
        accessorKey: 'jumlah',
        header: 'Jumlah',
        cell: ({ row }) => {
            return formatRupiah(row.original.jumlah);
        },
    },
    {
        accessorKey: 'tanggal',
        header: 'Tanggal',
    },

    {
        accessorKey: 'status',
        header: 'Status',
    },
];
