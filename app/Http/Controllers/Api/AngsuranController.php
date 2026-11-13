<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImageUploadService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AngsuranController extends Controller
{
    protected ImageUploadService $imageService;
    public function __construct(ImageUploadService $imageService)
    {
        $this->imageService = $imageService;
    }

    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $data = DB::table('angsuran as a')
            ->join('pinjaman as p', 'p.id', '=', 'a.pinjaman_id')
            ->where('a.user_id', $userId)
            ->where('p.user_id', $userId)
            ->where('p.status', 'aktif')
            ->where('p.status_approval', 'disetujui')
            ->select([
                'a.id',
                'a.user_id',
                'a.pinjaman_id',
                'a.angsuran_ke',
                'a.dana_pinjaman',
                'a.jumlah_bayar',
                'a.bunga_bayar',
                'a.real_bayar',
                'a.bulan',
                'a.tahun',
                'a.status',
                'a.status_approval',
                'a.tanggal_bayar',
                'p.lama_angsuran',
                'p.jumlah_pinjaman',
                'p.status as status_pinjaman',
            ])
            ->orderBy('a.tahun')
            ->orderBy('a.bulan')
            ->orderBy('a.angsuran_ke')
            ->get()
            ->map(function ($item) {
                $item->tanggal_jatuh_tempo = Carbon::create(
                    (int) $item->tahun,
                    (int) $item->bulan,
                    1
                )->endOfMonth()->toDateString();

                $item->nomor_pinjaman = (string) $item->pinjaman_id;

                return $item;
            });

        return response()->json([
            'message' => 'Data angsuran berhasil diambil.',
            'data' => $data,
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
                // 'angsuran.status',
                // 'angsuran.status_approval',
                // 'angsuran.catatan_approval',
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

    public function store(Request $request, int $angsuranId)
    {
        $user = $request->user();
        $userId = $user->id;

        // Validasi bukti transfer
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

        $path = null;

        try {
            $angsuran = DB::transaction(function () use (
                $userId,
                $angsuranId,
                $validated,
                &$path
            ) {
                // Cari angsuran milik user dan kunci selama transaksi
                $angsuran = DB::table('angsuran')
                    ->where('id', $angsuranId)
                    ->where('user_id', $userId)
                    ->lockForUpdate()
                    ->first();

                if (! $angsuran) {
                    abort(404, 'Data angsuran tidak ditemukan.');
                }

                if ($angsuran->status === 'sudah_bayar') {
                    abort(422, 'Angsuran ini sudah dibayar.');
                }

                if ($angsuran->status_approval === 'menunggu') {
                    abort(
                        422,
                        'Pengajuan pembayaran angsuran masih menunggu persetujuan admin.'
                    );
                }

                if ($angsuran->status_approval === 'disetujui') {
                    abort(
                        422,
                        'Pengajuan angsuran ini sudah disetujui.'
                    );
                }

                // Periksa pinjaman terkait
                $pinjaman = DB::table('pinjaman')
                    ->where('id', $angsuran->pinjaman_id)
                    ->where('user_id', $userId)
                    ->lockForUpdate()
                    ->first();

                if (! $pinjaman) {
                    abort(404, 'Data pinjaman tidak ditemukan.');
                }

                if (
                    $pinjaman->status !== 'aktif' ||
                    $pinjaman->status_approval !== 'disetujui'
                ) {
                    abort(
                        422,
                        'Pinjaman belum disetujui atau sudah tidak aktif.'
                    );
                }

                // Upload bukti transfer
                $path = $this->imageService->upload(
                    $validated['bukti_transfer'],
                    'bukti_angsuran_',
                    (string) $userId,
                    'angsuran/bukti-transfer'
                );

                // Simpan path bukti transfer dan status pengajuan
                DB::table('angsuran')
                    ->where('id', $angsuranId)
                    ->update([
                        'status_approval' => 'menunggu',
                        'bukti_transfer' => $path,
                        'updated_at' => now(),
                    ]);

                return DB::table('angsuran')
                    ->where('id', $angsuranId)
                    ->first();
            });
        } catch (\Throwable $e) {
            // Hapus file jika transaksi database gagal
            if ($path) {
                Storage::disk('public')->delete($path);
            }

            throw $e;
        }

        return response()->json([
            'message' => 'Pengajuan pembayaran angsuran berhasil dikirim dan menunggu persetujuan admin.',
            'data' => [
                'id' => $angsuran->id,
                'pinjaman_id' => $angsuran->pinjaman_id,
                'jumlah_bayar' => (float) $angsuran->jumlah_bayar,
                'status' => $angsuran->status,
                'status_approval' => $angsuran->status_approval,
                'bukti_transfer' => $angsuran->bukti_transfer,
                'updated_at' => $angsuran->updated_at,
            ],
        ], 201);
    }
}
