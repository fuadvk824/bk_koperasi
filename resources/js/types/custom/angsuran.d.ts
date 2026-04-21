export type Angsuran = {
    id: number;
    pinjaman_id: number;
    user_id: number;
    angsuran_ke: number;

    dana_pinjaman: number;
    jumlah_bayar: number;
    real_bayar: number;

    periode: string;
    tanggal_bayar: string;
    status: 'belum_bayar' | 'sudah_bayar';
};
