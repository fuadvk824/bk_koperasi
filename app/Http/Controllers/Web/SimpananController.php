<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\Web\SimpananResource;
use App\Models\Office;
use App\Models\Simpanan;
use App\Models\User;
use App\Models\TransaksiKas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class SimpananController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);

        $query = Simpanan::with('user:id,name,office_id')
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($sub) use ($request) {
                    $sub->whereHas('user', function ($u) use ($request) {
                        $u->where('name', 'like', '%' . $request->search . '%');
                    })->orWhere('id', $request->search);
                });
            })
            ->when($request->jenis, function ($q) use ($request) {
                $q->where('jenis', $request->jenis);
            })
            ->when($request->office_id, function ($q) use ($request) {
                $q->whereHas('user', function ($u) use ($request) {
                    $u->where('office_id', $request->office_id);
                });
            })
            ->when($request->start_date && $request->end_date, function ($q) use ($request) {
                $q->whereBetween('tanggal', [$request->start_date, $request->end_date]);
            });

        $data = (clone $query)->orderBy('tanggal', 'desc')->paginate($perPage)->withQueryString();

        $activeQuery = (clone $query)->whereHas('user', function ($q) {
            $q->where('status', 'active');
        });

        $simpananWajib = (clone $activeQuery)->where('jenis', 'wajib')->sum('jumlah');
        $simpananSukarela = (clone $activeQuery)->where('jenis', 'sukarela')->sum('jumlah');
        $simpananModal = (clone $activeQuery)->where('jenis', 'modal')->sum('jumlah');
        $totalSimpanan = $simpananWajib + $simpananSukarela + $simpananModal;

        return Inertia::render('simpanan/index', [
            'simpanan' => SimpananResource::collection($data)->response()->getData(true),

            'filters' => [
                'search' => $request->search,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'office_id' => $request->office_id,
                'jenis' => $request->jenis,
                'perPage' => $perPage,
            ],
            'users' => User::select('id', 'name')->get(),
            'offices' => Office::select('id', 'name')->orderBy('name')->get(),
            'simpananWajib' => (float) $simpananWajib,
            'simpananSukarela' => (float) $simpananSukarela,
            'totalSimpanan' => (float) $totalSimpanan,
            'simpananModal' => (float) $simpananModal,
        ]);
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'jenis' => 'required|in:wajib,sukarela,modal',
            'jumlah' => 'required|numeric|min:0',
            'tanggal' => 'required|date',
        ]);

        DB::transaction(function () use ($validated) {
            $simpanan = Simpanan::create($validated);

            TransaksiKas::create([
                'by_admin' => Auth::id(),
                'user_id' => $simpanan->user_id,
                'jenis' => 'masuk',
                'kategori' => 'simpanan',
                'jumlah' => $simpanan->jumlah,
                'keterangan' => 'Simpanan ' . $simpanan->jenis,
                'tanggal' => $simpanan->tanggal,
                'ref_type' => 'simpanan',
                'ref_id' => $simpanan->id,
                'reversal_of' => null,
                'status' => 'berhasil',
            ]);
        });

        return redirect()->back()->with('success', 'Data simpanan berhasil ditambahkan');
    }

    public function update(Request $request, Simpanan $simpanan)
    {
        if ($simpanan->jenis === 'sukarela') {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'simpanan' => 'Simpanan sukarela tidak bisa diubah',
            ]);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'jenis' => 'required|in:wajib,sukarela',
            'jumlah' => 'required|numeric|min:0',
            'tanggal' => 'required|date',
        ]);

        DB::transaction(function () use ($validated, $simpanan) {
            $transaksiLama = TransaksiKas::where('ref_id', $simpanan->id)
                ->where('kategori', 'simpanan')
                ->whereNull('reversal_of')
                ->latest()
                ->first();

            if ($transaksiLama) {
                TransaksiKas::create([
                    'by_admin' => Auth::id(),
                    'user_id' => $transaksiLama->user_id,
                    'jenis' => 'keluar',
                    'kategori' => 'simpanan',
                    'jumlah' => $transaksiLama->jumlah,
                    'keterangan' => 'Reversal simpanan',
                    'tanggal' => now(),
                    'ref_type' => 'simpanan_reversal',
                    'ref_id' => $simpanan->id,
                    'reversal_of' => $transaksiLama->id,
                    'status' => 'berhasil',
                ]);
            }

            $perubahan = [];
            if ($validated['jumlah'] != $simpanan->jumlah) {
                $perubahan[] = 'nominal';
            }

            if ($validated['tanggal'] != $simpanan->tanggal->toDateString()) {
                $perubahan[] = 'tanggal';
            }
            $keteranganUpdate = 'Update simpanan';
            if (!empty($perubahan)) {
                $keteranganUpdate .= ' - ' . implode(', ', $perubahan);
            }

            $simpanan->update($validated);

            TransaksiKas::create([
                'by_admin' => Auth::id(),
                'user_id' => $simpanan->user_id,
                'jenis' => 'masuk',
                'kategori' => 'simpanan',
                'jumlah' => $simpanan->jumlah,
                'keterangan' => $keteranganUpdate,
                'tanggal' => $simpanan->tanggal,
                'ref_type' => 'simpanan_update',
                'ref_id' => $simpanan->id,
                'reversal_of' => null,
                'status' => 'berhasil',
            ]);
        });

        return redirect()->back()->with('success', 'Data simpanan berhasil diupdate');
    }
}
