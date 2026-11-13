<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImageUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PinjamanController extends Controller
{
    protected ImageUploadService $imageService;
    public function __construct(ImageUploadService $imageService)
    {
        $this->imageService = $imageService;
    }

    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $daftarAntrian = DB::table('pinjaman')
            ->join('users', 'users.id', '=', 'pinjaman.user_id')
            ->where('pinjaman.status_approval', 'menunggu')
            ->orderBy('pinjaman.created_at')
            ->orderBy('pinjaman.id')
            ->get([
                'pinjaman.user_id',
                'pinjaman.created_at',
                'pinjaman.tanggal_pinjaman',
                'users.name',
            ]);

        $posisiSaya = $daftarAntrian->search(function ($item) use ($userId) {
            return (int) $item->user_id === (int) $userId;
        });

        $antrian = null;

        if ($posisiSaya !== false) {
            $antrian = [
                'posisi_saya' => $posisiSaya + 1,
                'total_antrian' => $daftarAntrian->count(),

                'anggota_menunggu' => $daftarAntrian
                    ->values()
                    ->map(function ($item, $index) {
                        return [
                            'posisi' => $index + 1,
                            'nama' => $item->name,
                            'tanggal_pengajuan' => $item->tanggal_pinjaman,
                        ];
                    })
                    ->all(),
            ];
        }

        
        $pinjaman = DB::table('pinjaman')
            ->where('user_id', $userId)
            ->orderByRaw("
            CASE
                WHEN status_approval = 'menunggu' THEN 0
                WHEN status_approval = 'disetujui'
                    AND status = 'aktif' THEN 1
                ELSE 2
            END
        ")
            ->orderByDesc('id')
            ->first();

       
        $pinjamanDisetujui = DB::table('pinjaman')
            ->where('user_id', $userId)
            ->where('status_approval', 'disetujui');

        $ringkasan = [
            'total_pinjaman' => (float) (clone $pinjamanDisetujui)
                ->sum('total_pinjaman'),

            'sisa_pinjaman' => (float) (clone $pinjamanDisetujui)
                ->where('status', 'aktif')
                ->sum('sisa_pinjaman'),

            'jumlah_pinjaman_aktif' => (clone $pinjamanDisetujui)
                ->where('status', 'aktif')
                ->count(),
        ];

       
        if (!$pinjaman) {
            return response()->json([
                'data' => null,
                'ringkasan' => $ringkasan,
                'antrian' => null,
            ]);
        }

        $angsuran = DB::table('angsuran')
            ->where('pinjaman_id', $pinjaman->id)
            ->orderBy('angsuran_ke')
            ->get([
                'id',
                'angsuran_ke',
                'dana_pinjaman',
                'jumlah_bayar',
                'bunga_bayar',
                'real_bayar',
                'bulan',
                'tahun',
                'tanggal_bayar',
                'status',
            ])
            ->map(function ($item) {
                return [
                    'id' => (int) $item->id,
                    'angsuran_ke' => (int) $item->angsuran_ke,
                    'dana_pinjaman' => (float) $item->dana_pinjaman,
                    'jumlah_bayar' => (float) $item->jumlah_bayar,
                    'bunga_bayar' => (float) $item->bunga_bayar,

                    'real_bayar' => $item->real_bayar !== null
                        ? (float) $item->real_bayar
                        : null,

                    'bulan' => (int) $item->bulan,
                    'tahun' => (int) $item->tahun,
                    'tanggal_bayar' => $item->tanggal_bayar,
                    'status' => $item->status,
                ];
            })
            ->values();

        $data = [
            'id' => (int) $pinjaman->id,

            'jumlah_pinjaman' => (float) $pinjaman->jumlah_pinjaman,
            'bunga_persen' => (float) $pinjaman->bunga_persen,
            'total_pinjaman' => (float) $pinjaman->total_pinjaman,
            'sisa_pinjaman' => (float) $pinjaman->sisa_pinjaman,

            'lama_angsuran' => (int) $pinjaman->lama_angsuran,

            'angsuran_per_bulan' => (float) $pinjaman->angsuran_per_bulan,
            'angsuran_bulan_terakhir' => (float) $pinjaman->angsuran_bulan_terakhir,

            'tanggal_pinjaman' => $pinjaman->tanggal_pinjaman,
            'jatuh_tempo_terakhir' => $pinjaman->jatuh_tempo_terakhir,

            'status' => $pinjaman->status,
            'status_approval' => $pinjaman->status_approval,

            'catatan_approval' => $pinjaman->catatan_approval ?? null,

            'angsuran' => $angsuran,
        ];


        return response()->json([
            'data' => $data,
            'ringkasan' => $ringkasan,
            'antrian' => $antrian,
        ]);
    }

    public function bungaPinjaman()
    {
        $tanggal = now()->toDateString();

        $pengaturan = DB::table('pengaturan_koperasi')
            ->where(function ($query) use ($tanggal) {
                $query->whereNull('berlaku_mulai')
                    ->orWhereDate('berlaku_mulai', '<=', $tanggal);
            })
            ->where(function ($query) use ($tanggal) {
                $query->whereNull('berlaku_sampai')
                    ->orWhereDate('berlaku_sampai', '>=', $tanggal);
            })
            ->orderByRaw('berlaku_mulai IS NULL ASC')
            ->orderByDesc('berlaku_mulai')
            ->orderByDesc('id')
            ->first();

        return response()->json([
            'data' => [
                'bunga_pinjaman' => (float) (
                    $pengaturan->bunga_pinjaman ?? 0
                ),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'jumlah_pinjaman' => [
                'required',
                'integer',
            ],
            'lama_angsuran' => [
                'required',
                'integer',
            ],
            'surat_pengajuan' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf',
                'max:5120',
            ],
        ], [
            'surat_pengajuan.required' => 'Surat pengajuan wajib diunggah.',
            'surat_pengajuan.file' => 'File surat pengajuan tidak valid.',
            'surat_pengajuan.mimes' => 'Format surat pengajuan harus JPG, JPEG, PNG, WebP, atau PDF.',
            'surat_pengajuan.max' => 'Ukuran file maksimal 5 MB.',
        ]);

        $userId = $request->user()->id;
        $path = null;

        try {
            $pinjaman = DB::transaction(function () use (
                $validated,
                $userId,
                &$path,
            ) {
                
                $suratPengajuan = $validated['surat_pengajuan'];
                $anggota = DB::table('users')
                    ->where('id', $userId)
                    ->lockForUpdate()
                    ->first();

                if (
                    ! $anggota ||
                    $anggota->status !== 'active' ||
                    $anggota->active_at === null
                ) {
                    abort(403, 'Hanya anggota aktif yang dapat mengajukan pinjaman.');
                }

                $adaPengajuan = DB::table('pinjaman')
                    ->where('user_id', $userId)
                    ->where(function ($query) {
                        $query->where('status_approval', 'menunggu')
                            ->orWhere(function ($q) {
                                $q->where('status_approval', 'disetujui')
                                    ->where('status', 'aktif');
                            });
                    })
                    ->exists();

                if ($adaPengajuan) {
                    abort(
                        422,
                        'Kamu masih memiliki pengajuan yang menunggu '
                            . 'persetujuan atau pinjaman aktif.'
                    );
                }

                $tanggal = now()->toDateString();

                $pengaturan = DB::table('pengaturan_koperasi')
                    ->where(function ($query) use ($tanggal) {
                        $query->whereNull('berlaku_mulai')
                            ->orWhereDate('berlaku_mulai', '<=', $tanggal);
                    })
                    ->where(function ($query) use ($tanggal) {
                        $query->whereNull('berlaku_sampai')
                            ->orWhereDate('berlaku_sampai', '>=', $tanggal);
                    })
                    ->orderByRaw('berlaku_mulai IS NULL ASC')
                    ->orderByDesc('berlaku_mulai')
                    ->orderByDesc('id')
                    ->first();

                if (! $pengaturan) {
                    abort(
                        422,
                        'Pengaturan bunga pinjaman belum tersedia untuk tanggal ini.'
                    );
                }

                $jumlah = (int) $validated['jumlah_pinjaman'];
                $tenor = (int) $validated['lama_angsuran'];
                $bungaPersen = (float) $pengaturan->bunga_pinjaman;

                if ($bungaPersen < 0) {
                    abort(422, 'Pengaturan bunga pinjaman tidak valid.');
                }

                $totalBunga = ($jumlah * $bungaPersen) / 100;
                $total = $jumlah + $totalBunga;

                $angsuranNormal = floor(($total / $tenor) / 100) * 100;
                $totalAngsuranNormal = $angsuranNormal * $tenor;
                $sisaPembulatan = $total - $totalAngsuranNormal;

                $path = $this->imageService->upload(
                    $suratPengajuan,
                    'surat_pengajuan_',
                    (string) $userId,
                    'pinjaman/surat-pengajuan'
                );

                return DB::table('pinjaman')->insertGetId([
                    'user_id' => $userId,
                    'jumlah_pinjaman' => $jumlah,
                    'bunga_persen' => $bungaPersen,
                    'total_pinjaman' => $total,
                    'sisa_pinjaman' => $total,
                    'lama_angsuran' => $tenor,
                    'angsuran_per_bulan' => $angsuranNormal,
                    'angsuran_bulan_terakhir' => $angsuranNormal + $sisaPembulatan,
                    'tanggal_pinjaman' => $tanggal,
                    'jatuh_tempo_terakhir' => null,
                    'status' => 'aktif',
                    'status_approval' => 'menunggu',
                    'surat_pengajuan' => $path,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });
        } catch (\Throwable $e) {
            if ($path) {
                Storage::disk('public')->delete($path);
            }

            throw $e;
        }

        return response()->json([
            'message' => 'Pengajuan pinjaman berhasil dikirim dan menunggu persetujuan admin.',
            'data' => DB::table('pinjaman')->where('id', $pinjaman)->first(),
        ], 201);
    }

    public function destroy(Request $request, int $id)
    {
        $userId = $request->user()->id;

        $suratPengajuan = DB::transaction(function () use (
            $id,
            $userId
        ) {
            $pinjaman = DB::table('pinjaman')
                ->where('id', $id)
                ->where('user_id', $userId)
                ->lockForUpdate()
                ->first();

            if (!$pinjaman) {
                abort(404, 'Pengajuan pinjaman tidak ditemukan.');
            }

            if ($pinjaman->status_approval !== 'menunggu') {
                abort(
                    422,
                    'Pengajuan tidak dapat dibatalkan karena sudah tidak menunggu persetujuan.'
                );
            }

            $path = $pinjaman->surat_pengajuan;

            DB::table('pinjaman')
                ->where('id', $pinjaman->id)
                ->delete();

            return $path;
        });

        if ($suratPengajuan) {
            Storage::disk('public')->delete($suratPengajuan);
        }

        return response()->json([
            'message' => 'Pengajuan pinjaman berhasil dibatalkan.',
        ]);
    }
}
