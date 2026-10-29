<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImageUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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

        $validated = $request->validate([
            'jenis' => [
                'nullable',
                Rule::in(['wajib', 'sukarela', 'modal', 'penarikan']),
            ],
            'dari' => ['nullable', 'date'],
            'sampai' => ['nullable', 'date', 'after_or_equal:dari'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = DB::table('simpanan')
            ->where('user_id', $user->id);

        if (! empty($validated['jenis'])) {
            $query->where('jenis', $validated['jenis']);
        }

        if (! empty($validated['dari'])) {
            $query->whereDate('tanggal', '>=', $validated['dari']);
        }

        if (! empty($validated['sampai'])) {
            $query->whereDate('tanggal', '<=', $validated['sampai']);
        }

        $data = (clone $query)
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->paginate($validated['per_page'] ?? 15);

        $ringkasan = DB::table('simpanan')
            ->where('user_id', $user->id)
            ->where('status', 'disetujui')
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

        return response()->json([
            'ringkasan' => [
                'simpanan_wajib' => (float) $ringkasan->simpanan_wajib,
                'simpanan_sukarela' => (float) $ringkasan->simpanan_sukarela,
                'simpanan_modal' => (float) $ringkasan->simpanan_modal,
                'total_simpanan' => (float) (
                    $ringkasan->simpanan_wajib
                    + $ringkasan->simpanan_sukarela
                    + $ringkasan->simpanan_modal
                ),
            ],
            'data' => $data->getCollection()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'jenis' => $item->jenis,
                    'jumlah' => (float) $item->jumlah,
                    'tanggal' => $item->tanggal,
                    'status' => $item->status,
                    'catatan' => $item->catatan,
                    'bukti_transfer' => $item->bukti_transfer,
                    'created_at' => $item->created_at,
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
        $simpanan = DB::table('simpanan')
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $simpanan) {
            return response()->json([
                'message' => 'Data simpanan tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'data' => [
                'id' => $simpanan->id,
                'jenis' => $simpanan->jenis,
                'jumlah' => (float) $simpanan->jumlah,
                'tanggal' => $simpanan->tanggal,
                'created_at' => $simpanan->created_at,
            ],
        ]);
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

        // Gunakan helper upload dari project absensi.
        // Sesuaikan nama service dengan implementasi project kamu.

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
                    'status' => 'menunggu',
                    'bukti_transfer' => $path,
                  
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                return DB::table('simpanan')
                    ->where('id', $id)
                    ->first();
            });
        } catch (\Throwable $e) {
            // Jangan meninggalkan file yatim jika penyimpanan database gagal.
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
                'status' => $simpanan->status,
                'bukti_transfer' => $simpanan->bukti_transfer,
                'created_at' => $simpanan->created_at,
            ],
        ], 201);
    }
}
