<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AngsuranController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'status' => [
                'nullable',
                Rule::in(['belum_bayar', 'sudah_bayar']),
            ],
            'pinjaman_id' => [
                'nullable',
                'integer',
            ],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = DB::table('angsuran')
            ->join('pinjaman', 'pinjaman.id', '=', 'angsuran.pinjaman_id')
            ->where('angsuran.user_id', $request->user()->id)
            ->where('pinjaman.user_id', $request->user()->id)
            ->select([
                'angsuran.id',
                'angsuran.pinjaman_id',
                'angsuran.angsuran_ke',
                'angsuran.dana_pinjaman',
                'angsuran.jumlah_bayar',
                'angsuran.bunga_bayar',
                'angsuran.real_bayar',
                'angsuran.bulan',
                'angsuran.tahun',
                'angsuran.tanggal_bayar',
                'angsuran.status',
                'pinjaman.id as id_pinjaman',
                'pinjaman.lama_angsuran',
                'pinjaman.total_pinjaman',
                'pinjaman.sisa_pinjaman',
                'pinjaman.status as status_pinjaman',
            ]);

        if (! empty($validated['status'])) {
            $query->where('angsuran.status', $validated['status']);
        }

        if (! empty($validated['pinjaman_id'])) {
            $query->where('angsuran.pinjaman_id', $validated['pinjaman_id']);
        }

        $data = $query
            ->orderBy('angsuran.tahun')
            ->orderBy('angsuran.bulan')
            ->orderBy('angsuran.angsuran_ke')
            ->paginate($validated['per_page'] ?? 15);

        $ringkasanQuery = DB::table('angsuran')
            ->where('user_id', $request->user()->id);

        if (! empty($validated['pinjaman_id'])) {
            $ringkasanQuery->where(
                'pinjaman_id',
                $validated['pinjaman_id']
            );
        }

        $ringkasan = (clone $ringkasanQuery)
            ->selectRaw("
                COUNT(*) as total_angsuran,
                SUM(CASE WHEN status = 'sudah_bayar' THEN 1 ELSE 0 END) as sudah_bayar,
                SUM(CASE WHEN status = 'belum_bayar' THEN 1 ELSE 0 END) as belum_bayar
            ")
            ->first();

        return response()->json([
            'ringkasan' => [
                'total_angsuran' => (int) $ringkasan->total_angsuran,
                'sudah_bayar' => (int) $ringkasan->sudah_bayar,
                'belum_bayar' => (int) $ringkasan->belum_bayar,
            ],
            'data' => $data->getCollection()->map(function ($item) {
                // return [
                //     'id' => $item->id,
                //     'pinjaman_id' => $item->pinjaman_id,
                //     'angsuran_ke' => $item->angsuran_ke,
                //     'dana_pinjaman' => (float) $item->dana_pinjaman,
                //     'jumlah_bayar' => (float) $item->jumlah_bayar,
                //     'bunga_bayar' => (float) $item->bunga_bayar,
                //     'real_bayar' => $item->real_bayar === null
                //         ? null
                //         : (float) $item->real_bayar,
                //     'bulan' => $item->bulan,
                //     'tahun' => $item->tahun,
                //     'tanggal_bayar' => $item->tanggal_bayar,
                //     'status' => $item->status,
                //     'total_pinjaman' => (float) $item->total_pinjaman,
                //     'sisa_pinjaman' => (float) $item->sisa_pinjaman,
                //     'status_pinjaman' => $item->status_pinjaman,
                // ];
                return [
                    'id' => $item->id,

                    'nomor_pinjaman' => (string) $item->id_pinjaman,

                    'pinjaman_id' => $item->pinjaman_id,
                    'angsuran_ke' => $item->angsuran_ke,
                    'total_angsuran' => (int) $item->lama_angsuran,

                    'dana_pinjaman' => (float) $item->dana_pinjaman,
                    'jumlah_bayar' => (float) $item->jumlah_bayar,
                    'bunga_bayar' => (float) $item->bunga_bayar,
                    'real_bayar' => $item->real_bayar === null
                        ? null
                        : (float) $item->real_bayar,

                    'bulan' => (int) $item->bulan,
                    'tahun' => (int) $item->tahun,

                    // Asumsi tanggal jatuh tempo adalah tanggal 1
                    // pada bulan dan tahun periode angsuran.
                    'tanggal_jatuh_tempo' => sprintf(
                        '%04d-%02d-01',
                        $item->tahun,
                        $item->bulan
                    ),

                    'tanggal_bayar' => $item->tanggal_bayar,
                    'status' => $item->status,

                    'total_pinjaman' => (float) $item->total_pinjaman,
                    'sisa_pinjaman' => (float) $item->sisa_pinjaman,
                    'status_pinjaman' => $item->status_pinjaman,
                ];
            })->values(),
            'pagination' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id)
    {
        $item = DB::table('angsuran')
            ->join('pinjaman', 'pinjaman.id', '=', 'angsuran.pinjaman_id')
            ->where('angsuran.id', $id)
            ->where('angsuran.user_id', $request->user()->id)
            ->where('pinjaman.user_id', $request->user()->id)
            ->select([
                'angsuran.*',
                'pinjaman.total_pinjaman',
                'pinjaman.sisa_pinjaman',
                'pinjaman.status as status_pinjaman',
            ])
            ->first();

        if (! $item) {
            return response()->json([
                'message' => 'Data angsuran tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'data' => [
                'id' => $item->id,
                'pinjaman_id' => $item->pinjaman_id,
                'angsuran_ke' => $item->angsuran_ke,
                'dana_pinjaman' => (float) $item->dana_pinjaman,
                'jumlah_bayar' => (float) $item->jumlah_bayar,
                'bunga_bayar' => (float) $item->bunga_bayar,
                'real_bayar' => $item->real_bayar === null
                    ? null
                    : (float) $item->real_bayar,
                'bulan' => $item->bulan,
                'tahun' => $item->tahun,
                'tanggal_bayar' => $item->tanggal_bayar,
                'status' => $item->status,
                'total_pinjaman' => (float) $item->total_pinjaman,
                'sisa_pinjaman' => (float) $item->sisa_pinjaman,
                'status_pinjaman' => $item->status_pinjaman,
            ],
        ]);
    }
}
