<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Simpanan;
use App\Models\Pinjaman;
use App\Models\Angsuran;
use App\Models\TransaksiKas;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BerandaController extends Controller
{
    public function index()
    {
        $simpanan = Simpanan::whereHas('user', function ($q) {
            $q->where('status', 'active');
        })->sum('jumlah');
        $angsuran = Angsuran::where('status', 'sudah_bayar')
            ->whereHas('pinjaman', function ($q) {
                $q->where('status', 'aktif');
            })
            ->where('status', 'sudah_bayar')
            ->whereHas('user', function ($q) {
                $q->where('status', 'active');
            })
            ->sum('jumlah_bayar');
        $mutasi = TransaksiKas::where('kategori', 'mutasi')->where('jenis', 'masuk')->sum('jumlah');
        $totalSimpanan = $simpanan + $angsuran + $mutasi; //all simpanan (user active) + all angsuran sudah bayar dengan bunga

        $totalPinjaman = Pinjaman::where('status', 'aktif')
            ->whereHas('user', function ($q) {
                $q->where('status', 'active');
            })
            ->sum('jumlah_pinjaman');

        $sisaPinjaman = Pinjaman::whereHas('user', function ($q) {
            $q->where('status', 'active');
        })->sum('sisa_pinjaman');

        $totalAnggota = DB::table('users')->where('status', 'active')->count();

        $kasMasuk = TransaksiKas::where('jenis', 'masuk')
        ->sum('jumlah');
        $kasKeluar = TransaksiKas::where('jenis', 'keluar')
        ->sum('jumlah');
        $saldoKas = $kasMasuk - $kasKeluar;

        $angsuranMenunggak = Angsuran::where('status', 'belum_bayar')
            ->whereHas('user', function ($q) {
                $q->where('status', 'active');
            })
            ->count();

        $pinjamanAktif = Pinjaman::where('status', 'aktif')
            ->whereHas('user', function ($q) {
                $q->where('status', 'active');
            })
            ->count();

        $transaksiTerbaru = TransaksiKas::with('user')
            ->whereHas('user', function ($q) {
                $q->where('status', 'active');
            })
            ->latest('tanggal')
            ->limit(5)
            ->get();

        return Inertia::render('beranda/index', [
            'totalSimpanan' => $totalSimpanan,
            'totalPinjaman' => $totalPinjaman,
            'sisaPinjaman' => $sisaPinjaman,
            'totalAnggota' => $totalAnggota,
            'saldoKas' => $saldoKas,
            'angsuranMenunggak' => $angsuranMenunggak,
            'pinjamanAktif' => $pinjamanAktif,
            'transaksiTerbaru' => $transaksiTerbaru,
        ]);
    }
}
