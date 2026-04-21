import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    Landmark,
    PiggyBank,
    HandCoins,
    CircleDollarSign,
    Contact,
    Store,
    ShieldCheck,
} from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

import type { NavItem } from '@/types';
import { forwardRef } from 'react';
import type { LucideProps } from 'lucide-react';
import { useBackground } from '@/context/bg-context';

const InstagramIcon = forwardRef<SVGSVGElement, LucideProps>(({ className, ...props }, ref) => {
    return (
        <svg ref={ref} viewBox="0 0 30 30" fill="currentColor" className={className} {...props}>
            <g>
                <path d="M22.3,8.4c-0.8,0-1.4,0.6-1.4,1.4c0,0.8,0.6,1.4,1.4,1.4c0.8,0,1.4-0.6,1.4-1.4C23.7,9,23.1,8.4,22.3,8.4z" />
                <path d="M16,10.2c-3.3,0-5.9,2.7-5.9,5.9s2.7,5.9,5.9,5.9s5.9-2.7,5.9-5.9S19.3,10.2,16,10.2z M16,19.9c-2.1,0-3.8-1.7-3.8-3.8c0-2.1,1.7-3.8,3.8-3.8c2.1,0,3.8,1.7,3.8,3.8C19.8,18.2,18.1,19.9,16,19.9z" />
                <path d="M20.8,4h-9.5C7.2,4,4,7.2,4,11.2v9.5c0,4,3.2,7.2,7.2,7.2h9.5c4,0,7.2-3.2,7.2-7.2v-9.5C28,7.2,24.8,4,20.8,4z M25.7,20.8c0,2.7-2.2,5-5,5h-9.5c-2.7,0-5-2.2-5-5v-9.5c0-2.7,2.2-5,5-5h9.5c2.7,0,5,2.2,5,5V20.8z" />
            </g>
        </svg>
    );
});

InstagramIcon.displayName = 'InstagramIcon';

export function AppSidebar() {
    const { props }: any = usePage();
    const roles: string[] = props.auth.roles || [];

    const mainNavItems: NavItem[] = [
        {
            title: 'Beranda',
            href: '/dashboard',
            icon: LayoutGrid,
            roles: ['super-admin', 'admin'],
        },
        {
            title: 'Data Anggota',
            href: '/anggota',
            icon: Contact,
            roles: ['super-admin', 'admin'],
        },
        {
            title: 'Data Simpanan',
            href: '/simpanan',
            icon: PiggyBank,
            roles: ['super-admin', 'admin'],
        },
        {
            title: 'Data Pinjaman',
            href: '/pinjaman',
            icon: HandCoins,
            roles: ['super-admin', 'admin'],
        },
        {
            title: 'Data Angsuran',
            href: '/angsuran',
            icon: CircleDollarSign,
            roles: ['super-admin', 'admin'],
        },
        {
            title: 'Transaksi Kas',
            href: '/transaksikas',
            icon: Landmark,
            roles: ['super-admin', 'admin'],
        },

        {
            title: 'Dashboard',
            href: '/dashboardKoperasi',
            icon: LayoutGrid,
            roles: ['user'],
        },
        {
            title: 'User Management',
            href: '/userManagement',
            icon: ShieldCheck,
            roles: ['super-admin', 'admin'],
        },
    ];

    const filteredNavItems = mainNavItems.filter((item) => {
        if (!item.roles) return true;
        return item.roles.some((role) => roles.includes(role));
    });

    const footerNavItems: NavItem[] = [
        {
            title: 'BisaKulak',
            href: 'https://www.bisakulak.com/',
            icon: Store,
        },
        {
            title: 'Instagram',
            href: 'https://www.instagram.com/bisakulak/',
            icon: InstagramIcon,
        },
    ];

    const { bg } = useBackground();

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className={`${bg === 'gradient' ? 'bg-transparent [&_*]:bg-transparent' : ''}`}
        >
            <SidebarHeader className='bg-transparent'>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <div className="h-px w-full border-t mb-3" />
            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
