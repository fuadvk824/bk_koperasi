import { useRoute } from '@/lib/route';
import { useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Option {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
}

interface Props {
    close: () => void;
    offices: Option[];
    roles: Role[];
}

export default function FormCreate({
    close,
    offices,
}: Props) {
    const route = useRoute();

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        office_id: '',
        status: 'inactive',
        role: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('userManagement.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                close();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <Label>Nama</Label>
                <Input
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Masukkan nama"
                />
                {errors.name && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.name}
                    </p>
                )}
            </div>

            <div>
                <Label>Email</Label>
                <Input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="Masukkan email"
                />
                {errors.email && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.email}
                    </p>
                )}
            </div>

            <div>
                <Label>Office</Label>

                <Select
                    value={data.office_id}
                    onValueChange={(value) =>
                        setData('office_id', value)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih Office" />
                    </SelectTrigger>

                    <SelectContent>
                        {offices.map((office) => (
                            <SelectItem
                                key={office.id}
                                value={office.id.toString()}
                            >
                                {office.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {errors.office_id && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.office_id}
                    </p>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={close}
                >
                    Batal
                </Button>

                <Button
                    type="submit"
                    disabled={processing}
                >
                    {processing ? 'Menyimpan...' : 'Simpan'}
                </Button>
            </div>
        </form>
    );
}