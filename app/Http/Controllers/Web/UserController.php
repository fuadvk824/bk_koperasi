<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\Web\UserResource;
use App\Mail\UserPasswordResetMail;
use App\Models\ActivityLog;
use App\Models\Office;
use App\Models\PengaturanKoperasi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;
use Inertia\Inertia;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);
        $bulan = $request->input('bulan', 'all');
        $tahun = $request->input('tahun', 'all');

        $awalBulan = null;
        $akhirBulan = null;

        if ($bulan !== 'all' && $tahun !== 'all') {
            $awalBulan = Carbon::create((int) $tahun, (int) $bulan, 1)
                ->startOfMonth()
                ->toDateString();

            $akhirBulan = Carbon::create((int) $tahun, (int) $bulan, 1)
                ->endOfMonth()
                ->toDateString();
        }

        $query = User::with(['roles:id,name', 'office:id,name'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->search;

                $q->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when(
                $request->filled('office_id') && $request->office_id !== 'all',
                fn($q) => $q->where('office_id', $request->office_id)
            )
            ->when(
                $request->filled('status') && $request->status !== 'all',
                fn($q) => $q->where('status', $request->status)
            )

            // Filter berdasarkan bulan dan tahun jika dipilih
            ->when($awalBulan && $akhirBulan, function ($q) use ($awalBulan, $akhirBulan) {
                $q->whereNotNull('active_at')
                    ->whereBetween('active_at', [$awalBulan, $akhirBulan])
                    ->where(function ($query) use ($akhirBulan) {
                        $query->whereNull('inactive_at')
                            ->orWhereDate('inactive_at', '>', $akhirBulan);
                    });
            })
            ->orderBy('name', 'asc');

        $data = (clone $query)
            ->paginate($perPage)
            ->withQueryString();

        $totalAnggota = (clone $query)->count();

        $activityLogs = ActivityLog::with(['admin:id,name', 'user:id,name'])
            ->latest()
            ->get()
            ->map(function ($log) {
                return [
                    'admin' => $log->admin->name ?? '-',
                    'user' => $log->user->name ?? '-',
                    'jenis_update' => $log->jenis_update,
                    'created_at' => $log->created_at?->format('Y-m-d H:i:s'),
                    'old' => $this->transformLog($log->old),
                    'new' => $this->transformLog($log->new),
                ];
            });

        // $pengaturanKoperasi = PengaturanKoperasi::firstOrCreate(
        //     [],
        //     [
        //         'simpanan_wajib' => 0,
        //         'bunga_pinjaman' => 0,
        //     ]
        // );
        $today = now()->toDateString();

        $pengaturanKoperasi = PengaturanKoperasi::where(function ($query) use ($today) {
            $query->whereNull('berlaku_mulai')
                ->orWhereDate('berlaku_mulai', '<=', $today);
        })
            ->where(function ($query) use ($today) {
                $query->whereNull('berlaku_sampai')
                    ->orWhereDate('berlaku_sampai', '>=', $today);
            })
            ->orderByDesc('berlaku_mulai')
            ->orderByDesc('id')
            ->first();

        return Inertia::render('userManagement/index', [
            'users' => UserResource::collection($data)->response()->getData(true),
            'filters' => [
                'search' => $request->search,
                'office_id' => $request->office_id,
                'status' => $request->status,
                'bulan' => $bulan,
                'tahun' => $tahun,
                'perPage' => (int) $perPage,
            ],

            'offices' => Office::select('id', 'name')->orderBy('name')->get(),
            'roles' => Role::all(),
            'totalAnggota' => $totalAnggota,
            'activityLogs' => $activityLogs,
            'pengaturanKoperasi' => $pengaturanKoperasi,
        ]);
    }

    public function updatePengaturanKoperasi(Request $request)
    {
        $validated = $request->validate([
            'simpanan_wajib' => [
                'required',
                'numeric',
                'min:0',
                'max:9999999999999.99',
            ],
            'bunga_pinjaman' => [
                'required',
                'numeric',
                'min:0',
                'max:999.99',
            ],
        ]);

        DB::transaction(function () use ($validated) {
            // Pengaturan baru selalu berlaku mulai awal bulan ini.
            $awalBulanIni = now()->startOfMonth()->toDateString();
            $akhirBulanLalu = now()
                ->startOfMonth()
                ->subDay()
                ->toDateString();

            // Kunci baris pengaturan untuk menghindari perubahan bersamaan.
            $pengaturanTerakhir = PengaturanKoperasi::query()
                ->orderByDesc('berlaku_mulai')
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();

            if ($pengaturanTerakhir) {
                $tanggalMulaiLama = $pengaturanTerakhir->berlaku_mulai;

                // Jika pengaturan bulan ini sudah ada,
                // perbarui baris bulan ini agar periodenya tidak tumpang tindih.
                if (
                    $tanggalMulaiLama &&
                    Carbon::parse($tanggalMulaiLama)->toDateString()
                    >= $awalBulanIni
                ) {
                    $pengaturanTerakhir->update($validated);

                    return;
                }

                // Tutup periode lama sehari sebelum bulan baru.
                $pengaturanTerakhir->berlaku_sampai = $akhirBulanLalu;
                $pengaturanTerakhir->save();
            }

            // Buat riwayat pengaturan baru.
            PengaturanKoperasi::create([
                'simpanan_wajib' => $validated['simpanan_wajib'],
                'bunga_pinjaman' => $validated['bunga_pinjaman'],
                'berlaku_mulai' => $awalBulanIni,
                'berlaku_sampai' => null,
            ]);
        });

        return back()->with(
            'success',
            'Pengaturan koperasi berhasil diperbarui.'
        );
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

        // Jangan tampilkan role
        unset($data['role_id']);
        unset($data['role']);

        return $data;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'office_id' => ['required', 'exists:offices,id'],
            'active_at' => ['required', 'date'],
        ]);

        DB::transaction(function () use ($validated) {
            // Membuat email otomatis dari nama anggota
            $namaEmail = \Illuminate\Support\Str::slug(
                $validated['name'],
                ''
            );

            $namaEmail = $namaEmail ?: 'anggota';

            $domain = 'gmail.com';

            // Membuat email unik
            do {
                $kodeAcak = strtolower(
                    \Illuminate\Support\Str::random(3)
                );

                $email = $namaEmail . $kodeAcak . '@' . $domain;
            } while (User::where('email', $email)->exists());

            // Membuat nomor anggota otomatis
            $nomorAnggota = $this->generateNomorAnggota();

            $user = User::create([
                'nomor_anggota' => $nomorAnggota,
                'name' => ucwords(strtolower($validated['name'])),
                'email' => $email,
                'office_id' => $validated['office_id'],
                'status' => 'active',
                'password' => Hash::make('ffuiadda'),
                'active_at' => $validated['active_at'],
            ]);

            $user->assignRole('user');

            ActivityLog::create([
                'by_admin' => Auth::id(),
                'user_id' => $user->id,
                'jenis_update' => 'Add User',
                'old' => null,
                'new' => json_encode([
                    'nomor_anggota' => $user->nomor_anggota,
                    'name' => $user->name,
                    'email' => $user->email,
                    'office_id' => $user->office_id,
                    'status' => $user->status,
                    'role' => 'user',
                ]),
            ]);
        });

        return back()->with(
            'success',
            'User berhasil ditambahkan'
        );
    }

    public function update(Request $request, User $user)
    {
        $admin = Auth::user();
        $isSuperAdmin = $admin->roles->contains('name', 'super-admin');

        if ($user->hasRole('super-admin') && !$isSuperAdmin) {
            return back()->with('error', 'Tidak bisa ubah user super-admin');
        }

        // User inactive tidak boleh diaktifkan kembali
        if ($user->status === 'inactive' && $request->input('status') === 'active') {
            return back()->withErrors([
                'status' => 'User yang sudah inactive tidak dapat diaktifkan kembali.',
            ]);
        }

        $rules = [
            'office_id' => ['required', 'exists:offices,id'],
            'status' => ['required', 'in:active,inactive'],
            'tanggal_status' => ['nullable', 'date'],
        ];

        if ($isSuperAdmin) {
            $rules['role'] = ['required', 'exists:roles,name'];
        }

        $validated = $request->validate($rules);

        $statusBerubah = $user->status !== $validated['status'];

        if ($statusBerubah) {
            $request->validate([
                'tanggal_status' => ['required', 'date'],
            ]);
        }

        DB::transaction(function () use (
            $user,
            $validated,
            $statusBerubah,
            $isSuperAdmin
        ) {

            // Simpan data lama untuk ActivityLog
            $oldRole = $user->getRoleNames()->first();

            $oldData = [
                'office_id' => $user->office_id,
                'status' => $user->status,
                'active_at' => $user->active_at,
                'inactive_at' => $user->inactive_at,
                'role' => $oldRole,
            ];

            // Update Office
            $user->office_id = $validated['office_id'];

            // Update Status
            if ($statusBerubah) {
                $user->status = $validated['status'];

                if ($validated['status'] === 'inactive') {
                    $user->inactive_at = $validated['tanggal_status'];
                } else {
                    $user->active_at = $validated['tanggal_status'];
                    $user->inactive_at = null;
                }
            }

            // Khusus Super Admin
            if ($isSuperAdmin) {

                // Update Role
                $user->syncRoles([$validated['role']]);
            }

            // Simpan User
            $user->save();

            // Data baru untuk ActivityLog
            $newData = [
                'office_id' => $user->office_id,
                'status' => $user->status,
                'active_at' => $user->active_at,
                'inactive_at' => $user->inactive_at,
                'role' => $user->getRoleNames()->first(),
            ];

            // ActivityLog hanya dibuat jika perubahan dilakukan bukan oleh Super Admin
            if (!$isSuperAdmin && $oldData != $newData) {
                ActivityLog::create([
                    'by_admin' => Auth::id(),
                    'user_id' => $user->id,
                    'jenis_update' => 'Update User',
                    'old' => json_encode($oldData),
                    'new' => json_encode($newData),
                ]);
            }
        });

        return back()->with(
            'success',
            'User berhasil diperbarui.'
        );
    }


    private function isValidEmailDomain($email)
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $domain = substr(strrchr($email, '@'), 1);

        $blockedDomains = [
            'example.com',
            'test.com',
            'invalid.com',
            'localhost',
        ];

        if (in_array(strtolower($domain), $blockedDomains)) {
            return false;
        }

        $mxRecords = dns_get_record($domain, DNS_MX);

        return !empty($mxRecords);
    }

    public function resetPassword(User $user)
    {
        /** @var \App\Models\User|null $admin */
        $admin = Auth::user();

        if (!$admin->hasRole('super-admin')) {
            abort(403, 'Anda tidak memiliki akses untuk reset password.');
        }

        // Validasi email
        if (!$this->isValidEmailDomain($user->email)) {
            return back()->with(
                'error',
                'Email tidak valid atau domain email tidak menerima email.'
            );
        }

        // Generate password random 6 karakter
        $plainPassword = Str::random(6);

        try {
            DB::transaction(function () use ($user, $plainPassword) {

                // Simpan password baru dalam bentuk hash
                $user->password = Hash::make($plainPassword);
                $user->save();

                // Kirim password baru ke email user
                Mail::to($user->email)->send(
                    new UserPasswordResetMail($user, $plainPassword)
                );
            });

            return back()->with(
                'success',
                'Password berhasil direset dan dikirim ke email user.'
            );
        } catch (\Throwable $e) {

            report($e);

            return back()->with(
                'error',
                'Terjadi kesalahan saat reset password atau mengirim email.'
            );
        }
    }

    private function generateNomorAnggota(): string
    {
        $pengunci = User::query()
            ->orderBy('id')
            ->lockForUpdate()
            ->first();

        if (!$pengunci) {
            throw new \RuntimeException(
                'Tidak ada baris users untuk dijadikan pengunci.'
            );
        }

        $nomorTerakhir = User::query()
            ->whereNotNull('nomor_anggota')
            ->orderByRaw("
            CAST(SUBSTRING(nomor_anggota, 6, 3) AS UNSIGNED) DESC
        ")
            ->get(['nomor_anggota']);

        $urutanTerbesar = 0;

        foreach ($nomorTerakhir as $user) {
            if (!preg_match(
                '/^KSPS-(\d{3})([A-Z]+)$/',
                $user->nomor_anggota,
                $match
            )) {
                continue;
            }

            $angka = (int) $match[1];
            $huruf = $match[2];

            $indeksHuruf = 0;

            foreach (str_split($huruf) as $karakter) {
                $indeksHuruf = ($indeksHuruf * 26)
                    + ord($karakter) - ord('A') + 1;
            }

            $urutan = (($indeksHuruf - 1) * 999) + $angka;

            $urutanTerbesar = max($urutanTerbesar, $urutan);
        }

        $urutanBaru = $urutanTerbesar + 1;

        $angka = (($urutanBaru - 1) % 999) + 1;
        $indeksHuruf = intdiv($urutanBaru - 1, 999);

        $huruf = '';
        $nilai = $indeksHuruf + 1;

        while ($nilai > 0) {
            $nilai--;
            $huruf = chr(65 + ($nilai % 26)) . $huruf;
            $nilai = intdiv($nilai, 26);
        }

        return sprintf('KSPS-%03d%s', $angka, $huruf);
    }
}
