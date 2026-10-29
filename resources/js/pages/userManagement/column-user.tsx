import { ColumnDef } from '@tanstack/react-table';

import { UserManagement } from '@/types/custom/usermanagement';
import { SquarePen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const formatRoleName = (name: string) => {
    return name
        .replace('-', ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';

    const [year, month, day] = date.slice(0, 10).split('-');

    return `${day}-${month}-${year}`;
};

export const columnUser = (onEdit: any, isSuperAdmin: boolean): ColumnDef<UserManagement>[] => {
    const columns: ColumnDef<UserManagement>[] = [
        {
            id: 'nomor',
            header: () => <div className="flex w-10! items-center justify-center">No.</div>,
            cell: ({ row }) => <div className="w-10! text-center">{row.index + 1}.</div>,
        },
        {
            accessorKey: 'name',
            header: 'Nama',
        },
        {
            accessorKey: 'email',
            header: 'Email',
        },
        {
            id: 'office',
            header: 'Office',
            cell: ({ row }) => row.original.office?.name ?? '-',
        },
    ];

    if (isSuperAdmin) {
        columns.push({
            id: 'roles',
            header: 'Role',
            cell: ({ row }) => {
                const roles = row.original.roles ?? [];

                if (!roles.length) return '-';

                return (
                    <div className="flex flex-wrap gap-1">
                        {roles.map((role: any) => (
                            <Badge key={role.name} variant="secondary">
                                {formatRoleName(role.name)}
                            </Badge>
                        ))}
                    </div>
                );
            },
        });
    }

    columns.push(
        {
            accessorKey: 'active_at',
            header: 'Tanggal Aktif',
            cell: ({ row }) => <div className="whitespace-nowrap">{formatDate(row.original.active_at)}</div>,
        },
        {
            accessorKey: 'inactive_at',
            header: 'Tanggal Nonaktif',
            cell: ({ row }) => <div className="whitespace-nowrap">{formatDate(row.original.inactive_at)}</div>,
        },

        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;

                return (
                    <Badge className={`text-black ${status === 'active' ? 'bg-green-300' : 'bg-yellow-300'}`}>
                        {status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const data = row.original;

                const isSuperAdminRow = data.roles?.some((r: any) => r.name === 'super-admin');

                return (
                    <Button
                        size="sm"
                        disabled={isSuperAdminRow}
                        onClick={() => onEdit(data)}
                        className="cursor-pointer hover:scale-105"
                    >
                        <SquarePen size={16} className="mr-1" />
                        Edit
                    </Button>
                );
            },
        },
    );

    return columns;
};
