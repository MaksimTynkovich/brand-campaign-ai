<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    /**
     * Mock данные для продуктов
     */
    private function getMockProducts(): array
    {
        return [
            [
                'id' => 1,
                'user_id' => 1,
                'name' => 'Умные часы Pro',
                'description' => 'Современные умные часы с функциями фитнес-трекера, мониторинга здоровья и умными уведомлениями. Водонепроницаемость до 50м, автономность до 7 дней.',
                'images' => ['products/smartwatch1.jpg', 'products/smartwatch2.jpg'],
                'target_audience' => 'Молодые профессионалы 25-35 лет',
                'language' => 'ru',
                'ad_angle' => 'Решение проблемы',
                'creatives' => [
                    [
                        'id' => 1,
                        'product_id' => 1,
                        'status' => 'completed',
                        'hooks' => [
                            'Устали постоянно смотреть на телефон?',
                            'Хотите следить за здоровьем 24/7?',
                            'Нужен фитнес-трекер, который не нужно заряжать каждый день?'
                        ],
                        'video_script' => "Hook: Устали постоянно смотреть на телефон?\n\nПроблема: Современный ритм жизни требует постоянного контроля, но телефон отвлекает от важных дел.\n\nРешение: Умные часы Pro - все уведомления на запястье, не отвлекаясь от жизни. Автономность 7 дней, водонепроницаемость, полный мониторинг здоровья.\n\nCTA: Закажи сейчас со скидкой 30%!",
                        'caption' => 'Умные часы Pro - твой персональный помощник на запястье. Фитнес, здоровье, уведомления - все в одном устройстве. Автономность 7 дней!',
                        'cta' => 'Заказать со скидкой 30%',
                        'video_path' => 'videos/creative_1.mp4',
                        'created_at' => now()->subDays(2)->toDateTimeString(),
                        'updated_at' => now()->subDays(2)->toDateTimeString(),
                    ]
                ],
                'created_at' => now()->subDays(5)->toDateTimeString(),
                'updated_at' => now()->subDays(5)->toDateTimeString(),
            ],
            [
                'id' => 2,
                'user_id' => 1,
                'name' => 'Беспроводные наушники AirMax',
                'description' => 'Премиум беспроводные наушники с активным шумоподавлением, качественным звуком и автономностью до 30 часов. Идеально для музыки, звонков и работы.',
                'images' => ['products/headphones1.jpg'],
                'target_audience' => 'Меломаны и офисные работники 20-40 лет',
                'language' => 'ru',
                'ad_angle' => 'Преимущества',
                'creatives' => [],
                'created_at' => now()->subDays(3)->toDateTimeString(),
                'updated_at' => now()->subDays(3)->toDateTimeString(),
            ],
            [
                'id' => 3,
                'user_id' => 1,
                'name' => 'Электросамокат CityRider',
                'description' => 'Легкий и компактный электросамокат для городских поездок. Запас хода 25 км, скорость до 25 км/ч, складная конструкция. Идеален для ежедневных поездок на работу.',
                'images' => ['products/scooter1.jpg', 'products/scooter2.jpg', 'products/scooter3.jpg'],
                'target_audience' => 'Городские жители 18-35 лет',
                'language' => 'ru',
                'ad_angle' => 'Эмоции',
                'creatives' => [
                    [
                        'id' => 2,
                        'product_id' => 3,
                        'status' => 'processing',
                        'hooks' => null,
                        'video_script' => null,
                        'caption' => null,
                        'cta' => null,
                        'video_path' => null,
                        'created_at' => now()->subMinutes(5)->toDateTimeString(),
                        'updated_at' => now()->subMinutes(5)->toDateTimeString(),
                    ]
                ],
                'created_at' => now()->subDays(1)->toDateTimeString(),
                'updated_at' => now()->subDays(1)->toDateTimeString(),
            ],
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $products = $this->getMockProducts();
        
        // Форматируем в формат пагинации Laravel
        return response()->json([
            'data' => $products,
            'current_page' => 1,
            'per_page' => 15,
            'total' => count($products),
            'last_page' => 1,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $products = $this->getMockProducts();
        $product = collect($products)->firstWhere('id', (int)$id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        return response()->json($product);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $products = $this->getMockProducts();
        $product = collect($products)->firstWhere('id', (int)$id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $product['name'] = $request->input('name', $product['name']);
        $product['description'] = $request->input('description', $product['description']);
        $product['target_audience'] = $request->input('target_audience', $product['target_audience']);
        $product['language'] = $request->input('language', $product['language']);
        $product['ad_angle'] = $request->input('ad_angle', $product['ad_angle']);
        $product['updated_at'] = now()->toDateTimeString();

        return response()->json($product);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $products = $this->getMockProducts();
        $product = collect($products)->firstWhere('id', (int)$id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        return response()->json(['message' => 'Product deleted successfully']);
    }
}
