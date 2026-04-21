<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\Web\AngsuranResource;
use App\Models\Angsuran;
use App\Models\Office;
use App\Models\Pinjaman;
use App\Models\Simpanan;
use App\Models\TransaksiKas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AngsuranController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);

        $query = Angsuran::with('user:id,name,office_id')
            ->whereHas('pinjaman', function ($q) {
                $q->where('status', 'aktif'); 
            })
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($sub) use ($request) {
                    $sub->whereHas('user', function ($u) use ($request) {
                        $u->where('name', 'like', '%' . $request->search . '%');
                    })->orWhere('id', $request->search);
                });
            })
            ->when($request->office_id, function ($q) use ($request) {
                $q->whereHas('user', function ($u) use ($request) {
                    $u->where('office_id', $request->office_id);
                });
            })
            ->when($request->status, function ($q) use ($request) {
                $q->where('status', $request->status);
            })
            ->when($request->start_date && $request->end_date, function ($q) use ($request) {
                $q->whereBetween('tanggal_bayar', [$request->start_date, $request->end_date]);
            });

        $data = (clone $query)
            ->orderByDesc('pinjaman_id')
            ->orderBy('angsuran_ke', 'asc')
            ->paginate($perPage)
            ->withQueryString();

        $activeQuery = (clone $query)->whereHas('user', function ($q) {
            $q->where('status', 'active');
        });

        $totAngsJlnNoBunga = $activeQuery->sum('dana_pinjaman');
        $totAngsJlnWithBunga = $activeQuery->sum('jumlah_bayar');
        $keuntunganBunga = $activeQuery->sum('bunga_bayar');

        return Inertia::render('angsuran/index', [
            'angsuran' => AngsuranResource::collection($data)->response()->getData(true),
            'filters' => [
                'search' => $request->search,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'status' => $request->status,
                'office_id' => $request->office_id,
                'perPage' => $perPage,
            ],
            'offices' => Office::select('id', 'name')->orderBy('name')->get(),
            'totAngsJlnNoBunga' => (float) $totAngsJlnNoBunga,
            'totAngsJlnWithBunga' => (float) $totAngsJlnWithBunga,
            'keuntunganBunga' => (float) $keuntunganBunga,
        ]);
    }
    public function updateStatus(Request $request, Angsuran $angsuran)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,sudah_bayar',
            'nominal_bayar' => 'nullable|numeric|min:0',
        ]);

        try {
            DB::transaction(function () use ($angsuran, $validated) {
                if ($angsuran->status === 'sudah_bayar') {
                    throw new \Exception('Angsuran sudah dibayar');
                }

                $pinjaman = Pinjaman::findOrFail($angsuran->pinjaman_id);

                $realBayar = $validated['nominal_bayar'] ?? $angsuran->jumlah_bayar;

                if ($realBayar < $angsuran->jumlah_bayar) {
                    throw new \Exception('Nominal tidak boleh kurang dari angsuran');
                }

                $angsuranList = Angsuran::where('pinjaman_id', $angsuran->pinjaman_id)
                    ->where('status', 'belum_bayar')
                    ->orderBy('angsuran_ke', 'asc')
                    ->lockForUpdate()
                    ->get();

                $sisaBayar = $realBayar;
                $lastPaidAngsuran = null;

                foreach ($angsuranList as $item) {
                    if ($sisaBayar < $item->jumlah_bayar) {
                        break;
                    }

                    $item->update([
                        'status' => 'sudah_bayar',
                        'tanggal_bayar' => now(),
                        'real_bayar' => $item->jumlah_bayar,
                    ]);

                    $sudahAda = TransaksiKas::where('ref_type', 'angsuran')->where('ref_id', $item->id)->exists();

                    if (!$sudahAda) {
                        TransaksiKas::create([
                            'by_admin' => Auth::id(),
                            'user_id' => $item->user_id,
                            'jenis' => 'masuk',
                            'kategori' => 'angsuran',
                            'jumlah' => $item->jumlah_bayar,
                            'keterangan' => 'Angsuran ke-' . $item->angsuran_ke,
                            'tanggal' => now(),
                            'ref_type' => 'angsuran',
                            'ref_id' => $item->id,
                            'reversal_of' => null,
                            'status' => 'berhasil',
                        ]);
                    }

                    $sisaBayar -= $item->jumlah_bayar;
                    $lastPaidAngsuran = $item;

                    $pinjaman->decrement('sisa_pinjaman', $item->jumlah_bayar);
                }

                if ($lastPaidAngsuran && $sisaBayar > 0) {
                    $lastPaidAngsuran->update([
                        'real_bayar' => $lastPaidAngsuran->jumlah_bayar + $sisaBayar,
                    ]);

                    Simpanan::create([
                        'user_id' => $angsuran->user_id,
                        'jenis' => 'sukarela',
                        'jumlah' => $sisaBayar,
                        'tanggal' => now(),
                    ]);

                    TransaksiKas::create([
                        'by_admin' => Auth::id(),
                        'user_id' => $angsuran->user_id,
                        'jenis' => 'masuk',
                        'kategori' => 'simpanan',
                        'jumlah' => $sisaBayar,
                        'keterangan' => 'Simpanan sukarela dari kelebihan angsuran ke-' . $lastPaidAngsuran->angsuran_ke,
                        'tanggal' => now(),
                        'ref_type' => 'angsuran',
                        'ref_id' => $lastPaidAngsuran->id,
                        'reversal_of' => null,
                        'status' => 'berhasil',
                    ]);
                }

                $pinjaman->refresh();

                if ($pinjaman->sisa_pinjaman <= 0) {
                    $pinjaman->update([
                        'status' => 'lunas',
                        'sisa_pinjaman' => 0,
                    ]);
                }
            });

            return back()->with('success', 'Pembayaran berhasil diproses');
        } catch (\Exception $e) {
            Log::error($e);
            return back()->with('error', $e->getMessage());
        }
    }
}
