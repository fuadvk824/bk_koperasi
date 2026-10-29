<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\Web\DevAktiflamaDatabaruResource;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DevAktiflamaDatabaruController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $perPage = max(1, min((int) $request->input('perPage', 10), 100));

        $simpanan = DB::table('simpanan')
            ->select('user_id')
            ->selectRaw('MIN(tanggal) AS tanggal_simpanan')
            ->groupBy('user_id');

        $pinjaman = DB::table('pinjaman')
            ->select('user_id')
            ->selectRaw('MIN(tanggal_pinjaman) AS tanggal_pinjaman')
            ->groupBy('user_id');

        $transaksiKas = DB::table('transaksi_kas')
            ->whereNotNull('user_id')
            ->select('user_id')
            ->selectRaw('MIN(DATE(tanggal)) AS tanggal_transaksi_kas')
            ->groupBy('user_id');

        $query = DB::table('users as u')
            ->leftJoinSub($simpanan, 's', function ($join) {
                $join->on('s.user_id', '=', 'u.id');
            })
            ->leftJoinSub($pinjaman, 'p', function ($join) {
                $join->on('p.user_id', '=', 'u.id');
            })
            ->leftJoinSub($transaksiKas, 'tk', function ($join) {
                $join->on('tk.user_id', '=', 'u.id');
            })
            ->select([
                'u.id',
                'u.name as nama',
                'u.active_at',
                'u.inactive_at',
                'u.status',
                's.tanggal_simpanan',
                'p.tanggal_pinjaman',
                'tk.tanggal_transaksi_kas',
            ])
            ->where(function ($q) {
                $q->whereColumn(
                    's.tanggal_simpanan',
                    '<',
                    'u.active_at'
                )->orWhereColumn(
                    'p.tanggal_pinjaman',
                    '<',
                    'u.active_at'
                );
            })
            ->when($search !== '', function ($q) use ($search) {
                $q->where('u.name', 'like', '%' . $search . '%');
            })
            ->selectRaw('1 AS tandai')
            ->orderBy('u.name', 'asc');

        $data = $query->paginate($perPage)->withQueryString();

        return Inertia::render('developer/riwayat-aktivitas/index', [
            'aktivitas' => DevAktiflamaDatabaruResource::collection($data)
                ->response()
                ->getData(true),

            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
            ],
        ]);
    }
}
