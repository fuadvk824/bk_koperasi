export interface RiwayatAktivitas {
    id: number;
    nama: string;
    status: string;

    active_at: string | null;
    inactive_at: string | null;
    tanggal_simpanan: string | null;
    tanggal_pinjaman: string | null;
    tanggal_transaksi_kas: string | null;
    tandai: 1;
}
export interface InactiveNodata {
    id: number;
    nama: string;
    status: string;
    active_at: string | null;
    inactive_at: string | null;
}
