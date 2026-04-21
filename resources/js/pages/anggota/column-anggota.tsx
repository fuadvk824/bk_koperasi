import type { ColumnDef } from '@tanstack/react-table';
import { formatRupiah } from '@/lib/formatRupiah';
import type { Anggota } from '@/types/custom/anggota';

import KeluarButton from './KeluarButton';

export const columnAnggota = (): ColumnDef<Anggota>[] => [
    {
        accessorKey: 'nama',
        header: 'Nama',
    },
    {
        accessorKey: 'office_name',
        header: 'Kantor',
        cell: ({ row }) => row.original.office_name ?? '-',
    },
    {
        accessorKey: 'total_simpanan',
        header: 'Semua Simpanan',
        cell: ({ row }) => formatRupiah(row.original.total_simpanan),
    },
    {
        accessorKey: 'simpanan_wajib',
        header: 'Simpanan Wajib',
        cell: ({ row }) => formatRupiah(row.original.simpanan_wajib),
    },
    {
        accessorKey: 'simpanan_sukarela',
        header: 'Simpanan Sukarela',
        cell: ({ row }) => formatRupiah(row.original.simpanan_sukarela),
    },
    {
        accessorKey: 'simpanan_modal',
        header: 'Simpanan Modal',
        cell: ({ row }) => formatRupiah(row.original.simpanan_modal),
    },
    {
        accessorKey: 'total_pinjaman',
        header: 'Pinjaman',
        cell: ({ row }) => formatRupiah(row.original.total_pinjaman),
    },
    {
        accessorKey: 'total_angsuran',
        header: 'Angsuran',
        cell: ({ row }) => formatRupiah(row.original.total_angsuran),
    },
    {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => {
            return (
                <KeluarButton userId={row.original.id} nama={row.original.nama} sisaSimpanan={row.original.sisa_simpanan} />
            );
        },
    },
];
