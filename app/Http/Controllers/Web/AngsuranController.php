<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\Web\AngsuranResource;
use App\Models\Angsuran;
use App\Models\Office;
use App\Models\Pinjaman;
use App\Models\Simpanan;
use App\Models\TransaksiKas;
use Carbon\Carbon;
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
            ->when($request->status_approval, function ($q) use ($request) {
                $q->where('status_approval', $request->status_approval);
            })

            ->when($request->filled('bulan'), function ($q) use ($request) {
                $q->where('bulan', $request->bulan);
            })
            ->when($request->filled('tahun'), function ($q) use ($request) {
                $q->where('tahun', $request->tahun);
            });

        $data = (clone $query)
            ->orderByDesc('pinjaman_id')
            ->orderBy('angsuran_ke', 'asc')
            ->paginate($perPage)
            ->withQueryString();


        $pinjamanIds = $data->getCollection()
            ->pluck('pinjaman_id')
            ->unique();

        $maxAngsuran = Angsuran::query()
            ->whereIn('pinjaman_id', $pinjamanIds)
            ->selectRaw('pinjaman_id, MAX(angsuran_ke) as max_ke')
            ->groupBy('pinjaman_id')
            ->pluck('max_ke', 'pinjaman_id');

        $pinjamanAdaTunggakan = Angsuran::query()
            ->whereIn('pinjaman_id', $pinjamanIds)
            ->where('status', 'belum_bayar')
            ->whereRaw('
                angsuran_ke < (
                    SELECT MAX(a2.angsuran_ke)
                    FROM angsuran AS a2
                    WHERE a2.pinjaman_id = angsuran.pinjaman_id
                )
            ')
            ->distinct()
            ->pluck('pinjaman_id')
            ->flip();

        $data->getCollection()->each(function ($item) use (
            $maxAngsuran,
            $pinjamanAdaTunggakan
        ) {
            $item->setAttribute(
                'is_last_installment',
                (int) $item->angsuran_ke === (int) ($maxAngsuran[$item->pinjaman_id] ?? 0)
            );

            $item->setAttribute(
                'has_unpaid_previous',
                isset($pinjamanAdaTunggakan[$item->pinjaman_id])
            );
        });

        $totAngsJlnNoBunga = (clone $query)->sum('dana_pinjaman');
        $totAngsJlnWithBunga = (clone $query)->sum('jumlah_bayar');
        $keuntunganBunga = (clone $query)->sum('bunga_bayar');
        return Inertia::render('angsuran/index', [
            'angsuran' => AngsuranResource::collection($data)->response()->getData(true),
            'filters' => [
                'search' => $request->search,
                'bulan' => $request->bulan,
                'tahun' => $request->tahun,
                'status' => $request->status,
                'status_approval' => $request->status_approval,
                'office_id' => $request->office_id,
                'statusPinjaman' => $request->statusPinjaman,
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
        /** @var \App\Models\User|null $admin */
        $admin = Auth::user();

        if (!$admin || !$admin->hasAnyRole(['super-admin', 'admin'])) {
            abort(403, 'Anda tidak memiliki akses.');
        }

        $validated = $request->validate([
            'status' => 'required|in:sudah_bayar',
            'nominal_bayar' => 'nullable|numeric|min:0.01',
            'tanggal_bayar' => 'required|date|before_or_equal:today',
        ]);

        $tanggalBayar = Carbon::parse($validated['tanggal_bayar'])->startOfDay();

        try {
            DB::transaction(function () use ($angsuran, $validated, $tanggalBayar) {
                $angsuran = Angsuran::whereKey($angsuran->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($angsuran->status === 'sudah_bayar') {
                    throw new \Exception('Angsuran sudah dibayar.');
                }

                $pinjaman = Pinjaman::whereKey($angsuran->pinjaman_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $realBayar = (float) (
                    $validated['nominal_bayar'] ?? $angsuran->jumlah_bayar
                );

                if ($realBayar < (float) $angsuran->jumlah_bayar) {
                    throw new \Exception(
                        'Nominal pembayaran tidak boleh kurang dari angsuran.'
                    );
                }

                $angsuranList = Angsuran::where('pinjaman_id', $angsuran->pinjaman_id)
                    ->where('status', 'belum_bayar')
                    ->orderBy('angsuran_ke')
                    ->lockForUpdate()
                    ->get();

                $sisaBayar = $realBayar;
                $lastPaidAngsuran = null;

                foreach ($angsuranList as $item) {
                    if ($sisaBayar < (float) $item->jumlah_bayar) {
                        break;
                    }

                    $item->update([
                        'status' => 'sudah_bayar',
                        'tanggal_bayar' => $tanggalBayar->toDateString(),
                        'real_bayar' => $item->jumlah_bayar,
                        'status_approval' => 'disetujui',
                    ]);

                    $sudahAda = TransaksiKas::where('ref_type', 'angsuran')
                        ->where('ref_id', $item->id)
                        ->where('kategori', 'angsuran')
                        ->where('jenis', 'masuk')
                        ->where('status', 'berhasil')
                        ->exists();

                    if (!$sudahAda) {
                        TransaksiKas::create([
                            'by_admin' => Auth::id(),
                            'user_id' => $item->user_id,
                            'jenis' => 'masuk',
                            'kategori' => 'angsuran',
                            'jumlah' => $item->jumlah_bayar,
                            'keterangan' => 'Angsuran ke-' . $item->angsuran_ke,
                            'tanggal' => $tanggalBayar,
                            'ref_type' => 'angsuran',
                            'ref_id' => $item->id,
                            'reversal_of' => null,
                            'status' => 'berhasil',
                        ]);
                    }

                    $sisaBayar -= (float) $item->jumlah_bayar;
                    $lastPaidAngsuran = $item;

                    $pinjaman->decrement('sisa_pinjaman', $item->jumlah_bayar);
                }

                if (!$lastPaidAngsuran) {
                    throw new \Exception(
                        'Tidak ada angsuran yang dapat dibayar dengan nominal tersebut.'
                    );
                }

                if ($sisaBayar > 0) {
                    $lastPaidAngsuran->update([
                        'real_bayar' =>
                        (float) $lastPaidAngsuran->jumlah_bayar + $sisaBayar,
                    ]);

                    Simpanan::create([
                        'user_id' => $angsuran->user_id,
                        'jenis' => 'sukarela',
                        'jumlah' => $sisaBayar,
                        'tanggal' => $tanggalBayar->toDateString(),
                    ]);

                    TransaksiKas::create([
                        'by_admin' => Auth::id(),
                        'user_id' => $angsuran->user_id,
                        'jenis' => 'masuk',
                        'kategori' => 'simpanan',
                        'jumlah' => $sisaBayar,
                        'keterangan' =>
                        'Simpanan sukarela dari kelebihan pembayaran angsuran ke-' .
                            $lastPaidAngsuran->angsuran_ke,
                        'tanggal' => $tanggalBayar,
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

            return back()->with('success', 'Pembayaran berhasil diproses.');
        } catch (\Throwable $e) {
            Log::error('Gagal memproses pembayaran angsuran', [
                'angsuran_id' => $angsuran->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', $e->getMessage());
        }
    }


    public function reject(Request $request, Angsuran $angsuran)
    {
        /** @var \App\Models\User|null $admin */
        $admin = Auth::user();

        if (!$admin || !$admin->hasAnyRole(['super-admin', 'admin'])) {
            abort(403, 'Anda tidak memiliki akses.');
        }

        $validated = $request->validate([
            'catatan_approval' => 'required|string|max:255',
        ], [
            'catatan_approval.required' => 'Catatan penolakan wajib diisi.',
        ]);

        try {
            DB::transaction(function () use ($angsuran, $validated) {
                $angsuran = Angsuran::whereKey($angsuran->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($angsuran->status === 'sudah_bayar' || $angsuran->status_approval === 'disetujui') {
                    throw new \Exception('Angsuran sudah dibayar/disetujui, tidak bisa ditolak.');
                }

                if ($angsuran->status_approval === 'ditolak') {
                    throw new \Exception('Angsuran sudah ditolak.');
                }

                $angsuran->update([
                    'status_approval'  => 'ditolak',
                    'catatan_approval' => $validated['catatan_approval'],
                ]);
            });

            return back()->with('success', 'Angsuran berhasil ditolak.');
        } catch (\Throwable $e) {
            Log::error('Gagal menolak angsuran', [
                'angsuran_id' => $angsuran->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', $e->getMessage());
        }
    }
}
