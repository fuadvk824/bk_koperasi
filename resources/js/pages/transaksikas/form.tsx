import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { useRoute } from '@/lib/route';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatRupiah } from '@/lib/formatRupiah';
import { cn } from '@/lib/utils';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface Props {
    close: () => void;
    initialData?: any;
}

export default function Form({ close, initialData }: Props) {
    const route = useRoute();

    const initialState = {
        jumlah: initialData?.jumlah ?? '',
        jenis: initialData?.jenis ?? 'masuk',
        keterangan: initialData?.keterangan ?? '',
        tanggal: initialData?.tanggal ?? '',
    };

    const { data, setData, post, put, processing, reset } = useForm(initialState);
    const [errors, setErrors] = useState<any>({});

    const validate = () => {
        const newErrors: any = {};

        if (!data.jumlah || Number(data.jumlah) <= 0) newErrors.jumlah = 'Jumlah mutasi wajib diisi';
        if (!data.jenis) newErrors.jenis = 'Jenis wajib dipilih';
        if (!data.tanggal) newErrors.tanggal = 'Tanggal wajib diisi';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Mohon lengkapi semua data');
            return;
        }

        const options = {
            onSuccess: (page: any) => {
                const flash = page.props.flash;
                if (flash?.success) toast.success(flash.success);
                reset();
                close();
            },
        };

        post(route('transaksikas.store'), options);
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
                <Label>Jumlah Mutasi</Label>
                <Input
                    type="text"
                    value={formatRupiah(data.jumlah || 0)}
                    onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setData('jumlah', Number(raw));
                    }}
                    className={cn('text-xs', errors.jumlah && 'border-red-500')}
                />

                {errors.jumlah && <p className="text-xs text-red-500">{errors.jumlah}</p>}
            </div>
            <div className="space-y-2">
                <Label>Jenis</Label>
                <Select value={data.jenis} onValueChange={(v) => setData('jenis', v)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                        <SelectItem value="masuk">Masuk</SelectItem>
                        <SelectItem value="keluar">Keluar</SelectItem>
                    </SelectContent>
                </Select>
                {errors.jenis && <p className="text-xs text-red-500">{errors.jenis}</p>}
            </div>

            <div className="space-y-2">
                <Label>Keterangan</Label>
                <Textarea
                    value={data.keterangan}
                    onChange={(e) => setData('keterangan', e.target.value)}
                    placeholder="Masukkan keterangan..."
                    className={cn('text-xs', errors.keterangan && 'border-red-500')}
                />

                {errors.keterangan && <p className="text-xs text-red-500">{errors.keterangan}</p>}
            </div>

            <div className="space-y-2">
                <Label>Tanggal</Label>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                'w-full justify-start text-left text-xs',
                                !data.tanggal && 'text-muted-foreground',
                                errors.tanggal && 'border-red-500',
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {data.tanggal ? format(new Date(data.tanggal), 'yyyy-MM-dd') : 'Pilih tanggal'}
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={data.tanggal ? new Date(data.tanggal) : undefined}
                            onSelect={(date) => setData('tanggal', date ? format(date, 'yyyy-MM-dd') : '')}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {errors.tanggal && <p className="text-xs text-red-500">{errors.tanggal}</p>}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={close} className="cursor-pointer">
                    Batal
                </Button>
                <Button type="submit" disabled={processing} className="cursor-pointer">
                    Simpan
                </Button>
            </DialogFooter>
        </form>
    );
}
