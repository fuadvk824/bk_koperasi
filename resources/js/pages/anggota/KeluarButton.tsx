import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

import { formatRupiah } from '@/lib/formatRupiah';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Props {
    userId: number;
    nama: string;
    sisaSimpanan: number;
    status: string;
}

export default function KeluarButton({
    userId,
    nama,
    sisaSimpanan,
    status,
}: Props) {
    // kode lainnya tetap seperti sebelumnya
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inactiveAt, setInactiveAt] = useState('');

    const { auth } = usePage().props as any;
    const trial = auth?.roles?.some((r: string) => r === 'trial-user');

    const handleSubmit = () => {
        if (!inactiveAt) {
            toast.error('Tanggal keluar wajib diisi');
            return;
        }

        setLoading(true);

        router.post(
            `/anggota/${userId}/keluar`,
            {
                inactive_at: inactiveAt,
            },
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
                    setInactiveAt('');
                },

                onError: (errors) => {
                    if (errors.inactive_at) {
                        toast.error(errors.inactive_at);
                    } else {
                        toast.error('Terjadi kesalahan');
                    }
                },
            },
        );
    };

    return (
        <>
            <Button
    disabled={trial || status === 'inactive'}
    variant="destructive"
    size="sm"
    onClick={() => {
        setInactiveAt('');
        setOpen(true);
    }}
    className="cursor-pointer"
>
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
                                        Sisa simpanan yang akan diterima: {formatRupiah(sisaSimpanan)}
                                    </p>
                                ) : sisaSimpanan < 0 ? (
                                    <p className="text-red-500">
                                        Simpanan tidak cukup untuk menutup pinjaman. Lunasi terlebih dahulu sisa pinjaman
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground">Tidak ada sisa simpanan yang diterima.</p>
                                )}
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="inactive_at">Tanggal Keluar</Label>

                        <Input
                            id="inactive_at"
                            type="date"
                            value={inactiveAt}
                            onChange={(e) => setInactiveAt(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

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
