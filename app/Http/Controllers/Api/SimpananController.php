<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImageUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SimpananController extends Controller
{
    protected ImageUploadService $imageService;
    public function __construct(ImageUploadService $imageService)
    {
        $this->imageService = $imageService;
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $ringkasan = DB::table('simpanan')
            ->where('user_id', $user->id)
            ->where('status_approval', 'disetujui')
            ->selectRaw("
            COALESCE(SUM(
                CASE WHEN jenis = 'wajib' THEN jumlah ELSE 0 END
            ), 0) as simpanan_wajib,

            COALESCE(SUM(
                CASE WHEN jenis = 'sukarela' THEN jumlah ELSE 0 END
            ), 0) as simpanan_sukarela,

            COALESCE(SUM(
                CASE WHEN jenis = 'modal' THEN jumlah ELSE 0 END
            ), 0) as simpanan_modal
        ")
            ->first();

        $simpananWajib = (float) $ringkasan->simpanan_wajib;
        $simpananSukarela = (float) $ringkasan->simpanan_sukarela;
        $simpananModal = (float) $ringkasan->simpanan_modal;

        // $data = DB::table('simpanan')
        //     ->where('user_id', $user->id)
        //     ->select([
        //         'id',
        //         'jenis',
        //         'jumlah',
        //         'tanggal',
        //         'status_approval',
        //     ])
        //     ->orderByDesc('tanggal')
        //     ->orderByDesc('id')
        //     ->get()
        //     ->map(function ($item) {
        //         return [
        //             'id' => $item->id,
        //             'jenis' => $item->jenis,
        //             'jumlah' => (float) $item->jumlah,
        //             'tanggal' => $item->tanggal,
        //             'status_approval' => $item->status_approval,
        //         ];
        //     });
        $data = DB::table('simpanan')
            ->where('user_id', $user->id)
            ->select([
                'id',
                'jenis',
                'jumlah',
                'tanggal',
                'status_approval',
            ])
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->limit(6)
            ->get();

        $riwayatHasMore = $data->count() > 5;

        $data = $data->take(5)->map(function ($item) {
            return [
                'id' => $item->id,
                'jenis' => $item->jenis,
                'jumlah' => (float) $item->jumlah,
                'tanggal' => $item->tanggal,
                'status_approval' => $item->status_approval,
            ];
        });

        return response()->json([
            'ringkasan' => [
                'simpanan_wajib' => $simpananWajib,
                'simpanan_sukarela' => $simpananSukarela,
                'simpanan_modal' => $simpananModal,
                'total_simpanan' => $simpananWajib
                    + $simpananSukarela
                    + $simpananModal,
            ],
            'data' => $data,
            'riwayat_has_more' => $riwayatHasMore,

        ]);
    }

    public function riwayat(Request $request)
    {
        $user = $request->user();

        $transaksi = DB::table('simpanan')
            ->where('user_id', $user->id)
            ->select([
                'id',
                'jenis',
                'jumlah',
                'tanggal',
                'status_approval',
            ])
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->paginate(5);

        $transaksi->through(function ($item) {
            return [
                'id' => $item->id,
                'jenis' => $item->jenis,
                'jumlah' => (float) $item->jumlah,
                'tanggal' => $item->tanggal,
                'status_approval' => $item->status_approval,
            ];
        });

        return response()->json($transaksi);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (! $user || $user->status !== 'active') {
            return response()->json([
                'message' => 'Hanya anggota aktif yang dapat mengajukan simpanan wajib.',
            ], 403);
        }

        $validated = $request->validate([
            'bukti_transfer' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ], [
            'bukti_transfer.required' => 'Bukti transfer wajib diunggah.',
            'bukti_transfer.image' => 'File harus berupa gambar.',
            'bukti_transfer.mimes' => 'Format bukti transfer harus JPG, JPEG, PNG, atau WebP.',
            'bukti_transfer.max' => 'Ukuran gambar maksimal 5 MB.',
        ]);

        $tanggal = now()->toDateString();

        $pengaturan = DB::table('pengaturan_koperasi')
            ->whereDate('berlaku_mulai', '<=', $tanggal)
            ->where(function ($query) use ($tanggal) {
                $query->whereNull('berlaku_sampai')
                    ->orWhereDate('berlaku_sampai', '>=', $tanggal);
            })
            ->orderByDesc('berlaku_mulai')
            ->orderByDesc('id')
            ->first();

        if (! $pengaturan || $pengaturan->simpanan_wajib <= 0) {
            return response()->json([
                'message' => 'Pengaturan simpanan wajib belum tersedia atau tidak berlaku.',
            ], 422);
        }

        $jumlah = (float) $pengaturan->simpanan_wajib;

        $path = $this->imageService->upload(
            $validated['bukti_transfer'],
            'bukti_simpanan_',
            (string) $user->id,
            'simpanan/bukti-transfer'
        );

        try {
            $simpanan = DB::transaction(function () use (
                $user,
                $tanggal,
                $jumlah,
                $path
            ) {
                $id = DB::table('simpanan')->insertGetId([
                    'user_id' => $user->id,
                    'jenis' => 'wajib',
                    'jumlah' => $jumlah,
                    'tanggal' => $tanggal,
                    'status_approval' => 'menunggu',
                    'bukti_transfer' => $path,

                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                return DB::table('simpanan')
                    ->where('id', $id)
                    ->first();
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($path);

            throw $e;
        }

        return response()->json([
            'message' => 'Pengajuan simpanan wajib berhasil dikirim dan menunggu persetujuan admin.',
            'data' => [
                'id' => $simpanan->id,
                'jenis' => $simpanan->jenis,
                'jumlah' => (float) $simpanan->jumlah,
                'tanggal' => $simpanan->tanggal,
                'status_approval' => $simpanan->status_approval,
                'bukti_transfer' => $simpanan->bukti_transfer,
                'created_at' => $simpanan->created_at,
            ],
        ], 201);
    }
}
    