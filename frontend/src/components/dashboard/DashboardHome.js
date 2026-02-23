import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import api, { getStorageUrl } from '../../services/api';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 120;

function DashboardHome() {
  const user = api.getCurrentUser();
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [images, setImages] = useState([null, null]);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [resultVideoUrl, setResultVideoUrl] = useState(null);
  const [genError, setGenError] = useState(null);
  const exampleVideoRef = useRef(null);
  const [exampleSoundOn, setExampleSoundOn] = useState(true);
  const [cardSoundOn, setCardSoundOn] = useState({});
  const cardVideoRefs = useRef({});
  const [photoTipOpen, setPhotoTipOpen] = useState(false);
  const [photoTipAnchor, setPhotoTipAnchor] = useState({ left: 0, top: 0 });

  useEffect(() => {
    setTemplatesLoading(true);
    api.getTemplates().then((res) => {
      setTemplates(Array.isArray(res.data) ? res.data : []);
      const cats = res.meta?.categories;
      setCategories(Array.isArray(cats) ? cats : []);
    }).finally(() => setTemplatesLoading(false));
  }, []);


  const activeTemplate = templates.find((t) => t.id === activeTemplateId);

  // При открытии модалки с примером видео — звук по умолчанию вкл, автозапуск
  useEffect(() => {
    if (activeTemplate?.example_video_url) {
      setExampleSoundOn(true);
      if (exampleVideoRef.current) {
        exampleVideoRef.current.play().catch(() => {});
      }
    }
  }, [activeTemplate?.example_video_url]);

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
    setActiveTemplateId(null);
    if (!generating) {
      setResultVideoUrl(null);
      setGenError(null);
      setJobId(null);
      setImages([null, null]);
    }
  };

  const startOver = () => {
    setResultVideoUrl(null);
    setGenError(null);
    setJobId(null);
  };

  const retryGeneration = () => {
    setGenError(null);
    handleGenerate();
  };

  return (
    <div className="p-6 lg:p-8">
      <section className="mb-10">
        {/* Categories pills — только когда есть категории с API */}
        {categories.length > 0 && (
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
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
          {templatesLoading ? (
            <p className="col-span-full text-center py-8 text-gray-500">Загрузка шаблонов…</p>
          ) : templates.length === 0 ? (
            <p className="col-span-full text-center py-8 text-gray-500">Нет шаблонов</p>
          ) : (() => {
            const filtered = activeCategory === null ? templates : templates.filter((t) => t.category === activeCategory);
            return filtered.length ? filtered.map((t) => (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveTemplateId(t.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTemplateId(t.id);
                  }
                }}
                onMouseEnter={() => {
                  const video = cardVideoRefs.current[t.id];
                  if (!video) return;
                  const play = () => video.play().catch(() => {});
                  if (video.readyState >= 2) {
                    play();
                  } else {
                    video.addEventListener('canplay', play, { once: true });
                  }
                }}
                onMouseLeave={() => {
                  const video = cardVideoRefs.current[t.id];
                  if (video) {
                    video.pause();
                    video.currentTime = 0;
                  }
                }}
                className="group rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200 text-left cursor-pointer"
              >
                <div className="relative aspect-[9/16] bg-gray-900">
                  {t.example_video_url ? (
                    <>
                      {t.preview_url && (
                        <img src={getStorageUrl(t.preview_url)} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />
                      )}
                      <video
                        ref={(el) => { cardVideoRefs.current[t.id] = el; }}
                        src={getStorageUrl(t.example_video_url)}
                        poster={t.preview_url ? getStorageUrl(t.preview_url) : undefined}
                        loop
                        playsInline
                        muted={!cardSoundOn[t.id]}
                        preload="auto"
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = !cardSoundOn[t.id];
                          setCardSoundOn((prev) => ({ ...prev, [t.id]: next }));
                          const video = cardVideoRefs.current[t.id];
                          if (video) {
                            video.muted = !next;
                            if (next) video.play().catch(() => {});
                          }
                        }}
                        className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-opacity opacity-0 group-hover:opacity-100 z-10"
                        aria-label={cardSoundOn[t.id] ? 'Выключить звук' : 'Включить звук'}
                      >
                        {cardSoundOn[t.id] ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                          </svg>
                        )}
                      </button>
                      {!t.preview_url && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-700 pointer-events-none" />
                      )}
                    </>
                  ) : t.preview_url ? (
                    <img src={getStorageUrl(t.preview_url)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-700" />
                  )}
                  <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                </div>
              </div>
            )) : (
              <p className="col-span-full text-center py-8 text-gray-500">Нет шаблонов в этой категории</p>
            );
          })()}
        </div>
      </section>

      {/* Модалка настройки шаблона — светлая, минималистичная */}
      <style>{`
        @keyframes floatFrame {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-12px) scale(1.05); opacity: 0.25; }
        }
        @keyframes shimmerBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
      {activeTemplateId !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <span className="sr-only">Закрыть</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* Левая колонка: превью, результат или анимация генерации */}
              <div className="lg:w-2/5 border-b lg:border-b-0 lg:border-r border-gray-200 p-4 flex flex-col gap-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[min(520px,70vh)] w-full mx-auto">
                  {generating ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-primary/20 to-gray-900">
                      <div className="relative flex items-center justify-center">
                        {/* Пульсирующие кольца */}
                        <span className="absolute w-24 h-24 rounded-full border-2 border-primary/40 animate-ping [animation-duration:2s]" />
                        <span className="absolute w-20 h-20 rounded-full border-2 border-primary/50 animate-ping [animation-duration:2.5s] [animation-delay:0.3s]" />
                        <span className="absolute w-16 h-16 rounded-full border-2 border-primary/60 animate-ping [animation-duration:2.2s] [animation-delay:0.6s]" />
                        <div className="relative w-14 h-14 rounded-2xl bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      {/* Плывущие «кадры» */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="absolute w-12 h-16 rounded bg-white/5 border border-white/10"
                            style={{
                              left: `${15 + i * 25}%`,
                              top: `${20 + (i % 2) * 45}%`,
                              animation: `floatFrame 4s ease-in-out infinite`,
                              animationDelay: `${i * 0.5}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : resultVideoUrl ? (
                    <video
                      src={getStorageUrl(resultVideoUrl)}
                      controls
                      className="w-full h-full object-cover"
                      playsInline
                    />
                  ) : activeTemplate?.example_video_url ? (
                    <>
                      <video
                        ref={exampleVideoRef}
                        src={getStorageUrl(activeTemplate.example_video_url)}
                        autoPlay
                        muted={!exampleSoundOn}
                        loop
                        playsInline
                        className="w-full h-full object-cover [&::-webkit-media-controls]:hidden"
                        style={{ pointerEvents: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => setExampleSoundOn((v) => !v)}
                        className="absolute bottom-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        aria-label={exampleSoundOn ? 'Выключить звук' : 'Включить звук'}
                      >
                        {exampleSoundOn ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                          </svg>
                        )}
                      </button>
                    </>
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

              </div>

              {/* Правая колонка: форма, результат или экран генерации */}
              <div className="lg:w-3/5 p-4 sm:p-6 flex flex-col gap-4">
                {resultVideoUrl ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
                      <svg className="w-9 h-9 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Готово!</h3>
                    <p className="text-gray-600 mb-8 max-w-sm">
                      Видео создано. Посмотрите превью слева, скачайте его или создайте ещё одно.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={startOver}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Создать ещё
                      </button>
                      <Link
                        to="/dashboard/my-videos"
                        onClick={closeModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        В мои видео
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ) : generating ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 sm:py-12">
                    <p className="text-xl font-semibold text-gray-900 mb-1">Создаём ваше видео</p>
                    <p className="text-sm text-gray-500 mb-6">Обычно это занимает 2–3 минуты</p>
                    <div className="w-full max-w-xs h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full w-1/3 rounded-full bg-primary"
                        style={{ animation: 'shimmerBar 2s ease-in-out infinite' }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-4">ИИ обрабатывает кадры и собирает ролик</p>
                  </div>
                ) : genError ? (
                  <>
                    <div className="rounded-2xl border-2 border-red-100 bg-red-50/90 p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-red-900 mb-1">Не удалось создать видео</h4>
                          <p className="text-sm text-red-700 mb-4">{genError}</p>
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={retryGeneration}
                              disabled={generating}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors"
                            >
                              {generating ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              )}
                              {generating ? 'Повторная попытка…' : 'Повторить попытку'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setGenError(null)}
                              disabled={generating}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 text-sm font-medium rounded-xl hover:bg-red-50 disabled:opacity-60 transition-colors"
                            >
                              Изменить параметры
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {!generating && (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">Фото продукта</h4>
                            <span
                              className="text-[11px] text-primary cursor-help border-b border-dashed border-primary/50"
                              onMouseEnter={(e) => {
                                const r = e.currentTarget.getBoundingClientRect();
                                setPhotoTipAnchor({ left: r.left, top: r.bottom + 6 });
                                setPhotoTipOpen(true);
                              }}
                              onMouseLeave={() => setPhotoTipOpen(false)}
                            >
                              Подсказка
                            </span>
                            {photoTipOpen && createPortal(
                              <div
                                className="fixed w-72 p-3.5 text-left bg-white border border-gray-200 rounded-xl shadow-xl z-[9999]"
                                style={{ left: photoTipAnchor.left, top: photoTipAnchor.top }}
                                onMouseEnter={() => setPhotoTipOpen(true)}
                                onMouseLeave={() => setPhotoTipOpen(false)}
                              >
                                <p className="text-sm text-gray-700 leading-snug">
                                  Загружайте фото продукта с разных ракурсов — так результат генерации будет качественнее.
                                </p>
                                <p className="text-sm text-gray-700 leading-snug mt-2 pt-2 border-t border-gray-100">
                                  Не загружайте фото с людьми в кадре: для ИИ подходят только изображения самого продукта.
                                </p>
                              </div>,
                              document.body
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            Если не загружаете — используются референсы шаблона.
                          </p>
                          <div className="flex gap-2 max-w-[200px]">
                            {[0, 1].map((slot) => (
                              <label key={slot} className="cursor-pointer flex-1 min-w-0">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => setImageAt(slot, e.target.files?.[0] || null)}
                                />
                                <div className="aspect-square w-full max-w-[92px] rounded-lg border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-[11px] text-gray-500 hover:border-primary hover:text-primary transition-colors overflow-hidden">
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
                            <h4 className="text-sm font-medium text-gray-900">Описание</h4>
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
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">Фото продукта</h4>
                        <span
                          className="text-[11px] text-primary cursor-help border-b border-dashed border-primary/50"
                          onMouseEnter={(e) => {
                            const r = e.currentTarget.getBoundingClientRect();
                            setPhotoTipAnchor({ left: r.left, top: r.bottom + 6 });
                            setPhotoTipOpen(true);
                          }}
                          onMouseLeave={() => setPhotoTipOpen(false)}
                        >
                          Подсказка
                        </span>
                        {photoTipOpen && createPortal(
                          <div
                            className="fixed w-72 p-3.5 text-left bg-white border border-gray-200 rounded-xl shadow-xl z-[9999]"
                            style={{ left: photoTipAnchor.left, top: photoTipAnchor.top }}
                            onMouseEnter={() => setPhotoTipOpen(true)}
                            onMouseLeave={() => setPhotoTipOpen(false)}
                          >
                            <p className="text-sm text-gray-700 leading-snug">
                              Загружайте фото продукта с разных ракурсов — так результат генерации будет качественнее.
                            </p>
                            <p className="text-sm text-gray-700 leading-snug mt-2 pt-2 border-t border-gray-100">
                              Не загружайте фото с людьми в кадре: для ИИ подходят только изображения самого продукта.
                            </p>
                          </div>,
                          document.body
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        Если не загружаете — используются референсы шаблона.
                      </p>
                      <div className="flex gap-2 max-w-[200px]">
                        {[0, 1].map((slot) => (
                          <label key={slot} className="cursor-pointer flex-1 min-w-0">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => setImageAt(slot, e.target.files?.[0] || null)}
                            />
                            <div className="aspect-square w-full max-w-[92px] rounded-lg border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-[11px] text-gray-500 hover:border-primary hover:text-primary transition-colors overflow-hidden">
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
                        <h4 className="text-sm font-medium text-gray-900">Описание</h4>
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
                    Формат: 8 сек · вертикальное видео 9:16
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                    >
                      {resultVideoUrl ? 'Закрыть' : generating ? 'Закрыть' : 'Отменить'}
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
