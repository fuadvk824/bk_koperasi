<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($validated)) {
            return response()->json([
                'message' => 'Email atau password salah.',
            ], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Cek status keanggotaan
        if ($user->status !== 'active') {
            Auth::logout();

            return response()->json([
                'message' => 'Akun Anda belum aktif. Silakan hubungi administrator koperasi.',
                'status' => $user->status,
            ], 403);
        }

        // Buat token hanya untuk anggota aktif
        $token = $user->createToken('mobile_app')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'nomor_anggota' => $user->nomor_anggota,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
                'active_at' => $user->active_at,
            ],
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'nomor_anggota' => $user->nomor_anggota,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
                'active_at' => $user->active_at,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }
}
