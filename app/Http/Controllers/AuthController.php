<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'is_admin' => 'boolean',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'is_admin' => $request->has('is_admin') ? (bool) $request->is_admin : false,
        ]);

        return response()->json(['token' => $user->createToken('LibertyToken')->accessToken]);
    }

    public function login(Request $request)
    {
        if (!Auth::attempt($request->only('email', 'password'))) 
        {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return response()->json(['token' => Auth::user()->createToken('LibertyToken')->accessToken], 200);
    }
}
