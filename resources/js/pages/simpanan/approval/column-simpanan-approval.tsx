import { useState } from 'react';
import { router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { formatRupiah } from '@/lib/formatRupiah';
import { Simpanan } from '@/types/custom/simpanan';

function SimpananAction({ simpanan }: { simpanan: Simpanan }) {
    const [open, setOpen] = useState(false);
    const [statusTujuan, setStatusTujuan] = useState<'disetujui' | 'ditolak' | null>(null);
    const [processing, setProcessing] = useState(false);
    const isApprove = statusTujuan === 'disetujui';

    const handleOpenDialog = (status: 'disetujui' | 'ditolak') => {
        setStatusTujuan(status);
        setOpen(true);
    };

    const handleUpdateStatus = () => {
        if (!statusTujuan || processing) return;

        setProcessing(true);

        router.patch(
            `/simpanan/${simpanan.id}/status`,
            {
                status: statusTujuan,
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    setOpen(false);
                },

                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    if (simpanan.status_approval !== 'menunggu') {
        return <span>Sudah diproses</span>;
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <Button type="button" size="sm" onClick={() => handleOpenDialog('disetujui')}>
                    Setujui
                </Button>

                <Button type="button" size="sm" variant="destructive" onClick={() => handleOpenDialog('ditolak')}>
                    Tolak
                </Button>
            </div>

            <AlertDialog
                open={open}
                onOpenChange={(value) => {
                    if (!processing) {
                        setOpen(value);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isApprove ? 'Setujui Pengajuan Simpanan?' : 'Tolak Pengajuan Simpanan?'}
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            {isApprove ? (
                                <>
                                    Apakah kamu yakin ingin menyetujui pengajuan simpanan dari{' '}
                                    <span className="font-semibold text-foreground">{simpanan.nama_user}</span> sebesar{' '}
                                    <span className="font-semibold text-foreground">{formatRupiah(simpanan.jumlah)}</span>?
                                    Pengajuan ini akan ditandai sebagai disetujui.
                                </>
                            ) : (
                                <>
                                    Apakah kamu yakin ingin menolak pengajuan simpanan dari{' '}
                                    <span className="font-semibold text-foreground">{simpanan.nama_user}</span> sebesar{' '}
                                    <span className="font-semibold text-foreground">{formatRupiah(simpanan.jumlah)}</span>?
                                    Pengajuan ini akan ditandai sebagai ditolak.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing}>Batal</AlertDialogCancel>

                        <AlertDialogAction
                            disabled={processing}
                            onClick={(event) => {
                                event.preventDefault();
                                handleUpdateStatus();
                            }}
                            className={isApprove ? '' : 'bg-destructive! text-white hover:bg-destructive/90!'}
                        >
                            {processing ? 'Memproses...' : isApprove ? 'Ya, Setujui' : 'Ya, Tolak'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function ImagePreview({ image }: { image: string }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <img
                src={image}
                alt="Bukti Transfer"
                loading="eager"
                decoding="async"
                onClick={() => setOpen(true)}
                className="h-16 w-16 cursor-zoom-in rounded-md border object-cover"
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl p-2">
                    <DialogTitle className="sr-only">
                        Preview Bukti Transfer
                        <DialogDescription></DialogDescription>
                    </DialogTitle>

                    <img src={image} alt="Bukti Transfer" className="max-h-[85vh] w-full object-contain" />
                </DialogContent>
            </Dialog>
        </>
    );
}

// export const columnSimpananApproval: ColumnDef<Simpanan>[] = [
export const columnSimpananApproval = (trial: boolean): ColumnDef<Simpanan>[] => [
    {
        id: 'nomor',
        header: () => <div className="flex w-10! items-center justify-center">No.</div>,
        cell: ({ row }) => <div className="w-10! text-center">{row.index + 1}.</div>,
    },
    {
        accessorKey: 'nama_user',
        header: 'Nama Anggota',
        cell: ({ row }) => <span className="font-medium">{row.original.nama_user}</span>,
    },
    {
        accessorKey: 'bukti_transfer',
        header: 'Bukti Transfer',
        cell: ({ row }) => {
            const image = row.getValue<string>('bukti_transfer');

            if (!image) return '-';

            return <ImagePreview image={image} />;
        },
    },
    {
        accessorKey: 'jenis',
        header: 'Jenis Simpanan',
        cell: ({ row }) => <span className="capitalize">{row.original.jenis}</span>,
    },
    {
        accessorKey: 'jumlah',
        header: 'Jumlah',
        cell: ({ row }) => <span className="font-medium">{formatRupiah(row.original.jumlah)}</span>,
    },
    {
        accessorKey: 'tanggal',
        header: 'Tanggal',
        cell: ({ row }) => row.original.tanggal,
    },
    {
        accessorKey: 'status_approval',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.status_approval;

            if (status === 'disetujui') {
                return <Badge className="bg-green-600 text-white hover:bg-green-600">Disetujui</Badge>;
            }

            if (status === 'ditolak') {
                return <Badge variant="destructive">Ditolak</Badge>;
            }

            return <Badge variant="secondary">Menunggu</Badge>;
        },
    },
    // {
    //     id: 'aksi',
    //     header: 'Aksi',
    //     cell: ({ row }) => <SimpananAction simpanan={row.original} />,
    // },
    ...(!trial
        ? [
              {
                  id: 'aksi',
                  header: 'Aksi',
                  cell: ({ row }) => <SimpananAction simpanan={row.original} />,
              } satisfies ColumnDef<Simpanan>,
          ]
        : []),
];
