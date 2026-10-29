
import type { ColumnDef } from '@tanstack/react-table';
import type { AnggotaBelumBayar } from '@/types/custom/simpanan-duplikat';

export const columnAnggotaBelumBayar: ColumnDef<AnggotaBelumBayar>[] = [
    {
        id: 'nomor',
        header: 'No.',
        cell: ({ row }) => row.index + 1,
    },
    {
        accessorKey: 'name',
        header: 'Nama Anggota',
    },
    {
        accessorKey: 'active_at',
        header: 'Tanggal Aktivasi',
        cell: ({ row }) => {
            const tanggal = row.original.active_at;

            if (!tanggal) return '-';

            return new Date(`${tanggal.slice(0, 10)}T00:00:00`)
                .toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                });
        },
    },
];
