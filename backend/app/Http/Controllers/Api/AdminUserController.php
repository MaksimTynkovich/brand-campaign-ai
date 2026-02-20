<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    /**
     * Список всех пользователей (только для админов).
     */
    public function index(Request $request): JsonResponse
    {
        $users = User::orderBy('id')
            ->get(['id', 'name', 'email', 'credits', 'plan', 'is_admin', 'is_blocked', 'created_at']);

        $data = $users->map(function (User $u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'credits' => (int) ($u->credits ?? 0),
                'plan' => $u->plan ?? 'trial',
                'is_admin' => (bool) $u->is_admin,
                'is_blocked' => (bool) ($u->is_blocked ?? false),
                'created_at' => $u->created_at->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => ['total' => $data->count()],
        ]);
    }

    /**
     * Обновить тариф, кредиты и/или блокировку пользователя.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'error' => ['message' => 'User not found', 'code' => 404, 'details' => []],
            ], 404);
        }

        $payload = $request->validate([
            'plan' => 'nullable|string|max:32',
            'credits' => 'nullable|integer|min:0',
            'is_blocked' => 'nullable|boolean',
        ]);

        if (array_key_exists('plan', $payload) && $payload['plan'] !== null) {
            $user->plan = $payload['plan'];
        }
        if (array_key_exists('credits', $payload) && $payload['credits'] !== null) {
            $user->credits = (int) $payload['credits'];
        }
        if (array_key_exists('is_blocked', $payload)) {
            $user->is_blocked = (bool) $payload['is_blocked'];
        }
        $user->save();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'credits' => (int) ($user->credits ?? 0),
                'plan' => $user->plan ?? 'trial',
                'is_admin' => (bool) $user->is_admin,
                'is_blocked' => (bool) ($user->is_blocked ?? false),
                'created_at' => $user->created_at->toIso8601String(),
            ],
        ]);
    }
}
