import React, { useState, useEffect } from 'react';
import api, { getStorageUrl } from '../../services/api';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 120;

function DashboardHome() {
  const user = api.getCurrentUser();
  const [billing, setBilling] = useState({ credits: 0, plan: 'trial' });
  const defaultCategories = ['Новые', 'Распаковка', 'Виральный хук', 'POV', 'ASMR', 'UGC-обзор', 'Визуальные эффекты'];
  const [categories, setCategories] = useState(defaultCategories);
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [images, setImages] = useState([null, null]);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [resultVideoUrl, setResultVideoUrl] = useState(null);
  const [genError, setGenError] = useState(null);

  useEffect(() => {
    api.getTemplates().then((res) => {
      setTemplates(Array.isArray(res.data) ? res.data : []);
      const cats = res.meta?.categories;
      if (Array.isArray(cats)) setCategories(cats);
    });
  }, []);

  useEffect(() => {
    if (!api.isAuthenticated()) return;
    api.getBillingFromApi().then((data) => setBilling(data)).catch(() => {});
  }, [generating]);

  const activeTemplate = templates.find((t) => t.id === activeTemplateId);

  const setImageAt = (index, file) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = file || null;
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!activeTemplateId) return;
    setGenError(null);
    setResultVideoUrl(null);
    setGenerating(true);
    const imageFiles = images.filter(Boolean);
    try {
      const res = await api.startGenerationFromTemplate(activeTemplateId, promptText.trim(), imageFiles);
      const id = res.data?.job_id ?? res.job_id;
      if (!id) throw new Error('Нет job_id в ответе');
      setJobId(id);

      let attempts = 0;
      const poll = async () => {
        if (attempts >= MAX_POLL_ATTEMPTS) {
          setGenError('Превышено время ожидания');
          setGenerating(false);
          return;
        }
        const status = await api.getGenerationStatus(id);
        if (status.status === 'completed') {
          setResultVideoUrl(status.video_url || null);
          setGenerating(false);
          return;
        }
        if (status.status === 'failed') {
          setGenError(status.error_message || 'Генерация не удалась');
          setGenerating(false);
          return;
        }
        attempts += 1;
        setTimeout(poll, POLL_INTERVAL_MS);
      };
      await poll();
    } catch (err) {
      setGenError(err.message || 'Ошибка запуска генерации');
      setGenerating(false);
    }
  };

  const closeModal = () => {
    if (!generating) {
      setActiveTemplateId(null);
      setResultVideoUrl(null);
      setGenError(null);
      setJobId(null);
      setImages([null, null]);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Добро пожаловать, {user?.name || 'Пользователь'}!
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Выберите готовый шаблон и запустите свой первый AI-ролик за пару минут.
        </p>
        <p className="text-sm text-gray-500">
          Кредиты: <span className="font-medium text-gray-700">{billing.credits ?? 0}</span>
          {' · '}
          Тариф: <span className="font-medium text-gray-700">{billing.plan ?? 'trial'}</span>
        </p>
      </div>

      {/* Templates section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">Шаблоны для быстрого старта</h2>
        </div>

        {/* Categories pills */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex items-center gap-2 sm:gap-3 min-w-max">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm border transition-colors ${
                activeCategory === null
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
              }`}
            >
              Все
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm border transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
                }`}
              >
                {cat === 'Виральный хук' ? 'Виральный хук 🔥' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {templates.length === 0 ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 aspect-[9/16] flex items-center justify-center text-gray-400 text-sm"
              >
                Загрузка…
              </div>
            ))
          ) : (() => {
            const filtered = activeCategory === null ? templates : templates.filter((t) => t.category === activeCategory);
            return filtered.length ? filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTemplateId(t.id)}
                className="group rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-primary transition-all duration-200 text-left"
              >
                <div className="relative aspect-[9/16] bg-gray-900">
                  {t.preview_url ? (
                    <img src={getStorageUrl(t.preview_url)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-700" />
                  )}
                  <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                    <p className="text-xs sm:text-sm font-semibold text-white line-clamp-2">
                      {t.category || `Шаблон #${t.id}`}
                    </p>
                  </div>
                </div>
              </button>
            )) : (
              <p className="col-span-full text-center py-8 text-gray-500">Нет шаблонов в этой категории</p>
            );
          })()}
        </div>
      </section>

      {/* Модалка настройки шаблона — светлая, минималистичная */}
      {activeTemplateId !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                  {(activeTemplate?.category || `Шаблон #${activeTemplateId}`)} · {activeCategory ?? 'Все'}
                </p>
                <h3 className="text-lg font-semibold">Параметры ролика</h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={generating}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 disabled:opacity-50"
              >
                <span className="sr-only">Закрыть</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* Левая колонка: превью или результат */}
              <div className="lg:w-2/5 border-b lg:border-b-0 lg:border-r border-gray-200 p-4 flex flex-col gap-3">
                <div className="rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[min(520px,70vh)] w-full mx-auto">
                  {resultVideoUrl ? (
                    <video
                      src={getStorageUrl(resultVideoUrl)}
                      controls
                      className="w-full h-full object-cover"
                      playsInline
                    />
                  ) : activeTemplate?.example_video_url ? (
                    <video
                      src={getStorageUrl(activeTemplate.example_video_url)}
                      controls
                      className="w-full h-full object-cover"
                      playsInline
                    />
                  ) : activeTemplate?.preview_url ? (
                    <img
                      src={getStorageUrl(activeTemplate.preview_url)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/60 via-gray-900 to-blue-500/80 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-2xl bg-black/40 flex items-center justify-center border border-white/10">
                        <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {resultVideoUrl ? 'Готовый ролик' : activeTemplate?.example_video_url ? 'Пример шаблона' : 'Превью 9:16'}
                </p>
              </div>

              {/* Правая колонка: форма и результат */}
              <div className="lg:w-3/5 p-4 sm:p-6 flex flex-col gap-4">
                {genError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {genError}
                  </div>
                )}

                {!resultVideoUrl && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">Фото продукта</h4>
                        <span className="text-[11px] text-gray-400">Опционально, до 2 фото</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        Если не загружаете — используются референсы шаблона. Если загружаете 1–2 фото — к ним добавится начальный кадр из шаблона.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[0, 1].map((slot) => (
                          <label key={slot} className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => setImageAt(slot, e.target.files?.[0] || null)}
                            />
                            <div className="aspect-square rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-[11px] text-gray-500 hover:border-primary hover:text-primary transition-colors overflow-hidden">
                              {images[slot] ? (
                                <span className="px-2 truncate w-full text-center text-gray-700">
                                  {images[slot].name}
                                </span>
                              ) : (
                                <>
                                  <span className="text-lg mb-1">+</span>
                                  Фото {slot + 1}
                                </>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">Описание для AI</h4>
                        <span className="text-[11px] text-gray-400">Можно переписать под свой продукт</span>
                      </div>
                      <textarea
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value.slice(0, 5000))}
                        rows={6}
                        placeholder={activeTemplate?.default_voiceover ?? ''}
                        className="w-full h-40 sm:h-44 lg:h-48 bg-white border border-gray-300 rounded-2xl px-3 sm:px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                      />
                      <div className="mt-1 text-[11px] text-gray-400 text-right">
                        {promptText.length} / 5000
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-[11px] text-gray-400">
                    Формат: 15 сек · вертикальное видео 9:16
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={generating}
                      className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
                    >
                      {resultVideoUrl ? 'Закрыть' : 'Отменить'}
                    </button>
                    {!resultVideoUrl && (
                      <button
                        type="button"
                        disabled={generating}
                        onClick={handleGenerate}
                        className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-primary text-white hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {generating ? 'Генерация…' : 'Сгенерировать'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardHome;
