import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

import { formatRupiah } from '@/lib/formatRupiah';

interface Props {
    userId: number;
    nama: string;
    sisaSimpanan: number;
}

export default function KeluarButton({ userId, nama, sisaSimpanan }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const { auth } = usePage().props as any;
    const trial = auth?.roles?.some((r: string) => r === 'trial-user');

    const handleSubmit = () => {
        setLoading(true);

        router.post(
            `/anggota/${userId}/keluar`,
            {},
            {
                preserveScroll: true,

                onFinish: () => setLoading(false),

                onSuccess: (page: any) => {
                    const flash = page.props.flash;

                    if (flash?.success) {
                        toast.success(flash.success);
                    }

                    if (flash?.error) {
                        toast.error(flash.error);
                    }

                    setOpen(false);
                },

                onError: () => {
                    toast.error('Terjadi kesalahan');
                },
            },
        );
    };

    return (
        <>
            <Button disabled={trial} variant="destructive" size="sm" onClick={() => setOpen(true)} className="cursor-pointer">
                Keluar
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Keluar</DialogTitle>

                        <DialogDescription asChild className="space-y-2">
                            <div className="space-y-2 text-sm text-muted-foreground">
                                {' '}
                                <p>
                                    Apakah kamu yakin ingin mengeluarkan <strong>{nama}</strong>?
                                </p>{' '}
                                {sisaSimpanan > 0 ? (
                                    <p className="text-bk-dev">
                                        {' '}
                                        Sisa simpanan yang akan diterima: {formatRupiah(sisaSimpanan)}{' '}
                                    </p>
                                ) : (
                                    <p className="text-yellow-300"> Simpanan tidak cukup untuk menutup pinjaman. </p>
                                )}{' '}
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Batal
                        </Button>

                        <Button variant="destructive" onClick={handleSubmit} disabled={loading || sisaSimpanan < 0}>
                            {loading ? 'Memproses...' : 'Ya, Keluarkan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
