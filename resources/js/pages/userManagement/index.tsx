import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useRoute } from '@/lib/route';
import { useState } from 'react';

import type { VisibilityState } from '@tanstack/react-table';
import { DataTable } from '@/components/table/datatable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw, ScrollText, Settings, UserPlus } from 'lucide-react';

import { columnUser } from './column-user';
import { useTableActions } from '@/lib/useTableAction';
import type { PaginationMeta } from '@/types/custom/pagination';
import { Role, UserManagement } from '@/types/custom/usermanagement';
import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Form from './form';
import { ActivityLog } from '@/types/custom/activityLog';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import FormCreate from './form-create';
import FormPengaturan from './form-pengaturan';

interface Option {
    id: number;
    name: string;
}

interface Props {
    users: {
        data: UserManagement[];
        meta: PaginationMeta;
    };
    // filters: {
    //     search?: string;
    //     office_id?: number | string;
    //     status: string;
    //     perPage?: number;
    // };

    filters: {
        search?: string;
        office_id?: number | string;
        status?: string;
        bulan?: number | string;
        tahun?: number | string;
        perPage?: number;
    };
    roles: Role[];
    offices: Option[];
    totalAnggota: number;
    activityLogs: ActivityLog[];

    pengaturanKoperasi: {
        id: number;
        simpanan_wajib: number | string;
        bunga_pinjaman: number | string;
    };
}

const formatLog = (data: any) => {
    if (!data) return [];

    return Object.entries(data).map(([key, value]) => {
        const labelMap: Record<string, string> = {
            office_id: 'Office',
            status: 'Status',
            role_id: 'Role',
        };

        return {
            label: labelMap[key] ?? key,
            value: value,
        };
    });
};

