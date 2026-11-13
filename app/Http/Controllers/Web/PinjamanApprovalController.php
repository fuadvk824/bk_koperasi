<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\Web\PinjamanResource;
use App\Models\Angsuran;
use App\Models\Office;
use App\Models\Pinjaman;
use App\Models\TransaksiKas;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PinjamanApprovalController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);

        $query = Pinjaman::with('user:id,name,office_id')
            ->where('status_approval', 'menunggu')
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
            ->when($request->start_date && $request->end_date, function ($q) use ($request) {
                $q->whereBetween('tanggal_pinjaman', [$request->start_date, $request->end_date]);
            });

        $data = (clone $query)->orderBy('tanggal_pinjaman', 'asc')->paginate($perPage)->withQueryString();

        $total = (clone $query)->sum('jumlah_pinjaman');

        return Inertia::render('pinjaman/approval/index', [
            'pinjaman' => PinjamanResource::collection($data)->response()->getData(true),
            'filters' => [
                'search' => $request->search,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'office_id' => $request->office_id,
                'perPage' => $perPage,
            ],
            'offices' => Office::select('id', 'name')->orderBy('name')->get(),
            'total' => (float) $total,
        ]);
    }

    public function updateStatus(Request $request, Pinjaman $pinjaman)
    {
        $validated = $request->validate([
            'status_approval'  => ['required', 'in:disetujui,ditolak'],
            'catatan_approval' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            DB::transaction(function () use ($validated, $pinjaman) {

                $pinjaman = Pinjaman::whereKey($pinjaman->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($pinjaman->status_approval !== 'menunggu') {
                    throw new \RuntimeException('Pengajuan pinjaman sudah diproses.');
                }

                // ===== DITOLAK =====
                if ($validated['status_approval'] === 'ditolak') {
                    $pinjaman->update([
                        'status_approval'  => 'ditolak',
                        'catatan_approval' => $validated['catatan_approval'] ?? null,
                    ]);
                    return;
                }

                // ===== DISETUJUI =====
                if (Angsuran::where('pinjaman_id', $pinjaman->id)->exists()) {
                    throw new \RuntimeException('Jadwal angsuran untuk pinjaman ini sudah ada.');
                }

                // Tanggal pencairan = tanggal disetujui
                $tanggalPencairan = Carbon::today();

                $lama             = (int) $pinjaman->lama_angsuran;
                $jumlahPinjaman   = (float) $pinjaman->jumlah_pinjaman;
                $angsuranBulat    = (float) $pinjaman->angsuran_per_bulan;
                $angsuranTerakhir = (float) $pinjaman->angsuran_bulan_terakhir;

                // Pokok dibulatkan ke bawah per 100, sisa masuk ke angsuran terakhir
                $pokokBulat = floor(($jumlahPinjaman / $lama) / 100) * 100;
                $sisaPokok  = $jumlahPinjaman - ($pokokBulat * $lama);

                // Angsuran pertama mulai bulan depan
                $start = $tanggalPencairan->copy()->startOfMonth()->addMonth();

                for ($i = 0; $i < $lama; $i++) {
                    $tanggal  = $start->copy()->addMonthsNoOverflow($i);
                    $isLast   = $i === $lama - 1;

                    $jumlahBayar  = $isLast ? $angsuranTerakhir : $angsuranBulat;
                    $danaPinjaman = $isLast ? $pokokBulat + $sisaPokok : $pokokBulat;
                    $bungaBayar   = $jumlahBayar - $danaPinjaman;

                    Angsuran::create([
                        'pinjaman_id'   => $pinjaman->id,
                        'user_id'       => $pinjaman->user_id,
                        'angsuran_ke'   => $i + 1,
                        'dana_pinjaman' => $danaPinjaman,
                        'jumlah_bayar'  => $jumlahBayar,
                        'bunga_bayar'   => $bungaBayar,
                        'real_bayar'    => null,
                        'bulan'         => $tanggal->month,
                        'tahun'         => $tanggal->year,
                        'tanggal_bayar' => null,
                        'status'        => 'belum_bayar',
                    ]);
                }

                $jatuhTempo = $start
                    ->copy()
                    ->addMonthsNoOverflow($lama - 1)
                    ->endOfMonth();

                $pinjaman->update([
                    'status_approval'      => 'disetujui',
                    'catatan_approval'     => $validated['catatan_approval'] ?? null,
                    'status'               => 'aktif',
                    'tanggal_pinjaman'     => $tanggalPencairan->toDateString(),
                    'jatuh_tempo_terakhir' => $jatuhTempo->toDateString(),
                    'sisa_pinjaman'        => $pinjaman->total_pinjaman,
                ]);

                TransaksiKas::create([
                    'by_admin'   => Auth::id(),
                    'user_id'    => $pinjaman->user_id,
                    'jenis'      => 'keluar',
                    'kategori'   => 'pinjaman',
                    'jumlah'     => $pinjaman->jumlah_pinjaman,
                    'keterangan' => 'Pencairan pinjaman',
                    'tanggal'    => $tanggalPencairan,
                    'ref_type'   => 'pinjaman',
                    'ref_id'     => $pinjaman->id,
                    'status'     => 'berhasil',
                ]);
            });

            return back()->with(
                'success',
                $validated['status_approval'] === 'disetujui'
                    ? 'Pengajuan pinjaman berhasil disetujui.'
                    : 'Pengajuan pinjaman berhasil ditolak.'
            );
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function pdf(Pinjaman $pinjaman)
    {
        return Inertia::render('pinjaman/approval/pdf', [
            'pinjaman' => [
                'id' => $pinjaman->id,
                'name' => $pinjaman->user->name,
                'jumlah_pinjaman' => $pinjaman->jumlah_pinjaman,
                'pdf_url' => $pinjaman->surat_pengajuan
                    ? asset('storage/' . $pinjaman->surat_pengajuan)
                    : null,
            ],
        ]);
    }
}
