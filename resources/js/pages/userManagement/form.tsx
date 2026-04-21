import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoute } from '@/lib/route';
import { cn } from '@/lib/utils';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';

interface Props {
    close: () => void;
    initialData?: any;
    offices: any[];
    roles: any[];
    isSuperAdmin: boolean;
}

export default function Form({ close, initialData, offices, roles, isSuperAdmin }: Props) {
    const route = useRoute();
    const isEdit = !!initialData;

    const initialState = {
        office_id: initialData?.office?.id?.toString() ?? '',
        status: initialData?.status ?? 'inactive',
        role: initialData?.roles?.[0]?.name ?? '',
    };

    const { data, setData, put, processing } = useForm(initialState);
    const [errors, setErrors] = useState<any>({});

    const selectedUser = offices.find((u) => u.id === data.office_id);

    const isDataChanged = () => {
        return (
            String(data.office_id) !== String(initialState.office_id) ||
            String(data.status) !== String(initialState.status) ||
            String(data.role) !== String(initialState.role)
        );
    };

    const validate = () => {
        const newErrors: any = {};

        if (!data.office_id) newErrors.office_id = 'Office wajib dipilih';
        if (!data.status) newErrors.status = 'Status wajib dipilih';
        if (!data.role) newErrors.role = 'Role wajib dipilih';

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

        put(route('userManagement.update', initialData.id), {
            onSuccess: (page: any) => {
                const flash = page.props.flash;
                if (flash?.success) toast.success(flash.success);
                close();
            },
            onError: (errs: any) => {
                setErrors(errs);
                toast.error('Terjadi kesalahan pada form');
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
                <Label>Office</Label>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn('w-full justify-between', errors.office_id && 'border-red-500')}
                        >
                            {selectedUser?.name ?? initialData?.office?.name ?? '-- Pilih Office --'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-full p-0" align="start" onWheel={(e) => e.stopPropagation()}>
                        <Command>
                            <CommandInput placeholder="Cari office..." />
                            <CommandEmpty>Office tidak ditemukan</CommandEmpty>

                            <CommandGroup className="max-h-60 overflow-y-auto">
                                {offices.map((office) => (
                                    <CommandItem key={office.id} onSelect={() => setData('office_id', office.id)}>
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                data.office_id === office.id ? 'opacity-100' : 'opacity-0',
                                            )}
                                        />
                                        {office.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>

                {errors.office_id && <p className="text-xs text-red-500">{errors.office_id}</p>}
            </div>

            <div className="space-y-2">
                <Label>Status</Label>

                <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                    <SelectTrigger className={cn(errors.status && 'border-red-500')}>
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent align="start">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>

                {errors.status && <p className="text-xs text-red-500">{errors.status}</p>}
            </div>

            {isSuperAdmin && (
                <div className="space-y-2">
                    <Label>Role</Label>

                    <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                        <SelectTrigger className={cn(errors.role && 'border-red-500')}>
                            <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>

                        <SelectContent align="start">
                            {roles.map((role) => (
                                <SelectItem key={role.name} value={role.name}>
                                    {role.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
                </div>
            )}

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
