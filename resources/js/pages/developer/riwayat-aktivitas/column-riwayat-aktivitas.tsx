
import type { ColumnDef } from '@tanstack/react-table';
import type { RiwayatAktivitas } from '@/types/custom/riwayat-aktivitas';

export const columnRiwayatAktivitas: ColumnDef<RiwayatAktivitas>[] = [
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
        accessorKey: 'tanggal_simpanan',
        header: 'Simpanan',
        cell: ({ row }) => row.original.tanggal_simpanan ?? '-',
    },
    {
        accessorKey: 'tanggal_pinjaman',
        header: 'Pinjaman',
        cell: ({ row }) => row.original.tanggal_pinjaman ?? '-',
    },
    {
        accessorKey: 'tanggal_transaksi_kas',
        header: 'Transaksi Kas',
        cell: ({ row }) => row.original.tanggal_transaksi_kas ?? '-',
    },
    {
        accessorKey: 'tandai',
        header: 'Tandai',
        cell: ({ row }) => (
            <span className="font-semibold text-red-600">
                {row.original.tandai}
            </span>
        ),
    },
];
