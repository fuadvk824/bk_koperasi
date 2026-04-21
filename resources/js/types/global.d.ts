import type { Auth } from '@/types/auth';
import type { Ziggy as ZiggyType } from './ziggy';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}

declare global {
    interface Window {
        Ziggy: ZiggyType;
    }
}

export {};