export default function Index({ users, roles, filters, offices, totalAnggota, activityLogs, pengaturanKoperasi }: Props) {
    const route = useRoute();
    const { auth } = usePage().props as any;
    const isSuperAdmin = auth?.roles?.some((r: string) => r === 'super-admin');
    const isAdmin = auth?.roles?.some((r: string) => r === 'admin');

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [open, setOpen] = useState(false);
    const [open1, setOpen1] = useState(false);
    const [open2, setOpen2] = useState(false);
    const [openPengaturan, setOpenPengaturan] = useState(false);

    const [selected, setSelected] = useState<UserManagement | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const daftarBulan = [
        { value: '1', label: 'Januari' },
        { value: '2', label: 'Februari' },
        { value: '3', label: 'Maret' },
        { value: '4', label: 'April' },
        { value: '5', label: 'Mei' },
        { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' },
        { value: '8', label: 'Agustus' },
        { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' },
    ];

    const daftarTahun = Array.from({ length: new Date().getFullYear() - 2020 + 1 }, (_, i) =>
        String(new Date().getFullYear() - i),
    );
    // const [localFilters, setLocalFilters] = useState({
    //     search: filters.search ?? '',
    //     office_id: filters.office_id ?? '',
    //     status: filters.status ?? '',
    //     perPage: filters.perPage ?? 10,
    // });

    const [localFilters, setLocalFilters] = useState({
        search: filters.search ?? '',
        office_id: filters.office_id?.toString() ?? '',
        status: filters.status ?? '',
        bulan: String(filters.bulan ?? new Date().getMonth() + 1),
        tahun: String(filters.tahun ?? new Date().getFullYear()),
        perPage: filters.perPage ?? 10,
    });

    const { handleFilterChange } = useTableActions({
        filters: localFilters,
        indexRoute: 'userManagement.index',
        exportRoute: 'userManagement.export',
        allColumns: ['name', 'email', 'roles'],
    });

    // const handleResetFilters = () => {
    //     setIsRefreshing(true);
    //     setLocalFilters({ search: '', perPage: 10, office_id: '', status: '' });

    //     router.get(
    //         route('userManagement.index'),
    //         {},
    //         {
    //             replace: true,
    //             onFinish: () => setIsRefreshing(false),
    //         },
    //     );
    // };

    const handleResetFilters = () => {
        setIsRefreshing(true);

        router.get(
            route('userManagement.index'),
            {
                bulan: new Date().getMonth() + 1,
                tahun: new Date().getFullYear(),
                perPage: 10,
            },
            {
                replace: true,
                onFinish: () => setIsRefreshing(false),
            },
        );
    };

    const openEdit = (data: UserManagement) => {
        setSelected(data);
        setOpen(true);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'User Management', href: route('userManagement.index') }]}>
            <Head title="User Management" />

            <div className="space-y-4 p-5">
                <div className="flex justify-between">
                    <h1 className="text-xl font-semibold">User Management</h1>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleResetFilters} className="cursor-pointer">
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>

                        <Button onClick={() => setOpenPengaturan(true)} className="cursor-pointer">
                            <Settings className="h-4 w-4" />
                            <span className="hidden sm:inline">Setting</span>
                        </Button>

                        <Button onClick={() => setOpen1(true)} className="cursor-pointer">
                            <ScrollText className="h-4 w-4" /> <span className="hidden sm:inline">Log</span>
                        </Button>
                        {(isSuperAdmin || isAdmin) && (
                            <Button onClick={() => setOpen2(true)} className="cursor-pointer">
                                <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Tambah</span>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                            <Label className="font-bold text-bk-dev">Total Anggota</Label>
                            <Input value={totalAnggota} disabled className="border-bk-dev font-bold text-bk-dev" />
                        </div>
                    </div>
                    <div className="h-px w-full border-t" />
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                            <Label>Search</Label>
                            <Input
                                placeholder="Cari nama / email..."
                                value={localFilters.search}
                                onChange={(e) => handleFilterChange(localFilters, setLocalFilters, 'search', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Kantor</Label>
                            <Select
                                value={localFilters.office_id?.toString() ?? 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange(localFilters, setLocalFilters, 'office_id', value)
                                }
                            >
                                <SelectTrigger className="h-7 w-full p-4">
                                    <SelectValue placeholder="Pilih kantor" />
                                </SelectTrigger>
                                <SelectContent className="max-h-80 overflow-y-auto">
                                    <SelectItem value="all">ALL OFFICE</SelectItem>
                                    {offices.map((office) => (
                                        <SelectItem key={office.id} value={office.id.toString()}>
                                            {office.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Status</Label>
                            <Select
                                value={localFilters.status ?? 'all'}
                                onValueChange={(value) => handleFilterChange(localFilters, setLocalFilters, 'status', value)}
                            >
                                <SelectTrigger className="h-7 w-full p-4">
                                    <SelectValue placeholder="Pilih Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div>
                                <Label>Bulan Aktif</Label>
                                <Select
                                    value={localFilters.bulan}
                                    onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, bulan: value }))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih bulan" />
                                    </SelectTrigger>
                                    <SelectContent align='start'>
                                        {daftarBulan.map((bulan) => (
                                            <SelectItem key={bulan.value} value={bulan.value}>
                                                {bulan.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Tahun Aktif</Label>
                                <Select
                                    value={localFilters.tahun}
                                    onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, tahun: value }))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih tahun" />
                                    </SelectTrigger>
                                    <SelectContent align='start'>
                                        {daftarTahun.map((tahun) => (
                                            <SelectItem key={tahun} value={tahun}>
                                                {tahun}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    className="w-full"
                                    onClick={() =>
                                        router.get(
                                            route('userManagement.index'),
                                            {
                                                ...localFilters,
                                                bulan: localFilters.bulan,
                                                tahun: localFilters.tahun,
                                            },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                            },
                                        )
                                    }
                                >
                                    Terapkan Filter
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>Kelola data user (office, status)</DialogDescription>
                        </DialogHeader>

                        <Form
                            close={() => setOpen(false)}
                            initialData={selected ?? undefined}
                            roles={roles}
                            offices={offices}
                            isSuperAdmin={isSuperAdmin}
                        />
                    </DialogContent>
                </Dialog>

                <Dialog open={open2} onOpenChange={setOpen2}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Anggota</DialogTitle>
                            <DialogDescription>Tambahkan anggota baru koperasi</DialogDescription>
                        </DialogHeader>

                        <FormCreate close={() => setOpen2(false)} offices={offices} roles={roles} />
                    </DialogContent>
                </Dialog>

                <Dialog open={open1} onOpenChange={setOpen1}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Activity Log</DialogTitle>
                            <DialogDescription>Riwayat perubahan user oleh admin</DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
                            {activityLogs.length === 0 ? (
                                <div className="text-center text-xs text-gray-500">Tidak ada data</div>
                            ) : (
                                activityLogs.map((log, index) => (
                                    <div key={index} className="rounded-xl border p-4 shadow-sm">
                                        <div className="flex flex-col items-start">
                                            <div className="text-sm">
                                                <span className="font-semibold">{log.admin}</span> {'-> '}
                                                <span className="font-semibold">{log.user}</span>
                                            </div>
                                            <div className="flex w-full items-center justify-between">
                                                <span className="text-xs text-gray-400">{log.created_at}</span>
                                                <Badge variant="secondary">{log.jenis_update}</Badge>
                                            </div>{' '}
                                        </div>

                                        <Separator className="my-3" />

                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <div className="mb-1 font-medium text-orange-300">Sebelum</div>
                                                <div className="space-y-1">
                                                    {formatLog(log.old).map((item, i) => (
                                                        <div key={i}>
                                                            <span className="text-gray-400">{item.label}:</span>{' '}
                                                            <span className="font-medium">{String(item.value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="mb-1 font-medium text-green-300">Sesudah</div>
                                                <div className="space-y-1">
                                                    {formatLog(log.new).map((item, i) => (
                                                        <div key={i}>
                                                            <span className="text-gray-400">{item.label}:</span>{' '}
                                                            <span className="font-medium">{String(item.value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={openPengaturan} onOpenChange={setOpenPengaturan}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Pengaturan Koperasi</DialogTitle>

                            <DialogDescription>
                                Ubah nominal simpanan wajib dan persentase bunga pinjaman koperasi.
                            </DialogDescription>
                        </DialogHeader>

                        <FormPengaturan close={() => setOpenPengaturan(false)} initialData={pengaturanKoperasi} />
                    </DialogContent>
                </Dialog>

                <DataTable
                    columns={columnUser(openEdit, isSuperAdmin)}
                    data={users.data}
                    meta={users.meta}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                    perPage={localFilters.perPage}
                    onPerPageChange={(val) => handleFilterChange(localFilters, setLocalFilters, 'perPage', val)}
                />
            </div>
        </AppLayout>
    );
}
