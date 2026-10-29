
import type { ColumnDef } from '@tanstack/react-table';

import type { SimpananDuplikat } from '@/types/custom/simpanan-duplikat';
import { formatRupiah } from '@/lib/formatRupiah';

import PindahBulanSimpanan from './pindah-bulan-simpanan';

export const columnSimpananDuplikat: ColumnDef<SimpananDuplikat>[] = [
    {
        id: 'nomor',
        header: 'No.',
        cell: ({ row }) => row.index + 1,
    },
    {
        accessorKey: 'user.name',
        header: 'Nama Anggota',
        cell: ({ row }) => row.original.user?.name ?? '-',
    },
    {
        accessorKey: 'tanggal',
        header: 'Tanggal Simpanan',
    },
    {
        accessorKey: 'transaksi_kas_id',
        header: 'ID Transaksi Kas',
        cell: ({ row }) => row.original.transaksi_kas_id ?? '-',
    },
    {
        accessorKey: 'transaksi_kas_tanggal',
        header: 'Tanggal Transaksi Kas',
        cell: ({ row }) => row.original.transaksi_kas_tanggal ?? '-',
    },
    {
        accessorKey: 'jenis',
        header: 'Jenis Simpanan',
        cell: ({ row }) => {
            const jenis = row.original.jenis;

            return jenis.charAt(0).toUpperCase() + jenis.slice(1);
        },
    },
    {
        accessorKey: 'jumlah',
        header: 'Jumlah',
        cell: ({ row }) => formatRupiah(row.original.jumlah),
    },
    {
        id: 'bulan',
        header: 'Bulan',
        cell: ({ row }) => {
            const tanggal = new Date(
                `${row.original.tanggal}T00:00:00`,
            );

            return tanggal.toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric',
            });
        },
    },
    {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
            <PindahBulanSimpanan
                simpananId={row.original.id}
                tanggal={row.original.tanggal}
                bulanTersedia={row.original.bulan_tersedia}
            />
        ),
    },
];
