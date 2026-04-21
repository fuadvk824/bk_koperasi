export type Role = {
    id: number;
    name: string;
};

export type UserManagement = {
    id: number;
    name: string;
    email: string;
    status: string;
    roles: Role[];
    office?: {
        id: number;
        name: string;
    };
};