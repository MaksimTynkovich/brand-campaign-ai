# Воркфлоу генерации видео

## Схема: от кнопки до Kie.ai API

```
[Фронт]  Нажатие «Сгенерировать»
    │
    ▼
  api.startGenerationFromTemplate()  →  POST /api/generation/start (с template_id, prompt, images)
    │
    ▼
[Бэкенд]  GenerationController::start()
    │  • проверка кредитов, списание 1
    │  • создание записи generation_jobs (status: pending)
    │  • сохранение загруженных файлов в storage
    │  • ProcessGenerationJob::dispatch($job)  ← задача уходит В ОЧЕРЕДЬ
    │
    ▼
  Ответ 201 { job_id }  →  фронт начинает опрашивать GET /api/generation/status/{job_id}
    │
    │  ═══════════════════════════════════════════════════════════
    │  Запросы к Kie.ai выполняются НЕ здесь, а в воркере очереди!
    │  Если не запущен `php artisan queue:work` — задача лежит в БД и не выполняется.
    │  ═══════════════════════════════════════════════════════════
    │
    ▼
[Воркер]  php artisan queue:work  забирает задачу из таблицы jobs
    │
    ▼
  ProcessGenerationJob::handle()
    │  • status → processing
    │  • PromptMergeService::merge()  (шаблон + текст пользователя)
    │  • VeoService::generate($mergedPrompt, $imagePaths)
    │       │
    │       ▼
    │     KieVeoService::createTask()  →  POST https://api.kie.ai/api/v1/veo/generate  ← ПЕРВЫЙ ЗАПРОС НА KIE
    │       │
    │       • цикл: каждые 10 сек KieVeoService::getTaskDetails()  →  GET .../veo/record-info?taskId=...  ← ОПРОС СТАТУСА
    │       • при successFlag=1: скачивание видео по resultUrls[0], сохранение в storage
    │       • возврат URL нашего видео
    │
    │  • обновление generation_jobs: status=completed, video_path=...
    │
    ▼
  Фронт при очередном опросе status получает video_url и показывает плеер.
```

## Где что лежит

| Этап | Файл | Метод/место |
|------|------|--------------|
| Старт с фронта | `frontend/src/components/dashboard/DashboardHome.js` | `handleGenerate()` → `api.startGenerationFromTemplate()` |
| API-вызов с фронта | `frontend/src/services/api.js` | `startGenerationFromTemplate()`, `getGenerationStatus()` |
| Приём старта | `backend/app/Http/Controllers/Api/GenerationController.php` | `start()`, `status()` |
| Постановка в очередь | `backend/app/Http/Controllers/Api/GenerationController.php` | `ProcessGenerationJob::dispatch($job)` |
| Обработка очереди | `backend/app/Jobs/ProcessGenerationJob.php` | `handle()` |
| Слияние промпта | `backend/app/Services/PromptMergeService.php` | `merge()` |
| Генерация видео | `backend/app/Services/VeoService.php` | `generate()` |
| Запросы к Kie.ai | `backend/app/Services/KieVeoService.php` | `createTask()`, `getTaskDetails()` |

## Что обязательно запустить

Чтобы запросы реально уходили на Kie.ai:

1. **Очередь Laravel** — в отдельном терминале:
   ```bash
   cd backend && php artisan queue:work
   ```
   Без этого `ProcessGenerationJob` не выполняется, запросы к API не отправляются.

2. **Переменная окружения** в `backend/.env`:
   ```env
   KIE_VEO_API_KEY=ваш_ключ
   ```

## Как проверить, что запросы уходят

- В терминале, где запущен `queue:work`, появятся логи при обработке задачи.
- В `storage/logs/laravel.log` — после добавления логов (см. ниже) будут строки вида:
  - `[Generation] Job dispatched, job_id=...`
  - `[Generation] ProcessGenerationJob started, job_id=...`
  - `[KieVeo] createTask request, taskId=...`
  - `[KieVeo] getTaskDetails poll, taskId=...`
  - `[VeoService] video saved, path=...`
