import { ColumnDef } from '@tanstack/react-table';
import { router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { BookmarkCheck, BookmarkX } from 'lucide-react';
import { format } from 'date-fns';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Angsuran } from '@/types/custom/angsuran';
import { useRoute } from '@/lib/route';
import { formatRupiah } from '@/lib/formatRupiah';

function ImagePreview({ image }: { image: string }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <img
                src={image}
                alt="Bukti Transfer"
                loading="lazy"
                decoding="async"
                onClick={() => setOpen(true)}
                className="h-16 w-16 cursor-zoom-in rounded-md border object-cover"
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl p-2">
                    <DialogTitle className="sr-only">Preview Bukti Transfer</DialogTitle>

                    <DialogDescription className="sr-only">Gambar bukti pembayaran angsuran.</DialogDescription>

                    <img src={image} alt="Bukti Transfer" className="max-h-[85vh] w-full object-contain" />
                </DialogContent>
            </Dialog>
        </>
    );
}

const ActionCell = ({ angsuran }: { angsuran: Angsuran }) => {
    const route = useRoute();
    const { auth } = usePage().props as any;
    const trial = auth?.roles?.some((r: string) => r === 'trial-user');

    const [isCustom, setIsCustom] = useState(false);

    const [nominal, setNominal] = useState<number>(Math.floor(Number(angsuran.jumlah_bayar)));

    const [error, setError] = useState<string | null>(null);

    const [tanggalBayar, setTanggalBayar] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [catatan, setCatatan] = useState('');

    const kelipatan = Math.floor(nominal / Number(angsuran.jumlah_bayar));

    const sisa = nominal % Number(angsuran.jumlah_bayar);

    const sudahBayar = angsuran.status === 'sudah_bayar';

    const ditolak = angsuran.status_approval === 'ditolak';

    const lastInstallmentBlocked = angsuran.is_last_installment && angsuran.has_unpaid_previous;

    useEffect(() => {
        if (!isCustom) {
            setError(null);
            return;
        }

        if (!nominal || nominal < Number(angsuran.jumlah_bayar)) {
            setError(`Nominal harus lebih dari ${formatRupiah(Number(angsuran.jumlah_bayar))}`);
        } else {
            setError(null);
        }
    }, [nominal, isCustom, angsuran.jumlah_bayar]);

    const handleFlash = (page: any) => {
        const flash = page.props.flash as {
            success?: string;
            error?: string;
        };

        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    };

    const handleUpdate = () => {
        if (error || !tanggalBayar) return;

        router.patch(
            route('angsuran.updateStatus', {
                angsuran: angsuran.id,
            }),
            {
                status: 'sudah_bayar',
                nominal_bayar: isCustom ? nominal : Number(angsuran.jumlah_bayar),
                tanggal_bayar: tanggalBayar,
            },
            {
                preserveScroll: true,
                onSuccess: handleFlash,
            },
        );
    };

    const handleReject = () => {
        if (!catatan.trim()) return;

        router.patch(
            route('angsuran.reject', {
                angsuran: angsuran.id,
            }),
            {
                catatan_approval: catatan,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    handleFlash(page);
                    setCatatan('');
                },
            },
        );
    };

    return (
        <div className="flex items-center gap-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        className="cursor-pointer hover:scale-105"
                        disabled={sudahBayar || trial || lastInstallmentBlocked}
                        title={lastInstallmentBlocked ? 'Lunasi angsuran sebelumnya terlebih dahulu.' : ''}
                    >
                        <BookmarkCheck />
                        Approve
                    </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve angsuran</AlertDialogTitle>

                        <AlertDialogDescription>
                            Centang opsi di bawah ini jika pembayaran lebih dari nominal angsuran.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {/* Tanggal Pembayaran */}
                    <div className="space-y-2">
                        <label htmlFor={`tanggal-bayar-${angsuran.id}`} className="text-xs font-medium">
                            Tanggal Pembayaran Sebenarnya
                        </label>

                        <Input
                            id={`tanggal-bayar-${angsuran.id}`}
                            type="date"
                            value={tanggalBayar}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            onChange={(e) => setTanggalBayar(e.target.value)}
                            required
                        />

                        <p className="text-xs text-muted-foreground">
                            Pilih tanggal anggota benar-benar membayar, bukan tanggal admin melakukan approve.
                        </p>
                    </div>

                    {/* Custom Nominal */}
                    <div className="space-y-3">
                        <label className="flex cursor-pointer items-center gap-2 text-xs">
                            <input
                                type="checkbox"
                                checked={isCustom}
                                onChange={() => {
                                    const next = !isCustom;

                                    setIsCustom(next);

                                    setNominal(next ? 0 : Number(angsuran.jumlah_bayar));
                                }}
                            />
                            Bayar lebih (custom)
                        </label>

                        {isCustom && (
                            <div>
                                <Input
                                    type="text"
                                    placeholder="Masukkan nominal"
                                    value={nominal ? formatRupiah(nominal) : ''}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9]/g, '');

                                        setNominal(Number(raw));
                                    }}
                                    className="text-xs"
                                />

                                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

                                {!error && nominal > Number(angsuran.jumlah_bayar) && (
                                    <p className="mt-1 text-xs text-green-600">
                                        Terbayar {kelipatan}x angsuran. Kelebihan {formatRupiah(sisa)} akan masuk ke simpanan
                                        sukarela.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>

                        <AlertDialogAction
                            className="bg-green-600"
                            onClick={handleUpdate}
                            disabled={!!error || !tanggalBayar}
                        >
                            <BookmarkCheck />
                            Approve
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* REJECT */}
            <AlertDialog onOpenChange={(open) => !open && setCatatan('')}>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="destructive"
                        className="cursor-pointer hover:scale-105"
                        disabled={sudahBayar || ditolak || trial}
                    >
                        <BookmarkX />
                        Reject
                    </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tolak angsuran</AlertDialogTitle>

                        <AlertDialogDescription>
                            Status pengajuan akan menjadi "ditolak". Isi alasan penolakan di bawah ini.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {/* Catatan Penolakan */}
                    <div className="space-y-2">
                        <label htmlFor={`catatan-${angsuran.id}`} className="text-sm font-medium">
                            Catatan penolakan
                        </label>

                        <Textarea
                            id={`catatan-${angsuran.id}`}
                            placeholder="Contoh: bukti pembayaran tidak valid"
                            value={catatan}
                            maxLength={255}
                            onChange={(e) => setCatatan(e.target.value)}
                        />

                        <p className="text-right text-xs text-muted-foreground">{catatan.length}/255</p>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>

                        <AlertDialogAction className="bg-red-600" onClick={handleReject} disabled={!catatan.trim()}>
                            <BookmarkX />
                            Reject
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

// export const columnAngsuran = (): ColumnDef<Angsuran>[] => [
export const columnAngsuran = (trial: boolean): ColumnDef<Angsuran>[] => [
    {
        id: 'nomor',
        header: () => <div className="flex w-10! items-center justify-center">No.</div>,
        cell: ({ row }) => <div className="w-10! text-center">{row.index + 1}.</div>,
    },
    {
        accessorKey: 'nama_user',
        header: 'Nama',
    },

    {
        accessorKey: 'bukti_transfer',
        header: 'Bukti Transfer',
        cell: ({ row }) => {
            const image = row.original.bukti_transfer;

            if (!image) return '-';

            return <ImagePreview image={image} />;
        },
    },
    {
        accessorKey: 'periode',
        header: 'Periode',
    },
    {
        accessorKey: 'angsuran_ke',
        header: 'Cicilan Ke',
    },
    {
        accessorKey: 'jumlah_bayar',
        header: 'Nominal Angsuran',
        cell: ({ row }) => formatRupiah(row.original.jumlah_bayar),
    },
    {
        accessorKey: 'real_bayar',
        header: 'Nominal Bayar',
        cell: ({ row }) => formatRupiah(row.original.real_bayar),
    },

    {
        accessorKey: 'tanggal_bayar',
        header: 'Tanggal',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as string;

            return (
                <span
                    className={`rounded-lg px-2 py-1 text-xs text-black ${
                        status === 'sudah_bayar' ? 'bg-green-300' : 'bg-yellow-300'
                    }`}
                >
                    {status}
                </span>
            );
        },
    },
    {
        accessorKey: 'status_approval',
        header: 'Status Pengajuan',
        cell: ({ row }) => {
            const statusApproval = row.getValue('status_approval') as string;

            const statusClass: Record<string, string> = {
                disetujui: 'bg-green-300',
                menunggu: 'bg-yellow-300',
                ditolak: 'bg-red-300',
                belum_diajukan: 'bg-gray-300',
            };

            return (
                <span
                    className={`rounded-lg px-2 py-1 text-xs text-black ${statusClass[statusApproval] ?? 'bg-yellow-300'}`}
                >
                    {statusApproval}
                </span>
            );
        },
    },
    // {
    //     id: 'actions',
    //     header: 'Actions',
    //     cell: ({ row }) => <ActionCell angsuran={row.original} />,
    // },
    ...(!trial
        ? [
              {
                  id: 'aksi',
                  header: 'Aksi',
                  cell: ({ row }) => <ActionCell angsuran={row.original} />,
              } satisfies ColumnDef<Angsuran>,
          ]
        : []),
];
