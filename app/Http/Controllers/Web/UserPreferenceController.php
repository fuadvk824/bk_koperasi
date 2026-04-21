<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserPreferenceController extends Controller
{
    public function show(Request $request)
    {
        if ($request->header('X-Inertia')) {
            abort(404);
        }

        return response()->json([
            'bg' => $request->user()->bg ?? 'default',
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'bg' => ['required', 'in:default,gradient'],
        ]);

        $user = $request->user();
        $user->bg = $request->bg;   
        $user->save();

        return back();
    }
}
