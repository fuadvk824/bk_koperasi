<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\Web\SimpananResource;
use App\Models\Office;
use App\Models\Simpanan;
use App\Models\TransaksiKas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SimpananApprovalController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);

        $query = Simpanan::with('user:id,name,office_id')
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
                $q->whereBetween('tanggal', [$request->start_date, $request->end_date]);
            });

        $data = (clone $query)->orderBy('tanggal', 'desc')->paginate($perPage)->withQueryString();

        $total = (clone $query)->sum('jumlah');

        return Inertia::render('simpanan/approval/index', [
            'simpanan' => SimpananResource::collection($data)->response()->getData(true),
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

    public function updateStatus(Request $request, Simpanan $simpanan)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:disetujui,ditolak'],
        ]);

        try {
            DB::transaction(function () use ($validated, $simpanan) {

                $simpanan = Simpanan::whereKey($simpanan->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($simpanan->status_approval !== 'menunggu') {
                    throw new \RuntimeException(
                        'Pengajuan simpanan sudah diproses.'
                    );
                }

                $simpanan->update([
                    'status_approval' => $validated['status'],
                ]);

                if ($validated['status'] === 'disetujui') {
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
                }
            });

            return back()->with(
                'success',
                $validated['status'] === 'disetujui'
                    ? 'Pengajuan simpanan berhasil disetujui.'
                    : 'Pengajuan simpanan berhasil ditolak.'
            );
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
