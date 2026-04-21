import {
    createContext,
    useContext,
    useState,
    ReactNode,
} from 'react';
import { usePage, router } from '@inertiajs/react';

export type BackgroundType = 'default' | 'gradient';

type BackgroundContextType = {
    bg: BackgroundType;
    setBg: (bg: BackgroundType) => void;
    refreshBg: () => void;
};

const BackgroundContext = createContext<BackgroundContextType | null>(null);

export function BackgroundProvider({ children }: { children: ReactNode }) {
    const { auth } = usePage().props as any;

    const [localBg, setLocalBg] = useState<BackgroundType | null>(null);

    const serverBg: BackgroundType = auth?.bg ?? 'default';

    const bg: BackgroundType =
        localBg && localBg !== serverBg ? localBg : serverBg;

    const setBg = (val: BackgroundType) => {
        setLocalBg(val);

        router.post(
            '/user/bg',
            { bg: val },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['auth'],
                onError: () => {
                    setLocalBg(null);
                },
            }
        );
    };

    const refreshBg = () => {
        router.reload({ only: ['auth'] });
    };

    return (
        <BackgroundContext.Provider value={{ bg, setBg, refreshBg }}>
            {children}
        </BackgroundContext.Provider>
    );
}

export function useBackground() {
    const ctx = useContext(BackgroundContext);

    if (!ctx) {
        throw new Error('useBackground must be used inside BackgroundProvider');
    }

    return ctx;
}
