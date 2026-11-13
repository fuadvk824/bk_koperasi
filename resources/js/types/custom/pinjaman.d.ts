export type Pinjaman = {
    id: number;
    user_id: number;
    name: string;
    jumlah_pinjaman: number;
    total_pinjaman: number;
    sisa_pinjaman: number;
    bunga_persen: number;
    lama_angsuran: number;
    angsuran_per_bulan: number;
    angsuran_bulan_terakhir: number;
    tanggal_pinjaman: string;
    status: 'aktif' | 'lunas';
    status_approval: 'menunggu' | 'disetujui' | 'ditolak';
    catatan_approval?: string;
    surat_pengajuan: string;
};
 