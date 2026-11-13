export interface Simpanan {
    id: number;
    user_id: number;
    nama_user: string;
    jenis: string;
    jumlah: number;
    tanggal: string;
    status_approval: 'menunggu' | 'disetujui' | 'ditolak';
    catatan_approval?: string;
    bukti_transfer: string;
}
