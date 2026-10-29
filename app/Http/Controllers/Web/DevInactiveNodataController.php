<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\Web\DevNonaktifNodataResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class DevInactiveNodataController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $status = $request->input('status', 'all');

        if (!in_array($status, ['all', 'active', 'inactive'], true)) {
            $status = 'all';
        }
        $perPage = max(
            1,
            min((int) $request->input('perPage', 10), 100)
        );

        $query = DB::table('users as u')
            ->select([
                'u.id',
                'u.name as nama',
                'u.active_at',
                'u.inactive_at',
                'u.status',
            ])
            ->when($status !== 'all', function ($q) use ($status) {
                $q->where('u.status', $status);
            })
            ->whereNotExists(function ($q) {
                $q->selectRaw('1')
                    ->from('simpanan as s')
                    ->whereColumn('s.user_id', 'u.id');
            })
            ->whereNotExists(function ($q) {
                $q->selectRaw('1')
                    ->from('pinjaman as p')
                    ->whereColumn('p.user_id', 'u.id');
            })
            ->whereNotExists(function ($q) {
                $q->selectRaw('1')
                    ->from('transaksi_kas as tk')
                    ->whereColumn('tk.user_id', 'u.id');
            })
            ->when($search !== '', function ($q) use ($search) {
                $q->where('u.name', 'like', '%' . $search . '%');
            })
            ->orderBy('u.name', 'asc');

        $data = $query->paginate($perPage)->withQueryString();

        return Inertia::render(
            'developer/inactive-nodata/index',
            [
                'users' => DevNonaktifNodataResource::collection($data)
                    ->response()
                    ->getData(true),

                'filters' => [
                    'search' => $search,
                    'perPage' => $perPage,
                ],
            ]
        );
    }

    public function destroy(int $id)
    {
        $deleted = DB::transaction(function () use ($id) {
            $query = DB::table('users as u')
                ->where('u.id', $id)
                ->whereNotIn('u.id', [1, 98])
                ->where('u.status', 'inactive')
                ->whereNotExists(function ($q) {
                    $q->selectRaw('1')
                        ->from('simpanan as s')
                        ->whereColumn('s.user_id', 'u.id');
                })
                ->whereNotExists(function ($q) {
                    $q->selectRaw('1')
                        ->from('pinjaman as p')
                        ->whereColumn('p.user_id', 'u.id');
                })
                ->whereNotExists(function ($q) {
                    $q->selectRaw('1')
                        ->from('transaksi_kas as tk')
                        ->whereColumn('tk.user_id', 'u.id');
                });

            return $query->delete();
        });

        if ($deleted === 0) {
            throw new NotFoundHttpException(
                'Anggota tidak ditemukan atau tidak memenuhi syarat penghapusan.'
            );
        }

        return back()
            ->with('success', 'Data anggota berhasil dihapus.');
    }


    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'integer', 'distinct', 'min:1'],
        ]);

        $ids = array_map('intval', $validated['ids']);

        // Abaikan ID 1 dan 98 meskipun dicentang di frontend.
        $ids = array_values(array_diff($ids, [1, 98]));

        // Jika semua ID yang dipilih adalah ID yang dikecualikan.
        if (empty($ids)) {
            return redirect()
                ->route('inactive-nodata.index')
                ->with('success', 'Tidak ada anggota yang dihapus karena ID 1 dan 98 dikecualikan.');
        }

        DB::transaction(function () use ($ids) {
            $eligibleQuery = DB::table('users as u')
                ->whereIn('u.id', $ids)
                ->whereNotExists(function ($q) {
                    $q->selectRaw('1')
                        ->from('simpanan as s')
                        ->whereColumn('s.user_id', 'u.id');
                })
                ->whereNotExists(function ($q) {
                    $q->selectRaw('1')
                        ->from('pinjaman as p')
                        ->whereColumn('p.user_id', 'u.id');
                })
                ->whereNotExists(function ($q) {
                    $q->selectRaw('1')
                        ->from('transaksi_kas as tk')
                        ->whereColumn('tk.user_id', 'u.id');
                });

            $eligibleIds = $eligibleQuery
                ->lockForUpdate()
                ->pluck('u.id')
                ->map(fn($id) => (int) $id)
                ->all();

            sort($eligibleIds);

            $requestedIds = $ids;
            sort($requestedIds);

            if ($eligibleIds !== $requestedIds) {
                throw ValidationException::withMessages([
                    'ids' => 'Sebagian anggota tidak ditemukan atau tidak memenuhi syarat penghapusan. Tidak ada data yang dihapus.',
                ]);
            }

            $deleted = DB::table('users')
                ->whereIn('id', $ids)
                ->whereNotIn('id', [1, 98])
                ->delete();

            if ($deleted !== count($ids)) {
                throw ValidationException::withMessages([
                    'ids' => 'Jumlah data yang dihapus tidak sesuai. Silakan muat ulang halaman.',
                ]);
            }
        });

        return redirect()
            ->route('inactive-nodata.index')
            ->with('success', count($ids) . ' anggota berhasil dihapus.');
    }
}
