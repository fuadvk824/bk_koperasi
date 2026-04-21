import { route } from 'ziggy-js';
import { usePage } from '@inertiajs/react';

export function useRoute() {
    const { ziggy } = usePage().props as any;
    return (name: string, params = {}) => route(name, params, false, ziggy);
}
