export type TransaksiKas = {
    id: number;

    by_admin: number;
    admin?: {
        id: number;
        name: string;
    };
    user_id: number;
    user?: {
        id: number;
        name: string;
    };

    jenis: 'masuk' | 'keluar';
    kategori: 'simpanan' | 'pinjaman' | 'angsuran' | 'operasional' | 'lainnya';

    jumlah: number;
    keterangan: string | null;
    tanggal: string;

    ref_type: string | null;
    ref_id: number | null;

    status: 'pending' | 'berhasil' | 'dibatalkan';
};