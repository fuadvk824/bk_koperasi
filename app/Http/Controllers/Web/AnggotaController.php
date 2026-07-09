<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\Web\AnggotaResource;
use App\Models\Angsuran;
use App\Models\Office;
use App\Models\Simpanan;
use App\Models\TransaksiKas;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AnggotaController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);

        $anggota = User::query()
            ->with('office:id,name')
            ->where('status', 'active')

            ->when($request->search, function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            })
            ->when($request->office_id, function ($q) use ($request) {
                $q->where('office_id', $request->office_id);
            })

            ->withSum('simpanan', 'jumlah')
            ->withSum(
                [
                    'simpanan as simpanan_sum_simpanan_wajib' => function ($q) {
                        $q->where('jenis', 'wajib');
                    },
                ],
                'jumlah',
            )
            ->withSum(
                [
                    'simpanan as simpanan_sum_simpanan_sukarela' => function ($q) {
                        $q->where('jenis', 'sukarela');
                    },
                ],
                'jumlah',
            )
            ->withSum(
                [
                    'simpanan as simpanan_sum_simpanan_modal' => function ($q) {
                        $q->where('jenis', 'modal');
                    },
                ],
                'jumlah',
            )
            ->withSum('pinjaman', 'sisa_pinjaman')
            ->withSum(
                [
                    'angsuran as angsuran_sum_jumlah_bayar' => function ($q) {
                        $q->where('status', 'sudah_bayar');
                    },
                ],
                'jumlah_bayar',
            )

            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('anggota/index', [
            'anggota' => AnggotaResource::collection($anggota)->response()->getData(true),
            'filters' => [
                'search' => $request->search,
                'perPage' => $perPage,
                'office_id' => $request->office_id,
            ],
            'offices' => Office::select('id', 'name')->get(),
        ]);
    }


    public function keluar(User $user)
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        if (!$user || !$user->hasAnyRole(['super-admin', 'admin'])) {
            return;
        }
        return DB::transaction(function () use ($user) {

            if ($user->status === 'inactive') {
                return back()->with('error', 'User sudah nonaktif');
            }

            $totalSimpanan = $user->simpanan()->sum('jumlah');

            $pinjamanList = $user->pinjaman()
                ->where('status', 'aktif')
                ->lockForUpdate()
                ->get();

            $totalSisaPinjaman = $pinjamanList->sum('sisa_pinjaman');

            $sisaSimpanan = $totalSimpanan - $totalSisaPinjaman;

            if ($sisaSimpanan < 0) {
                return back()->with('error', 'Simpanan tidak mencukupi untuk menutup pinjaman');
            }


            if ($totalSisaPinjaman > 0) {

                $simpananAngsuran = Simpanan::create([
                    'user_id' => $user->id,
                    'jenis' => 'penarikan',
                    'jumlah' => -$totalSisaPinjaman,
                    'tanggal' => now(),
                    'keterangan' => 'Penarikan simpanan untuk pelunasan pinjaman',
                ]);

                TransaksiKas::create([
                    'by_admin'   => Auth::id(),
                    'user_id'    => $user->id,
                    'jenis'      => 'keluar',
                    'kategori'   => 'simpanan',
                    'jumlah'     => $totalSisaPinjaman,
                    'keterangan' => 'Pengalihan simpanan ke angsuran',
                    'tanggal'    => now(),
                    'ref_id'     => $simpananAngsuran->id,
                    'ref_type'   => Simpanan::class,
                    'status'     => 'berhasil',
                ]);
            }


            foreach ($pinjamanList as $pinjaman) {

                $angsuranList = Angsuran::where('pinjaman_id', $pinjaman->id)
                    ->where('status', 'belum_bayar')
                    ->orderBy('angsuran_ke')
                    ->lockForUpdate()
                    ->get();

                foreach ($angsuranList as $angsuran) {

                    $angsuran->update([
                        'status' => 'sudah_bayar',
                        'tanggal_bayar' => now(),
                        'real_bayar' => $angsuran->jumlah_bayar,
                    ]);

                    TransaksiKas::create([
                        'by_admin' => Auth::id(),
                        'user_id' => $user->id,
                        'jenis' => 'masuk',
                        'kategori' => 'angsuran',
                        'jumlah' => $angsuran->jumlah_bayar,
                        'keterangan' => 'Pelunasan dari simpanan (angsuran ke-' . $angsuran->angsuran_ke . ')',
                        'tanggal' => now(),
                        'ref_type' => 'angsuran',
                        'ref_id' => $angsuran->id,
                        'status' => 'berhasil',
                    ]);

                    $pinjaman->decrement('sisa_pinjaman', $angsuran->jumlah_bayar);
                }

                $pinjaman->update([
                    'status' => 'lunas',
                    'sisa_pinjaman' => 0,
                ]);
            }

            if ($sisaSimpanan > 0) {

                $simpananKeluar = Simpanan::create([
                    'user_id' => $user->id,
                    'jenis' => 'penarikan',
                    'jumlah' => -$sisaSimpanan,
                    'tanggal' => now(),
                    'keterangan' => 'Penarikan sisa simpanan saat keluar',
                ]);

                TransaksiKas::create([
                    'by_admin'   => Auth::id(),
                    'user_id'    => $user->id,
                    'jenis'      => 'keluar',
                    'kategori'   => 'simpanan',
                    'jumlah'     => $sisaSimpanan,
                    'keterangan' => 'Pembayaran sisa simpanan ke anggota',
                    'tanggal'    => now(),
                    'ref_id'     => $simpananKeluar->id,
                    'ref_type'   => Simpanan::class,
                    'status'     => 'berhasil',
                ]);
            }

            $user->update([
                'status' => 'inactive',
            ]);

            return back()->with('success', 'Anggota keluar, simpanan dialihkan ke angsuran & sisa dibayarkan');
        });
    }
}
