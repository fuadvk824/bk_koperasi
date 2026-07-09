import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { SquarePen } from 'lucide-react';
import { Pinjaman } from '@/types/custom/pinjaman';
import { formatRupiah } from '@/lib/formatRupiah';

export const columnPinjaman = (openEdit: any, trial: boolean): ColumnDef<Pinjaman>[] => [
    {
        accessorKey: 'user.name',
        header: 'Nama',
    },
    {
        accessorKey: 'tanggal_pinjaman',
        header: 'Tanggal Pinjaman',
    },
    {
        accessorKey: 'jatuh_tempo_terakhir',
        header: 'Jatuh Tempo',
    },
    {
        accessorKey: 'jumlah_pinjaman',
        header: 'Jumlah Pinjaman',
        cell: ({ row }) => {
            return formatRupiah(row.original.jumlah_pinjaman);
        },
    },
    {
        accessorKey: 'bunga_persen',
        header: 'Bunga (%)',
        cell: ({ row }) => {
            return `${row.original.bunga_persen}%`;
        },
    },
    {
        accessorKey: 'total_pinjaman',
        header: 'Total Pinjaman',
        cell: ({ row }) => {
            return formatRupiah(row.original.total_pinjaman);
        },
    },
    {
        accessorKey: 'sisa_pinjaman',
        header: 'Sisa Pinjaman',
        cell: ({ row }) => {
            return formatRupiah(row.original.sisa_pinjaman);
        },
    },
    {
        accessorKey: 'angsuran_per_bulan',
        header: 'Angsuran Per Bulan',
        cell: ({ row }) => {
            return formatRupiah(row.original.angsuran_per_bulan);
            
        },
    },
    {
        accessorKey: 'angsuran_bulan_terakhir',
        header: 'Angsuran Bulan Terakhir',
        cell: ({ row }) => {
            return formatRupiah(row.original.angsuran_bulan_terakhir);
        },
    },
    {
        accessorKey: 'lama_angsuran',
        header: 'Lama Angsuran',
        cell: ({ row }) => {
            return `${row.original.lama_angsuran} X`;
        },
    },
    {
        accessorKey: 'status',
        header: 'Status',
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
