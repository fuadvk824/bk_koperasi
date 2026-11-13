import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Download } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { useRoute } from '@/lib/route';

interface Props {
    pinjaman: {
        id: number;
        name: string;
        jumlah_pinjaman: number;
        pdf_url: string | null;
    };
}

export default function PinjamanPdf({ pinjaman }: Props) {
    const route = useRoute();
    const handleBack = () => {
        router.get(route('pinjaman.approval.index'));
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Pinjaman',
                    href: route('pinjaman.approval.index'),
                },
                {
                    title: 'Preview Surat Pengajuan',
                    href: route('pinjaman.pdf', {
                        pinjaman: pinjaman.id,
                    }),
                },
            ]}
        >
            <Head title={`Surat Pengajuan - ${pinjaman.name}`} />

            <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold">Preview Surat Pengajuan</h1>
                        <p className="truncate text-sm text-muted-foreground">{pinjaman.name}</p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>

                        {pinjaman.pdf_url && (
                            <Button asChild>
                                <a href={pinjaman.pdf_url} download>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PDF
                                </a>
                            </Button>
                        )}
                    </div>
                </div>

                {pinjaman.pdf_url ? (
                    <div className="overflow-hidden rounded-xl border">
                        <iframe
                            src={pinjaman.pdf_url}
                            title={`PDF Pengajuan ${pinjaman.name}`}
                            className="h-[800px] w-full"
                        />
                    </div>
                ) : (
                    <div className="rounded-xl border p-8 text-center">
                        <p className="font-medium">PDF belum tersedia</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
