export type ActivityLog = {
    admin: string;
    user: string;
    jenis_update: string;
    old: Record<string, any> | null;
    new: Record<string, any> | null;
    created_at: string;
};
