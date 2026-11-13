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
import { Pinjaman } from '@/types/custom/pinjaman';
import { FileText } from 'lucide-react';
import { useRoute } from '@/lib/route';

function PinjamanAction({ pinjaman }: { pinjaman: Pinjaman }) {
    const [open, setOpen] = useState(false);
    const [statusTujuan, setStatusTujuan] = useState<'disetujui' | 'ditolak' | null>(null);
    const [processing, setProcessing] = useState(false);
    const isApprove = statusTujuan === 'disetujui';

    const handleOpenDialog = (status_approval: 'disetujui' | 'ditolak') => {
        setStatusTujuan(status_approval);
        setOpen(true);
    };

    const handleUpdateStatus = () => {
        if (!statusTujuan || processing) return;

        setProcessing(true);

        router.patch(
            `/pinjaman/${pinjaman.id}/status_approval`,
            {
                status_approval: statusTujuan,
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

    if (pinjaman.status_approval !== 'menunggu') {
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
                            {isApprove ? 'Setujui Pengajuan Pinjaman?' : 'Tolak Pengajuan Pinjaman?'}
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            {isApprove ? (
                                <>
                                    Apakah kamu yakin ingin menyetujui pengajuan pinjaman dari{' '}
                                    <span className="font-semibold text-foreground">{pinjaman.name}</span> sebesar{' '}
                                    <span className="font-semibold text-foreground">
                                        {formatRupiah(pinjaman.jumlah_pinjaman)}
                                    </span>
                                    ? Pengajuan ini akan ditandai sebagai disetujui.
                                </>
                            ) : (
                                <>
                                    Apakah kamu yakin ingin menolak pengajuan pinjaman dari{' '}
                                    <span className="font-semibold text-foreground">{pinjaman.name}</span> sebesar{' '}
                                    <span className="font-semibold text-foreground">
                                        {formatRupiah(pinjaman.jumlah_pinjaman)}
                                    </span>
                                    ? Pengajuan ini akan ditandai sebagai ditolak.
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

function FilePreview({ file, pinjamanId }: { file: string; pinjamanId: number }) {
    const route = useRoute();
    const [open, setOpen] = useState(false);

    if (!file) {
        return <span className="text-sm text-muted-foreground">Tidak ada file</span>;
    }

    const isPdf = /\.pdf(?:$|[?#])/i.test(file);

    if (isPdf) {
        return (
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                    (window.location.href = route('pinjaman.pdf', {
                        pinjaman: pinjamanId,
                    }))
                }
                className="cursor-pointer"
            >
                <FileText className="mr-2 h-4 w-4" />
                Lihat PDF
            </Button>
        );
    }

    return (
        <>
            <img
                src={file}
                alt="Surat Pengajuan"
                loading="lazy"
                decoding="async"
                onClick={() => setOpen(true)}
                className="h-16 w-16 cursor-zoom-in rounded-md border object-cover"
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-5xl p-2">
                    <DialogTitle className="sr-only">Preview Surat Pengajuan</DialogTitle>

                    <DialogDescription className="sr-only">Pratinjau gambar surat pengajuan pinjaman.</DialogDescription>

                    <img src={file} alt="Surat Pengajuan" className="max-h-[85vh] w-full object-contain" />
                </DialogContent>
            </Dialog>
        </>
    );
}

// export const columnPinjamanApproval: ColumnDef<Pinjaman>[] = [
export const columnPinjamanApproval = (trial: boolean): ColumnDef<Pinjaman>[] => [
    {
        id: 'nomor',
        header: () => <div className="flex w-10! items-center justify-center">No.</div>,
        cell: ({ row }) => <div className="w-10! text-center">{row.index + 1}.</div>,
    },
    {
        accessorKey: 'name',
        header: 'Nama Anggota',
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
        accessorKey: 'surat_pengajuan',
        header: 'Surat Pengajuan',
        cell: ({ row }) => {
            const file = row.getValue<string>('surat_pengajuan');

            if (!file) return '-';

            return <FilePreview file={file} pinjamanId={row.original.id} />;
        },
    },

    {
        accessorKey: 'tanggal_pinjaman',
        header: 'Tanggal Pinjaman',
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
        accessorKey: 'lama_angsuran',
        header: 'Lama Angsuran',
        cell: ({ row }) => {
            return `${row.original.lama_angsuran} X`;
        },
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
    //     cell: ({ row }) => <PinjamanAction pinjaman={row.original} />,
    // },
    ...(!trial
        ? [
              {
                  id: 'aksi',
                  header: 'Aksi',
                  cell: ({ row }) => <PinjamanAction pinjaman={row.original} />,
              } satisfies ColumnDef<Pinjaman>,
          ]
        : []),
];
