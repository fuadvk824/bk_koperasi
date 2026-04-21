import { Link, router } from '@inertiajs/react';
import { KeySquare, LogOut, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

import { Switch } from '@/components/ui/switch';
import { useBackground } from '@/context/bg-context';

type Props = {
    user: User;
    isAdmin?: string;
};

export function UserMenuContent({ user, isAdmin }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    const { bg, setBg } = useBackground();

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <div>
                    <Switch checked={bg === 'gradient'} onCheckedChange={(val) => setBg(val ? 'gradient' : 'default')} />
                    <span className="text-sm">Gradient</span>
                </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {(isAdmin === 'super-admin') && (
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link className="block w-full cursor-pointer" href={edit()} prefetch onClick={cleanup}>
                            <Settings className="mr-2" />
                            Settings
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            )}

            <DropdownMenuSeparator />
             {(isAdmin === 'super-admin' || isAdmin === 'admin') && (
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link className="block w-full cursor-pointer" href={"/settings/security"} prefetch onClick={cleanup}>
                            <KeySquare className="mr-2" />
                            Ubah Password
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
