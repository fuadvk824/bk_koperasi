type User = {
    id: number;
    name: string;
};

type Transaksi = {
    id: number;
    user?: User | null;
    jenis: 'masuk' | 'keluar';
    jumlah: number;
    tanggal: string;
};

type DashboardProps = {
    totalSimpanan: number;
    totalPinjaman: number;
    sisaPinjaman: number;
    totalAnggota: number;
    saldoKas: number;
    angsuranMenunggak: number;
    pinjamanAktif: number;
    transaksiTerbaru: Transaksi[];
};