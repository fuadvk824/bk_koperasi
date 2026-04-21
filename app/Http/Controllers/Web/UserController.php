<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\Web\UserResource;
use App\Models\ActivityLog;
use App\Models\Office;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);

        $query = User::with(['roles:id,name', 'office:id,name'])
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($query) use ($request) {
                    $query
                        ->where('name', 'like', '%' . $request->search . '%')
                        ->orWhere('email', 'like', '%' . $request->search . '%');
                });
            })
            ->when($request->office_id, function ($q) use ($request) {
                $q->where('office_id', $request->office_id);
            })
            ->when($request->status, function ($q) use ($request) {
                $q->where('status', $request->status);
            });

        $data = (clone $query)->latest()->paginate($perPage)->withQueryString();

        $totalAnggota = (clone $query)->count();

        $activityLogs = ActivityLog::with(['admin:id,name', 'user:id,name'])
            ->latest()
            ->get()

            ->map(function ($log) {
                return [
                    'admin' => $log->admin->name ?? '-',
                    'user' => $log->user->name ?? '-',
                    'jenis_update' => $log->jenis_update,
                    'created_at' => $log->created_at->format('Y:m:d H:i:s'),
                    'old' => $this->transformLog($log->old),
                    'new' => $this->transformLog($log->new),
                ];
            });

        return Inertia::render('userManagement/index', [
            'users' => UserResource::collection($data)->response()->getData(true),

            'filters' => [
                'search' => $request->search,
                'perPage' => $perPage,
            ],
            'offices' => Office::select('id', 'name')->orderBy('name')->get(),
            'roles' => Role::all(),
            'totalAnggota' => $totalAnggota,
            'activityLogs' => $activityLogs,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $isSuperAdmin = Auth::user()->roles->contains('name', 'super-admin');

        $rules = [
            'office_id' => 'required|exists:offices,id',
            'status' => 'required|in:active,inactive',
        ];

        if ($isSuperAdmin) {
            $rules['role'] = 'required|exists:roles,name';
        }

        $validated = $request->validate($rules);

        if ($user->hasRole('super-admin') && !$isSuperAdmin) {
            return back()->with('error', 'Tidak bisa ubah user super-admin');
        }

        DB::transaction(function () use ($user, $validated, $isSuperAdmin) {
            $oldData = [
                'office_id' => $user->office_id,
                'status' => $user->status,
            ];

            $changes = [];
            $jenisUpdate = [];

            if ($oldData['office_id'] != $validated['office_id']) {
                $changes['office_id'] = [
                    'old' => $oldData['office_id'],
                    'new' => $validated['office_id'],
                ];
                $jenisUpdate[] = 'office';
            }

            if ($oldData['status'] != $validated['status']) {
                $changes['status'] = [
                    'old' => $oldData['status'],
                    'new' => $validated['status'],
                ];
                $jenisUpdate[] = 'status';
            }

            $user->update([
                'office_id' => $validated['office_id'],
                'status' => $validated['status'],
            ]);

            if (!$isSuperAdmin && !empty($changes)) {
                ActivityLog::create([
                    'by_admin' => Auth::id(),
                    'user_id' => $user->id,
                    'jenis_update' => implode(', ', $jenisUpdate),
                    'old' => json_encode(collect($changes)->map(fn($c) => $c['old'])),
                    'new' => json_encode(collect($changes)->map(fn($c) => $c['new'])),
                ]);
            }

            if ($isSuperAdmin && isset($validated['role'])) {
                $user->syncRoles([$validated['role']]);
            }
        });

        return back()->with('success', 'User berhasil diupdate');
    }

    private function transformLog($data)
    {
        if (!$data) {
            return null;
        }

        $data = is_array($data) ? $data : json_decode($data, true);

        if (isset($data['office_id'])) {
            $office = Office::find($data['office_id']);
            $data['office'] = $office->name ?? '-';
            unset($data['office_id']);
        }

        if (isset($data['role_id'])) {
            $role = Role::find($data['role_id']);
            $data['role'] = $role->name ?? '-';
            unset($data['role_id']);
        }

        return $data;
    }
}
