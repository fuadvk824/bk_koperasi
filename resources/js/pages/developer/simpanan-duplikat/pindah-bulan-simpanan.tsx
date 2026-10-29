
import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { CalendarClock, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import type { BulanTersedia } from '@/types/custom/simpanan-duplikat';

interface Props {
    simpananId: number;
    tanggal: string;
    bulanTersedia: BulanTersedia[];
}

export default function PindahBulanSimpanan({
    simpananId,
    tanggal,
    bulanTersedia,
}: Props) {
    const [open, setOpen] = useState(false);

    const {
        data,
        setData,
        patch,
        processing,
        errors,
        reset,
    } = useForm<{ bulan: string }>({
        bulan: '',
    });

    const tanggalFormat = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${tanggal.slice(0, 10)}T00:00:00Z`));

    function simpanPerubahan() {
        if (!data.bulan || processing) return;

        patch(
            `/simpanan-duplikat/${simpananId}/pindah-bulan`,
            {
                preserveScroll: true,

                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            },
        );
    }

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
            >
                <CalendarClock className="mr-2 h-4 w-4" />
                Pindah Bulan
            </Button>

            <Dialog
                open={open}
                onOpenChange={(value) => {
                    if (processing) return;

                    setOpen(value);

                    if (!value) {
                        reset();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Pindahkan Bulan Simpanan
                        </DialogTitle>

                        <DialogDescription>
                            Pilih bulan yang belum memiliki data simpanan
                            milik anggota ini pada tahun yang sama.
                            Tanggal transaksi kas terkait juga akan diperbarui.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-md border p-3">
                            <p className="text-sm text-muted-foreground">
                                Tanggal simpanan saat ini
                            </p>

                            <p className="font-medium">
                                {tanggalFormat}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Bulan tujuan
                            </label>

                            <Select
                                value={data.bulan}
                                onValueChange={(value) => {
                                    setData('bulan', value);
                                }}
                                disabled={
                                    processing ||
                                    bulanTersedia.length === 0
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih bulan tujuan" />
                                </SelectTrigger>

                                <SelectContent>
                                    {bulanTersedia.map((item) => (
                                        <SelectItem
                                            key={item.bulan}
                                            value={String(item.bulan)}
                                        >
                                            {item.nama} {item.tahun}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {errors.bulan && (
                                <p className="text-sm text-destructive">
                                    {errors.bulan}
                                </p>
                            )}
                        </div>

                        {bulanTersedia.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Tidak ada bulan kosong yang tersedia
                                pada tahun ini.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={processing}
                            onClick={() => setOpen(false)}
                        >
                            Batal
                        </Button>

                        <Button
                            type="button"
                            disabled={
                                processing ||
                                !data.bulan ||
                                bulanTersedia.length === 0
                            }
                            onClick={simpanPerubahan}
                        >
                            {processing && (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            )}

                            Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
