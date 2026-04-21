import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoute } from '@/lib/route';
import { formatRupiah } from '@/lib/formatRupiah';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"

interface Props {
    close: () => void;
    initialData?: any;
    users: { id: number; name: string }[];
}

export default function Form({ close, initialData, users }: Props) {
    const route = useRoute();
    const isEdit = !!initialData;

    const initialState = {
        user_id: initialData?.user_id?.toString() ?? '',
        jenis: initialData?.jenis ?? 'wajib',
        jumlah: initialData?.jumlah ?? '',
        tanggal: initialData?.tanggal ?? '',
    };

    const { data, setData, post, put, processing, reset } = useForm(initialState);

    const [errors, setErrors] = useState<any>({});

    const selectedUser = users.find((u) => u.id === Number(data.user_id));

    const isDataChanged = () => {
        return (
            String(data.user_id) !== String(initialState.user_id) ||
            String(data.jenis) !== String(initialState.jenis) ||
            Number(data.jumlah) !== Number(initialState.jumlah) ||
            String(data.tanggal) !== String(initialState.tanggal)
        );
    };

    const validate = () => {
        const newErrors: any = {};

        if (!data.user_id) newErrors.user_id = 'User wajib dipilih';
        if (!data.jenis) newErrors.jenis = 'Jenis wajib dipilih';
        if (!data.jumlah || Number(data.jumlah) <= 0) newErrors.jumlah = 'Jumlah simpanan wajib diisi';
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

        if (isEdit && !isDataChanged()) {
            toast.warning('Belum ada perubahan data');
            return;
        }

        const options = {
            onSuccess: (page: any) => {
                const flash = page.props.flash;
                if (flash?.success) toast.success(flash.success);
                reset();
                close();
            },
            onError: (errs: any) => {
                setErrors(errs);
                toast.error('Terjadi kesalahan pada form');
            },
        };

        isEdit ? put(route('simpanan.update', initialData.id), options) : post(route('simpanan.store'), options);
    };

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
                                <CommandInput placeholder="Cari user..." />
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
                <Label>Jenis</Label>

                <Select value={data.jenis} onValueChange={(value) => setData('jenis', value)}>
                    <SelectTrigger className={cn(errors.jenis && 'border-red-500')}>
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent align='start'>
                        <SelectItem value="wajib">Wajib</SelectItem>
                        <SelectItem value="sukarela">Sukarela</SelectItem>
                        <SelectItem value="modal">Modal</SelectItem>
                    </SelectContent>
                </Select>

                {errors.jenis && <p className="text-xs text-red-500">{errors.jenis}</p>}
            </div>

            <div className="space-y-2">
                <Label>Jumlah Simpanan</Label>

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

                    <PopoverContent className="w-auto p-0" align='start'>
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
                <Button type="button" variant="outline" onClick={close} className='cursor-pointer'>
                    Batal
                </Button>
                <Button type="submit" disabled={processing} className='cursor-pointer'>
                    Simpan
                </Button>
            </DialogFooter>
        </form>
    );
}
