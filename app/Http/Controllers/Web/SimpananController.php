<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\Web\SimpananResource;
use App\Models\Office;
use App\Models\PengaturanKoperasi;
use App\Models\Simpanan;
use App\Models\User;
use App\Models\TransaksiKas;
use App\Services\ImageUploadService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
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
        $statusUser = $request->input('statusUser', 'active');
        $perPage = $request->input('perPage', 10);

        $query = Simpanan::with('user:id,name,office_id')
            ->where('status_approval', 'disetujui')
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($sub) use ($request) {
                    $sub->whereHas('user', function ($u) use ($request) {
                        $u->where('name', 'like', '%' . $request->search . '%');
                    })->orWhere('id', $request->search);
                });
            })
            ->when($statusUser !== 'all', function ($q) use ($statusUser) {
                $q->whereHas('user', function ($u) use ($statusUser) {
                    $u->where('status', $statusUser);
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

        $simpananWajib = (clone $query)->where('jenis', 'wajib')->sum('jumlah');
        $simpananSukarela = (clone $query)->where('jenis', 'sukarela')->sum('jumlah');
        $simpananModal = (clone $query)->where('jenis', 'modal')->sum('jumlah');
        $totalSimpanan = $simpananWajib + $simpananSukarela + $simpananModal;

        /* ______________________________________________________________
        |
        |  Pengaturan Koperasi
        |  ______________________________________________________________ */

        $tanggalPeriode = Carbon::parse(
            $request->start_date ?? now()->startOfMonth()->toDateString()
        )->startOfMonth()->toDateString();

        $pengaturan = PengaturanKoperasi::query()
            ->where(function ($query) use ($tanggalPeriode) {
                $query->whereNull('berlaku_mulai')
                    ->orWhereDate('berlaku_mulai', '<=', $tanggalPeriode);
            })
            ->where(function ($query) use ($tanggalPeriode) {
                $query->whereNull('berlaku_sampai')
                    ->orWhereDate('berlaku_sampai', '>=', $tanggalPeriode);
            })
            ->orderByRaw('berlaku_mulai IS NULL ASC')
            ->orderByDesc('berlaku_mulai')
            ->orderByDesc('id')
            ->first();

        $simpananWajibSetting = (float) ($pengaturan?->simpanan_wajib ?? 0);

        /* ______________________________________________________________
        |
        |  Anggota Belum Bayar
        |  ______________________________________________________________ */

        $tanggalAwal = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : now()->startOfMonth();

        $tanggalAkhir = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : now()->endOfMonth();

        $anggota = User::query()
            ->whereNotIn('id', [1, 98])
            ->whereNotNull('active_at')
            ->whereDate('active_at', '<=', $tanggalAkhir)
            ->where(function ($query) use ($tanggalAkhir) {
                $query->whereNull('inactive_at')
                    ->orWhereDate('inactive_at', '>', $tanggalAkhir);
            })
            ->when($statusUser !== 'all', function ($query) use ($statusUser) {
                $query->where('status', $statusUser);
            })
            ->when($request->filled('office_id'), function ($query) use ($request) {
                $query->where('office_id', $request->office_id);
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'like', '%' . $request->search . '%');
            })
            ->orderBy('name')
            ->get();

        $totalAnggotaWajibBayar = $anggota->count();

        $pembayaranWajib = Simpanan::query()
            ->where('jenis', 'wajib')
            ->where('status_approval', 'disetujui')
            ->whereBetween('tanggal', [
                $tanggalAwal->toDateString(),
                $tanggalAkhir->toDateString(),
            ])
            ->selectRaw('user_id, SUM(jumlah) as total_dibayar')
            ->groupBy('user_id')
            ->pluck('total_dibayar', 'user_id');

        $penarikanSimpanan = Simpanan::query()
            ->where('jenis', 'penarikan')
            ->whereBetween('tanggal', [
                $tanggalAwal->toDateString(),
                $tanggalAkhir->toDateString(),
            ])
            ->selectRaw('user_id, SUM(ABS(jumlah)) as total_penarikan')
            ->groupBy('user_id')
            ->pluck('total_penarikan', 'user_id');

        $anggotaBelumBayar = $anggota
            ->map(function ($user) use (
                $pembayaranWajib,
                $penarikanSimpanan,
                $simpananWajibSetting
            ) {
                $target = (float) $simpananWajibSetting;
                $dibayar = (float) ($pembayaranWajib[$user->id] ?? 0);
                $penarikan = (float) ($penarikanSimpanan[$user->id] ?? 0);

                return [
                    'user_id' => $user->id,
                    'nama' => $user->name,
                    'status' => $user->status,

                    // Tambahkan tanggal keanggotaan
                    'active_at' => $user->active_at?->format('Y-m-d'),
                    'inactive_at' => $user->inactive_at?->format('Y-m-d'),

                    'target' => $target,
                    'dibayar' => $dibayar,
                    'penarikan' => $penarikan,
                    'kekurangan' => max(0, $target - $dibayar),
                ];
            })
            ->filter(fn($user) => $user['kekurangan'] > 0)
            ->values();

        $totalAnggotaBelumBayar = $anggotaBelumBayar->count();
        $totalKekuranganAnggota = $anggotaBelumBayar->sum('kekurangan');

        return Inertia::render('simpanan/index', [
            'simpanan' => SimpananResource::collection($data)->response()->getData(true),
            'filters' => [
                'search' => $request->search,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'office_id' => $request->office_id,
                'jenis' => $request->jenis,
                'statusUser' => $request->statusUser,
                'perPage' => $perPage,
            ],
            'users' => User::select('id', 'name')->get(),
            'offices' => Office::select('id', 'name')->orderBy('name')->get(),
            'simpananWajib' => (float) $simpananWajib,
            'simpananSukarela' => (float) $simpananSukarela,
            'totalSimpanan' => (float) $totalSimpanan,
            'simpananModal' => (float) $simpananModal,

            'simpananWajibSetting' => (float) $simpananWajibSetting,

            'anggotaBelumBayar' => $anggotaBelumBayar,
            'totalAnggotaBelumBayar' => $totalAnggotaBelumBayar,
            'totalAnggotaWajibBayar' => $totalAnggotaWajibBayar,
            'totalKekuranganAnggota' => (float) $totalKekuranganAnggota,
        ]);
    }

    public function store(Request $request)
    {
        /** @var \App\Models\User|null $admin */
        $admin = Auth::user();

        if (!$admin || !$admin->hasAnyRole(['super-admin', 'admin'])) {
            abort(403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'jenis' => 'required|in:wajib,sukarela,modal',
            'jumlah' => 'nullable|numeric|min:0',
            'tanggal' => 'required|date',
            'custom_jumlah' => 'nullable|boolean',
            'bukti_transfer' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
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

        $customJumlah = filter_var(
            $validated['custom_jumlah'] ?? false,
            FILTER_VALIDATE_BOOLEAN
        );

        if ($validated['jenis'] === 'wajib' && !$customJumlah) {
            $jumlah = $pengaturan->simpanan_wajib;
        } else {
            $jumlah = $validated['jumlah'] ?? 0;
        }

        if ($jumlah <= 0) {
            return back()->withErrors([
                'jumlah' => 'Jumlah simpanan harus lebih dari 0.',
            ]);
        }

        $buktiTransfer = null;

        if ($request->hasFile('bukti_transfer')) {
            $buktiTransfer = $this->imageService->upload(
                $request->file('bukti_transfer'),
                'bukti_transfer',
                (string) $validated['user_id'],
                'simpanan'
            );
        }

        DB::transaction(function () use ($validated, $jumlah, $buktiTransfer) {
            $simpanan = Simpanan::create([
                'user_id' => $validated['user_id'],
                'jenis' => $validated['jenis'],
                'jumlah' => $jumlah,
                'tanggal' => $validated['tanggal'],
                'bukti_transfer' => $buktiTransfer,
            ]);

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

        return redirect()
            ->back()
            ->with('success', 'Data simpanan berhasil ditambahkan');
    }

    public function update(Request $request, Simpanan $simpanan)
    {
        if ($simpanan->jenis === 'sukarela') {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'simpanan' => 'Simpanan sukarela tidak bisa diubah',
            ]);
        }

        /** @var \App\Models\User|null $admin */
        $admin = Auth::user();

        if (!$admin || !$admin->hasAnyRole(['super-admin', 'admin'])) {
            return;
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
