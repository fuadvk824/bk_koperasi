import { ColumnDef } from '@tanstack/react-table';
import { Shu } from '@/types/custom/shu';
import { formatRupiah } from '@/lib/formatRupiah';

export const columnShu = (): ColumnDef<Shu>[] => [
    {
        accessorKey: 'tahun',
        header: 'Tahun',
    },
    {
        accessorKey: 'bulan',
        header: 'Bulan',
    },
    {
        accessorKey: 'total_pokok',
        header: 'Pokok',
        cell: ({ row }) => formatRupiah(row.original.total_pokok),
    },
    {
        accessorKey: 'total_masuk',
        header: 'Total Masuk',
        cell: ({ row }) => formatRupiah(row.original.total_masuk),
    },
    {
        accessorKey: 'shu',
        header: 'SHU Bunga',
        cell: ({ row }) => formatRupiah(row.original.shu),
    },
];
