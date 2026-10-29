
export interface BulanTersedia {
    bulan: number;
    nama: string;
    tahun: number;
}

export interface AnggotaBelumBayar {
    id: number;
    name: string;
    active_at: string | null;
}

export interface SimpananDuplikat {
    id: number;
    user_id: number;
    user: {
        id: number;
        name: string;
    } | null;
    jenis: string;
    jumlah: number;
    tanggal: string;
    created_at: string | null;
    transaksi_kas_id: number | null;
    transaksi_kas_tanggal: string | null;
    bulan_tersedia: BulanTersedia[];
}
