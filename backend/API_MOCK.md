# API Mock Data Setup

Backend настроен для возврата mock данных через API endpoint `/api/products`.

## Что настроено:

1. **API Routes** (`routes/api.php`)
   - Подключены все необходимые роуты для products, creatives и generation

2. **ProductController** (`app/Http/Controllers/Api/ProductController.php`)
   - Реализованы все методы CRUD с mock данными
   - Возвращает 3 предустановленных продукта с примерами креативов

3. **CORS** (`config/cors.php`)
   - Настроен для работы с фронтендом на localhost:3000
   - Разрешены все origins для разработки

## Mock данные включают:

### Продукты:
1. **Умные часы Pro** - с готовым креативом (completed)
2. **Беспроводные наушники AirMax** - без креативов
3. **Электросамокат CityRider** - с креативом в процессе (processing)

### Формат ответа:

**GET /api/products**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Умные часы Pro",
      "description": "...",
      "images": ["products/smartwatch1.jpg", "products/smartwatch2.jpg"],
      "target_audience": "Молодые профессионалы 25-35 лет",
      "language": "ru",
      "ad_angle": "Решение проблемы",
      "creatives": [...]
    }
  ],
  "current_page": 1,
  "per_page": 15,
  "total": 3,
  "last_page": 1
}
```

**GET /api/products/{id}**
```json
{
  "id": 1,
  "name": "Умные часы Pro",
  "description": "...",
  "images": [...],
  "creatives": [
    {
      "id": 1,
      "status": "completed",
      "hooks": [...],
      "video_script": "...",
      "caption": "...",
      "cta": "...",
      "video_path": "videos/creative_1.mp4"
    }
  ]
}
```

## Тестирование:

```bash
# Запустить сервер
cd backend
php artisan serve

# Проверить API
curl http://localhost:8000/api/products
```

## Примечания:

- Mock данные хранятся в методе `getMockProducts()` контроллера
- При создании нового продукта (POST) он добавляется в список mock данных
- Удаление и обновление работают с mock данными
- Для продакшена нужно будет подключить реальную базу данных
