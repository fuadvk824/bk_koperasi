import { useForm } from '@inertiajs/react';
import { useRoute } from '@/lib/route';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatRupiah } from '@/lib/formatRupiah';

interface Props {
    close: () => void;
    initialData: {
        simpanan_wajib: number | string;
        bunga_pinjaman: number | string;
    };
}

export default function FormPengaturan({ close, initialData }: Props) {
    const route = useRoute();

    const { data, setData, put, processing, errors } = useForm({
        simpanan_wajib: String(initialData.simpanan_wajib ?? 0),
        bunga_pinjaman: String(initialData.bunga_pinjaman ?? 0),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        put(route('userManagement.pengaturanKoperasi.update'), {
            onSuccess: () => close(),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="simpanan_wajib">Simpanan Wajib (Rp)</Label>

                <Input
                    id="simpanan_wajib"
                    type="text"
                    value={formatRupiah(data.simpanan_wajib || 0)}
                    onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');

                        setData('simpanan_wajib', raw);
                    }}
                    className={cn('text-xs', errors.simpanan_wajib && 'border-red-500')}
                    required
                />

                {errors.simpanan_wajib && <p className="text-sm text-red-500">{errors.simpanan_wajib}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="bunga_pinjaman">Bunga Pinjaman (%)</Label>

                <Input
                    id="bunga_pinjaman"
                    type="number"
                    min="0"
                    max="999.99"
                    step="0.01"
                    value={data.bunga_pinjaman}
                    onChange={(e) => setData('bunga_pinjaman', e.target.value)}
                    required
                />

                {errors.bunga_pinjaman && <p className="text-sm text-red-500">{errors.bunga_pinjaman}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={close} disabled={processing}>
                    Batal
                </Button>

                <Button type="submit" disabled={processing}>
                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
            </div>
        </form>
    );
}
