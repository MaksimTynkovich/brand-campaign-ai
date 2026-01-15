# Frontend - TikTok Ads Generator

React приложение для генерации рекламных креативов для TikTok.

## Установка

```bash
npm install
```

## Запуск

```bash
npm start
```

Приложение откроется на http://localhost:3000

## Настройка API

По умолчанию приложение подключается к `http://localhost:8000/api`.

Чтобы изменить URL API, создайте файл `.env` в корне папки `frontend`:

```
REACT_APP_API_URL=http://your-api-url/api
```

## Структура проекта

```
src/
├── components/          # Переиспользуемые компоненты
│   ├── ProductForm.js   # Форма создания продукта
│   ├── ProductList.js   # Список продуктов
│   └── CreativeView.js  # Просмотр креатива
├── pages/               # Страницы приложения
│   └── ProductPage.js   # Страница продукта с креативами
├── services/            # API сервисы
│   └── api.js          # API клиент
└── App.js              # Главный компонент с роутингом
```

## Основные функции

1. **Создание продукта**
   - Название и описание
   - Загрузка 1-3 изображений
   - Настройка целевой аудитории, языка, рекламного угла

2. **Просмотр продуктов**
   - Список всех продуктов
   - Удаление продуктов
   - Переход к детальной странице

3. **Генерация креативов**
   - Запуск генерации для продукта
   - Отслеживание статуса генерации
   - Просмотр результатов

4. **Скачивание результатов**
   - Скачивание видео (MP4)
   - Скачивание сценария (TXT)

## API Endpoints

Приложение использует следующие endpoints:

- `GET /api/products` - Список продуктов
- `POST /api/products` - Создать продукт
- `GET /api/products/:id` - Получить продукт
- `DELETE /api/products/:id` - Удалить продукт
- `GET /api/creatives` - Список креативов
- `GET /api/creatives/:id` - Получить креатив
- `POST /api/generation/start` - Начать генерацию
- `GET /api/generation/status/:jobId` - Статус генерации
- `GET /api/creatives/:id/download/video` - Скачать видео
- `GET /api/creatives/:id/download/script` - Скачать сценарий
