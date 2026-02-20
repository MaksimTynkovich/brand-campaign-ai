<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        // Извлекаем имя из email (часть до @)
        $name = explode('@', $request->email)[0];

        // Создаем нового пользователя в БД
        $user = User::create([
            'name' => ucfirst($name), // Делаем первую букву заглавной
            'email' => $request->email,
            // каст "hashed" в модели сам захэширует пароль
            'password' => $request->password,
        ]);

        // Генерируем Sanctum-токен
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_admin' => (bool) $user->is_admin,
                'credits' => (int) ($user->credits ?? 0),
                'plan' => $user->plan ?? 'trial',
            ],
            'token' => $token,
            'message' => 'Регистрация успешна',
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // Находим пользователя в БД
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Неверный email или пароль'], 401);
        }

        // Генерируем Sanctum-токен
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_admin' => (bool) $user->is_admin,
                'credits' => (int) ($user->credits ?? 0),
                'plan' => $user->plan ?? 'trial',
            ],
            'token' => $token,
            'message' => 'Вход выполнен успешно',
        ]);
    }

    /**
     * Смена пароля (текущий пользователь, требуется старый пароль).
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Неверный текущий пароль'], 422);
        }

        $user->update(['password' => $request->password]);

        return response()->json(['message' => 'Пароль успешно изменён']);
    }

    public function google()
    {
        // Редирект на Google OAuth
        // В реальном приложении использовать Laravel Socialite
        return response()->json([
            'message' => 'Google OAuth endpoint',
            'url' => 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
                'client_id' => env('GOOGLE_CLIENT_ID', ''),
                'redirect_uri' => env('GOOGLE_REDIRECT_URI', 'http://localhost:3000/auth/google/callback'),
                'response_type' => 'code',
                'scope' => 'openid email profile',
            ])
        ]);
    }

    public function googleCallback(Request $request)
    {
        // Обработка callback от Google
        // В реальном приложении использовать Laravel Socialite
        $code = $request->query('code');
        
        if (!$code) {
            return response()->json(['message' => 'Authorization code not provided'], 400);
        }

        // Здесь должна быть логика обмена code на access_token и получение данных пользователя
        // Пока возвращаем mock данные
        
        $mockUser = [
            'id' => 999,
            'name' => 'Google User',
            'email' => 'google@example.com',
        ];

        $token = Str::random(60);

        return response()->json([
            'user' => $mockUser,
            'token' => $token,
            'message' => 'Вход через Google выполнен успешно',
        ]);
    }
}
