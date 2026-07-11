<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\Web\TransaksiKasResource;
use App\Models\Office;
use App\Models\TransaksiKas;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransaksiKasController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);

        $query = TransaksiKas::with(['user:id,name,office_id', 'admin:id,name'])
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($sub) use ($request) {
                    $sub->whereHas('user', function ($u) use ($request) {
                        $u->where('name', 'like', '%' . $request->search . '%');
                    })->orWhere('ref_id', $request->search);
                });
            })
            ->when($request->statusUser, function ($q) use ($request) {
                $q->where(function ($sub) use ($request) {
                    $sub->whereHas('user', function ($u) use ($request) {
                        $u->where('status', $request->statusUser);
                    });
                });
            })
            ->when($request->office_id, function ($q) use ($request) {
                $q->whereHas('user', function ($u) use ($request) {
                    $u->where('office_id', $request->office_id);
                });
            })
            ->when($request->jenis, function ($q) use ($request) {
                $q->where('jenis', $request->jenis);
            })
            ->when($request->kategori, function ($q) use ($request) {
                $q->where('kategori', $request->kategori);
            });

        $data = (clone $query)->orderBy('tanggal', 'desc')->paginate($perPage)->withQueryString();

        // $activeQuery = (clone $query)->whereHas('user', function ($q) {
        //     $q->where('status', 'active');
        // });

        $kasMasuk = (clone $query)->where('jenis', 'masuk')->sum('jumlah');
        $kasKeluar = (clone $query)->where('jenis', 'keluar')->sum('jumlah');
        $saldoKas = $kasMasuk - $kasKeluar;

        return Inertia::render('transaksikas/index', [
            'transaksiKas' => TransaksiKasResource::collection($data)->response()->getData(true),

            'filters' => [
                'search' => $request->search,
                'perPage' => $perPage,
                'jenis' => $request->jenis,
                'kategori' => $request->kategori,
                'statusUser' => $request->statusUser,
                'office_id' => $request->office_id,
            ],
            'offices' => Office::select('id', 'name')->orderBy('name')->get(),
            'users' => User::select('id', 'name')->get(),
            'saldoKas' => $saldoKas,
            'kasMasuk' => $kasMasuk,
            'kasKeluar' => $kasKeluar,
        ]);
    }

    public function store(Request $request)
    {
        /** @var \App\Models\User|null $admin */
        $admin = Auth::user();

        if (!$admin || !$admin->hasAnyRole(['super-admin', 'admin'])) {
            return;
        }
        $request->validate([
            'jenis' => 'required|in:masuk,keluar',
            'jumlah' => 'required|numeric|min:0',
            'keterangan' => 'nullabl e|string',
            'tanggal' => 'required|date',
        ]);

        DB::transaction(function () use ($request) {
            $last = TransaksiKas::where('kategori', 'mutasi')->lockForUpdate()->orderByDesc('ref_id')->first();

            $newRefId = $last ? $last->ref_id + 1 : 1;

            TransaksiKas::create([
                'by_admin' => Auth::id(),
                'user_id' => 1,
                'jenis' => $request->jenis,
                'kategori' => 'mutasi',
                'jumlah' => $request->jumlah,
                'keterangan' => $request->keterangan,
                'tanggal' => $request->tanggal,
                'ref_id' => $newRefId,
                'ref_type' => 'mutasi',
            ]);
        });

        return redirect()->back()->with('success', 'Mutasi kas berhasil ditambahkan.');
    }
}
