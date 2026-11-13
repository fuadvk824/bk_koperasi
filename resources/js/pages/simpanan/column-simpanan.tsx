import { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';

import { formatRupiah } from '@/lib/formatRupiah';
import { Simpanan } from '@/types/custom/simpanan';


export const columnSimpanan: ColumnDef<Simpanan>[] = [
    {
        id: 'nomor',
        header: () => <div className="flex w-10! items-center justify-center">No.</div>,
        cell: ({ row }) => <div className="w-10! text-center">{row.index + 1}.</div>,
    },
    {
        accessorKey: 'nama_user',
        header: 'Nama Anggota',
        cell: ({ row }) => (
            <span className="font-medium">
                {row.original.nama_user}
            </span>
        ),
    },
    
    {
        accessorKey: 'jenis',
        header: 'Jenis Simpanan',
        cell: ({ row }) => (
            <span className="capitalize">
                {row.original.jenis}
            </span>
        ),
    },
    {
        accessorKey: 'jumlah',
        header: 'Jumlah',
        cell: ({ row }) => (
            <span className="font-medium">
                {formatRupiah(row.original.jumlah)}
            </span>
        ),
    },
    {
        accessorKey: 'tanggal',
        header: 'Tanggal',
        cell: ({ row }) =>  row.original.tanggal,
    },
    {
        accessorKey: 'status_approval',
        header: 'Status',
        cell: ({ row }) => {
            const status_approval = row.original.status_approval;

            if (status_approval === 'disetujui') {
                return (
                    <Badge className="bg-green-600 text-white hover:bg-green-600">
                        Disetujui
                    </Badge>
                );
            }

            if (status_approval === 'ditolak') {
                return (
                    <Badge variant="destructive">
                        Ditolak
                    </Badge>
                );
            }

            return (
                <Badge variant="secondary">
                    Menunggu
                </Badge>
            );
        },
    },
    
];