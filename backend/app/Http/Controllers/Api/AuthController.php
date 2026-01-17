<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    // Mock users storage (в реальном приложении использовать базу данных)
    private $users = [];

    public function __construct()
    {
        // Инициализируем с тестовым пользователем
        $this->users = [
            [
                'id' => 1,
                'name' => 'Тестовый Пользователь',
                'email' => 'test@example.com',
                'password' => Hash::make('password123'), // password123
                'created_at' => now()->toIso8601String(),
            ]
        ];
    }

    public function register(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|min:6',
        ]);

        // Проверяем, существует ли пользователь
        $existingUser = collect($this->users)->firstWhere('email', $request->email);
        if ($existingUser) {
            return response()->json(['message' => 'Пользователь с таким email уже существует'], 422);
        }

        // Извлекаем имя из email (часть до @)
        $name = explode('@', $request->email)[0];

        // Создаем нового пользователя
        $newUser = [
            'id' => count($this->users) + 1,
            'name' => ucfirst($name), // Делаем первую букву заглавной
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'created_at' => now()->toIso8601String(),
        ];

        $this->users[] = $newUser;

        // Генерируем токен (в реальном приложении использовать Sanctum)
        $token = Str::random(60);

        return response()->json([
            'user' => [
                'id' => $newUser['id'],
                'name' => $newUser['name'],
                'email' => $newUser['email'],
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

        // Находим пользователя
        $user = collect($this->users)->firstWhere('email', $request->email);
        
        if (!$user || !Hash::check($request->password, $user['password'])) {
            return response()->json(['message' => 'Неверный email или пароль'], 401);
        }

        // Генерируем токен
        $token = Str::random(60);

        return response()->json([
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
            ],
            'token' => $token,
            'message' => 'Вход выполнен успешно',
        ]);
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
