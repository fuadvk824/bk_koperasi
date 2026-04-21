<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\Web\PinjamanResource;
use App\Models\Pinjaman;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Angsuran;
use App\Models\Office;
use App\Models\User;
use App\Models\TransaksiKas;
use Illuminate\Support\Facades\Auth;

class PinjamanController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);

        $query = Pinjaman::with('user:id,name,office_id')
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($sub) use ($request) {
                    $sub->whereHas('user', function ($u) use ($request) {
                        $u->where('name', 'like', '%' . $request->search . '%');
                    })->orWhere('id', $request->search);
                });
            })
            ->when($request->status, function ($q) use ($request) {
                $q->where('status', $request->status);
            })
            ->when($request->office_id, function ($q) use ($request) {
                $q->whereHas('user', function ($u) use ($request) {
                    $u->where('office_id', $request->office_id);
                });
            })
            ->when($request->start_date && $request->end_date, function ($q) use ($request) {
                $q->whereBetween('tanggal_pinjaman', [$request->start_date, $request->end_date]);
            });

        $data = (clone $query)->orderBy('tanggal_pinjaman', 'desc')->paginate($perPage)->withQueryString();

        // $activeQuery = (clone $query)->whereHas('user', function ($q) {
        //     $q->where('status', 'active');
        // });

        // $jumlah_pinjaman = $activeQuery->sum('jumlah_pinjaman');
        // $total_pinjaman = $activeQuery->sum('total_pinjaman');
        // $sisa_pinjaman = $activeQuery->sum('sisa_pinjaman');
        $jumlah_pinjaman = (clone $query)->sum('jumlah_pinjaman');
        $total_pinjaman = (clone $query)->sum('total_pinjaman');
        $sisa_pinjaman = (clone $query)->sum('sisa_pinjaman');

        return Inertia::render('pinjaman/index', [
            'pinjaman' => PinjamanResource::collection($data)->response()->getData(true),
            'filters' => [
                'search' => $request->search,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'status' => $request->status,
                'office_id' => $request->office_id,
                'perPage' => $perPage,
            ],
            'offices' => Office::select('id', 'name')->orderBy('name')->get(),
            'users' => User::select('id', 'name')->get(),
            'jumlah_pinjaman' => (float) $jumlah_pinjaman,
            'total_pinjaman' => (float) $total_pinjaman,
            'sisa_pinjaman' => (float) $sisa_pinjaman,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'jumlah_pinjaman' => 'required|numeric|min:1',
            'bunga_persen' => 'required|numeric|min:0',
            'lama_angsuran' => 'required|integer|min:1',
            'tanggal_pinjaman' => 'required|date',
        ]);

        DB::transaction(function () use ($validated) {
            $bunga = ($validated['jumlah_pinjaman'] * $validated['bunga_persen']) / 100;
            $total = $validated['jumlah_pinjaman'] + $bunga;
            $lama = $validated['lama_angsuran'];

            $angsuranNormal = $total / $lama;
            $angsuranBulat = floor($angsuranNormal / 100) * 100;

            $totalAngsuranBulat = $angsuranBulat * $lama;
            $sisa = $total - $totalAngsuranBulat;

            $pokokNormal = $validated['jumlah_pinjaman'] / $lama;
            $pokokBulat = floor($pokokNormal / 100) * 100;

            $totalPokokBulat = $pokokBulat * $lama;
            $sisaPokok = $validated['jumlah_pinjaman'] - $totalPokokBulat;

            $pinjaman = Pinjaman::create([
                ...$validated,
                'total_pinjaman' => $total,
                'sisa_pinjaman' => $total,
                'angsuran_per_bulan' => $angsuranBulat,
                'angsuran_bulan_terakhir' => $angsuranBulat + $sisa,
                'status' => 'aktif',
            ]);

            TransaksiKas::create([
                'by_admin' => Auth::id(),
                'user_id' => $pinjaman->user_id,
                'jenis' => 'keluar',
                'kategori' => 'pinjaman',
                'jumlah' => $pinjaman->jumlah_pinjaman,
                'keterangan' => 'Pencairan pinjaman',
                'tanggal' => $pinjaman->tanggal_pinjaman,
                'ref_type' => 'pinjaman',
                'ref_id' => $pinjaman->id,
                'status' => 'berhasil',
            ]);

            $start = Carbon::parse($validated['tanggal_pinjaman'])->startOfMonth()->addMonth();

            for ($i = 0; $i < $lama; $i++) {
                $tanggal = $start->copy()->addMonthsNoOverflow($i);

                $jumlahBayar = $i == $lama - 1 ? $angsuranBulat + $sisa : $angsuranBulat;

                $danaPinjaman = $i == $lama - 1 ? $pokokBulat + $sisaPokok : $pokokBulat;

                $bungaBayar = $jumlahBayar - $danaPinjaman;

                Angsuran::create([
                    'pinjaman_id' => $pinjaman->id,
                    'user_id' => $validated['user_id'],
                    'angsuran_ke' => $i + 1,

                    'dana_pinjaman' => $danaPinjaman,
                    'jumlah_bayar' => $jumlahBayar,
                    'bunga_bayar' => $bungaBayar,
                    'real_bayar' => null,

                    'bulan' => $tanggal->month,
                    'tahun' => $tanggal->year,
                    'tanggal_bayar' => null,
                    'status' => 'belum_bayar',
                ]);
            }

            $jatuhTempo = $start
                ->copy()
                ->addMonthsNoOverflow($lama - 1)
                ->endOfMonth();

            $pinjaman->update([
                'jatuh_tempo_terakhir' => $jatuhTempo,
            ]);
        });

        return redirect()->back()->with('success', 'Pinjaman + angsuran berhasil dibuat');
    }

    public function update(Request $request, Pinjaman $pinjaman)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'jumlah_pinjaman' => 'required|numeric|min:1',
            'bunga_persen' => 'required|numeric|min:0',
            'lama_angsuran' => 'required|integer|min:1',
            'tanggal_pinjaman' => 'required|date',
        ]);

        $angsuranJalan = $pinjaman->angsuran()->whereNotNull('real_bayar')->exists();
        if ($angsuranJalan) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'pinjaman' => 'Tidak bisa diubah karena angsuran sudah berjalan',
            ]);
        }

        DB::transaction(function () use ($validated, $pinjaman) {
            $transaksiLama = TransaksiKas::where('ref_id', $pinjaman->id)
                ->where('kategori', 'pinjaman')
                ->whereNull('reversal_of')
                ->latest()
                ->first();

            if ($transaksiLama) {
                TransaksiKas::create([
                    'by_admin' => Auth::id(),
                    'user_id' => $transaksiLama->user_id,
                    'jenis' => 'masuk',
                    'kategori' => 'pinjaman',
                    'jumlah' => $transaksiLama->jumlah,
                    'keterangan' => 'Reversal pinjaman',
                    'tanggal' => now(),
                    'ref_type' => 'pinjaman_reversal',
                    'ref_id' => $pinjaman->id,
                    'reversal_of' => $transaksiLama->id,
                    'status' => 'berhasil',
                ]);
            }

            Angsuran::where('pinjaman_id', $pinjaman->id)->delete();

            $bunga = ($validated['jumlah_pinjaman'] * $validated['bunga_persen']) / 100;
            $total = $validated['jumlah_pinjaman'] + $bunga;

            $lama = $validated['lama_angsuran'];

            $angsuranNormal = $total / $lama;
            $angsuranBulat = floor($angsuranNormal / 100) * 100;

            $totalAngsuranBulat = $angsuranBulat * $lama;
            $sisa = $total - $totalAngsuranBulat;

            $pokokNormal = $validated['jumlah_pinjaman'] / $lama;
            $pokokBulat = floor($pokokNormal / 100) * 100;

            $totalPokokBulat = $pokokBulat * $lama;
            $sisaPokok = $validated['jumlah_pinjaman'] - $totalPokokBulat;

            $perubahan = [];
            if ($validated['jumlah_pinjaman'] != $pinjaman->jumlah_pinjaman) {
                $perubahan[] = 'nominal';
            }
            if ($validated['bunga_persen'] != $pinjaman->bunga_persen) {
                $perubahan[] = 'bunga';
            }
            if ($validated['lama_angsuran'] != $pinjaman->lama_angsuran) {
                $perubahan[] = 'tenor';
            }
            if ($validated['tanggal_pinjaman'] != $pinjaman->tanggal_pinjaman->toDateString()) {
                $perubahan[] = 'tanggal';
            }
            $keteranganUpdate = 'Update pinjaman';
            if (!empty($perubahan)) {
                $keteranganUpdate .= ' - ' . implode(', ', $perubahan);
            }

            $pinjaman->update([
                ...$validated,
                'total_pinjaman' => $total,
                'sisa_pinjaman' => $total,
                'angsuran_per_bulan' => $angsuranBulat,
                'angsuran_bulan_terakhir' => $angsuranBulat + $sisa,
                'status' => 'aktif',
            ]);

            TransaksiKas::create([
                'by_admin' => Auth::id(),
                'user_id' => $pinjaman->user_id,
                'jenis' => 'keluar',
                'kategori' => 'pinjaman',
                'jumlah' => $pinjaman->jumlah_pinjaman,
                'keterangan' => $keteranganUpdate,
                'tanggal' => $pinjaman->tanggal_pinjaman,
                'ref_type' => 'pinjaman_update',
                'ref_id' => $pinjaman->id,
                'reversal_of' => null,
                'status' => 'berhasil',
            ]);

            $start = Carbon::parse($validated['tanggal_pinjaman'])->startOfMonth()->addMonth();

            for ($i = 0; $i < $lama; $i++) {
                $tanggal = $start->copy()->addMonthsNoOverflow($i);

                $jumlahBayar = $i == $lama - 1 ? $angsuranBulat + $sisa : $angsuranBulat;

                $danaPinjaman = $i == $lama - 1 ? $pokokBulat + $sisaPokok : $pokokBulat;

                $bungaBayar = $jumlahBayar - $danaPinjaman;

                Angsuran::create([
                    'pinjaman_id' => $pinjaman->id,
                    'user_id' => $validated['user_id'],
                    'angsuran_ke' => $i + 1,

                    'dana_pinjaman' => $danaPinjaman,
                    'jumlah_bayar' => $jumlahBayar,
                    'bunga_bayar' => $bungaBayar,

                    'bulan' => $tanggal->month,
                    'tahun' => $tanggal->year,
                    'tanggal_bayar' => null,
                    'status' => 'belum_bayar',
                ]);
            }

            $jatuhTempo = $start
                ->copy()
                ->addMonthsNoOverflow($lama - 1)
                ->endOfMonth();

            $pinjaman->update([
                'jatuh_tempo_terakhir' => $jatuhTempo,
            ]);
        });

        return redirect()->back()->with('success', 'Pinjaman berhasil diupdate');
    }
}
