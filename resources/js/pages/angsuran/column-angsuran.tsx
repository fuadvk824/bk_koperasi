import { ColumnDef } from '@tanstack/react-table';
import { router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';

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

import { Button } from '@/components/ui/button';
import { Angsuran } from '@/types/custom/angsuran';
import { useRoute } from '@/lib/route';
import { formatRupiah } from '@/lib/formatRupiah';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { BookmarkCheck } from 'lucide-react';

const ActionCell = ({ angsuran }: { angsuran: Angsuran }) => {
    const route = useRoute();
    const { auth } = usePage().props as any;
    const trial = auth?.roles?.some((r: string) => r === 'trial-user');

    const [isCustom, setIsCustom] = useState(false);
    const [nominal, setNominal] = useState<number>(Math.floor(Number(angsuran.jumlah_bayar)));
    const [error, setError] = useState<string | null>(null);

    const kelipatan = Math.floor(nominal / angsuran.jumlah_bayar);
    const sisa = nominal % angsuran.jumlah_bayar;

    useEffect(() => {
        if (!isCustom) {
            setError(null);
            return;
        }

        if (!nominal || nominal < angsuran.jumlah_bayar) {
            setError(`Nominal harus lebih dari ${formatRupiah(Number(angsuran.jumlah_bayar))}`);
        } else {
            setError(null);
        }
    }, [nominal, isCustom, angsuran.jumlah_bayar]);

    const handleUpdate = () => {
        if (error) return;

        router.patch(
            route('angsuran.updateStatus', { angsuran: angsuran.id }),
            {
                status: 'sudah_bayar',
                nominal_bayar: isCustom ? nominal : angsuran.jumlah_bayar,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = page.props.flash as {
                        success?: string;
                        error?: string;
                    };

                    if (flash.success) toast.success(flash.success);
                    if (flash.error) toast.error(flash.error);
                },
            },
        );
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button className="cursor-pointer hover:scale-105" disabled={angsuran.status === 'sudah_bayar' || trial}>
                    <BookmarkCheck />
                    Approve
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Approve angsuran</AlertDialogTitle>
                    <AlertDialogDescription>
                        Centang opsi dibawah ini jika pembayaran lebih dari nominal angsuran
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-3">
                    <label className="flex cursor-pointer items-center gap-2 text-xs">
                        <input
                            type="checkbox"
                            checked={isCustom}
                            onChange={() => {
                                const next = !isCustom;
                                setIsCustom(next);

                                if (next) {
                                    setNominal(0);
                                } else {
                                    setNominal(Number(angsuran.jumlah_bayar));
                                }
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

                            {!error && nominal > angsuran.jumlah_bayar && (
                                <p className="mt-1 text-xs text-green-600">
                                    Terbayar {kelipatan}x angsuran. Kelebihan {formatRupiah(sisa)} akan masuk ke simpanan
                                    sukarela
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                    <AlertDialogAction className="bg-green-600" onClick={handleUpdate} disabled={!!error}>
                        <BookmarkCheck />
                        Approve
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ActionCell;

export const columnAngsuran = (): ColumnDef<Angsuran>[] => [
    {
        accessorKey: 'nama_user',
        header: 'Nama',
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
        accessorKey: 'dana_pinjaman',
        header: 'Dana Pinjaman',
        cell: ({ row }) => formatRupiah(row.original.dana_pinjaman),
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
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => <ActionCell angsuran={row.original} />,
    },
];
