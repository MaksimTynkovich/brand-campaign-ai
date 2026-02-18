<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => ['message' => 'Unauthorized', 'code' => 401, 'details' => []]], 401);
        }

        return response()->json([
            'data' => [
                'credits' => (int) ($user->credits ?? 0),
                'plan' => $user->plan ?? 'trial',
            ],
        ]);
    }
}
