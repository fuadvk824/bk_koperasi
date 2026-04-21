import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';

import { useRoute } from '@/lib/route';
import { formatRupiah } from '@/lib/formatRupiah';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface User {
    id: number;
    name: string;
}

interface Props {
    close: () => void;
    initialData?: any;
    users: User[];
}

export default function Form({ close, initialData, users }: Props) {
    const route = useRoute();
    const isEdit = !!initialData;

    const initialState = {
        user_id: initialData?.user.id?.toString() ?? '',
        jumlah_pinjaman: initialData?.jumlah_pinjaman ?? '',
        bunga_persen: initialData?.bunga_persen ?? '',
        lama_angsuran: initialData?.lama_angsuran ?? '',
        tanggal_pinjaman: initialData?.tanggal_pinjaman ?? '',
    };

    const { data, setData, post, put, processing, reset } = useForm(initialState);

    const isDataChanged = () => {
        return (
            String(data.user_id) !== String(initialState.user_id) ||
            Number(data.jumlah_pinjaman) !== Number(initialState.jumlah_pinjaman) ||
            parseFloat(data.bunga_persen as any) !== parseFloat(initialState.bunga_persen as any) ||
            Number(data.lama_angsuran) !== Number(initialState.lama_angsuran) ||
            String(data.tanggal_pinjaman) !== String(initialState.tanggal_pinjaman)
        );
    };

    const [errors, setErrors] = useState<any>({});

    const [preview, setPreview] = useState({
        total: 0,
        angsuran: 0,
    });

    useEffect(() => {
        const jumlah = Number(data.jumlah_pinjaman) || 0;
        const bungaPersen = parseFloat(data.bunga_persen as any) || 0;
        const lama = Number(data.lama_angsuran) || 1;

        const bunga = (jumlah * bungaPersen) / 100;
        const total = jumlah + bunga;
        const angsuran = lama > 0 ? total / lama : 0;

        setPreview({ total, angsuran });
    }, [data]);

    const validate = () => {
        const newErrors: any = {};

        if (!data.user_id) newErrors.user_id = 'Anggota wajib dipilih';
        if (!data.jumlah_pinjaman || Number(data.jumlah_pinjaman) <= 0)
            newErrors.jumlah_pinjaman = 'Jumlah pinjaman wajib diisi';
        if (!data.bunga_persen) newErrors.bunga_persen = 'Bunga wajib diisi';
        if (!data.lama_angsuran || Number(data.lama_angsuran) <= 0) newErrors.lama_angsuran = 'Lama angsuran wajib diisi';
        if (!data.tanggal_pinjaman) newErrors.tanggal_pinjaman = 'Tanggal wajib diisi';

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Mohon lengkapi semua data');
            return;
        }
        if (isEdit && !isDataChanged()) {
            toast.warning('Belum ada perubahan data');
            return;
        }

        const options = {
            onSuccess: () => {
                toast.success('Data berhasil disimpan');
                close();
                reset();
            },
        };

        isEdit ? put(route('pinjaman.update', initialData.id), options) : post(route('pinjaman.store'), options);
    };

    const selectedUser = users.find((u) => u.id === Number(data.user_id));

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
                <Label>User</Label>

                {isEdit ? (
                    <div className="rounded-md border bg-muted px-3 py-2">{selectedUser?.name ?? '-'}</div>
                ) : (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn('w-full justify-between', errors.user_id && 'border-red-500')}
                            >
                                {selectedUser ? selectedUser.name : '-- Pilih Anggota --'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-full p-0" align="start" onWheel={(e) => e.stopPropagation()}>
                            <Command>
                                <CommandInput placeholder="Cari anggota..." />
                                <CommandEmpty>Anggota tidak ditemukan</CommandEmpty>
                                <CommandGroup className="max-h-60 overflow-y-auto">
                                    {users.map((user) => (
                                        <CommandItem key={user.id} onSelect={() => setData('user_id', user.id.toString())}>
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    data.user_id === user.id.toString() ? 'opacity-100' : 'opacity-0',
                                                )}
                                            />
                                            {user.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}

                {errors.user_id && <p className="text-xs text-red-500">{errors.user_id}</p>}
            </div>

            <div className="space-y-2">
                <Label>Jumlah Pinjaman</Label>
                <Input
                    type="text"
                    value={formatRupiah(data.jumlah_pinjaman || 0)}
                    onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setData('jumlah_pinjaman', Number(raw));
                    }}
                    className={cn('text-xs', errors.jumlah_pinjaman && 'border-red-500')}
                />
                {errors.jumlah_pinjaman && <p className="text-xs text-red-500">{errors.jumlah_pinjaman}</p>}
            </div>

            <div className="space-y-2">
                <Label>Bunga (%)</Label>
                <Input
                    type="text"
                    value={data.bunga_persen}
                    onChange={(e) => {
                        let value = e.target.value.replace(/[^0-9.,]/g, '');
                        setData('bunga_persen', value.replace(',', '.'));
                    }}
                    className={cn('text-xs', errors.bunga_persen && 'border-red-500')}
                />
                {errors.bunga_persen && <p className="text-xs text-red-500">{errors.bunga_persen}</p>}
            </div>

            <div className="space-y-2">
                <Label>Lama Angsuran</Label>
                <Input
                    type="number"
                    value={data.lama_angsuran}
                    onChange={(e) => setData('lama_angsuran', Number(e.target.value))}
                    className={cn('text-xs', errors.lama_angsuran && 'border-red-500')}
                />
                {errors.lama_angsuran && <p className="text-xs text-red-500">{errors.lama_angsuran}</p>}
            </div>

            <div className="space-y-2">
                <Label>Tanggal</Label>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                'w-full justify-start text-left text-xs',
                                !data.tanggal_pinjaman && 'text-muted-foreground',
                                errors.tanggal_pinjaman && 'border-red-500',
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {data.tanggal_pinjaman ? format(new Date(data.tanggal_pinjaman), 'yyyy-MM-dd') : 'Pilih tanggal'}
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" align='start'>
                        <Calendar
                            mode="single"
                            selected={data.tanggal_pinjaman ? new Date(data.tanggal_pinjaman) : undefined}
                            onSelect={(date) => setData('tanggal_pinjaman', date ? format(date, 'yyyy-MM-dd') : '')}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {errors.tanggal_pinjaman && <p className="text-xs text-red-500">{errors.tanggal_pinjaman}</p>}
            </div>

            <div className="space-y-1 rounded-lg border bg-muted p-4 text-xs">
                <p>Total: {preview.total.toLocaleString('id-ID')}</p>
                <p>Angsuran: {preview.angsuran.toLocaleString('id-ID')}</p>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={close}>
                    Batal
                </Button>
                <Button type="submit" disabled={processing}>
                    Simpan
                </Button>
            </DialogFooter>
        </form>
    );
}
