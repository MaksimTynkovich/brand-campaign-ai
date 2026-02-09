import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Sparkles from '../assets/icons/Sparkles';
import Video from '../assets/icons/Video';
import Download from '../assets/icons/Download';

const POLL_INTERVAL_MS = 1000;

function CreateFromTemplate() {
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [images, setImages] = useState([]);
  const [voiceoverText, setVoiceoverText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [resultCreative, setResultCreative] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.getTemplates()
      .then((data) => {
        if (!cancelled) setTemplates(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTemplates(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedTemplate) {
      setVoiceoverText('');
      return;
    }
    setVoiceoverText(selectedTemplate.default_voiceover || '');
  }, [selectedTemplate]);

  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...newFiles].slice(0, 3));
    setError(null);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const pollStatus = useCallback(async (id) => {
    const res = await api.getGenerationStatus(id);
    if (res.status === 'completed' && res.creative) {
      setResultCreative(res.creative);
      setGenerating(false);
      setJobId(null);
      return true;
    }
    if (res.status === 'failed') {
      setError(res.message || 'Генерация не удалась');
      setGenerating(false);
      setJobId(null);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!jobId || !generating) return;
    const t = setInterval(async () => {
      try {
        const done = await pollStatus(jobId);
        if (done) clearInterval(t);
      } catch (e) {
        setError(e.message || 'Ошибка проверки статуса');
        setGenerating(false);
        setJobId(null);
        clearInterval(t);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [jobId, generating, pollStatus]);

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setError(null);
    setResultCreative(null);
    setGenerating(true);
    try {
      const res = await api.startGenerationFromTemplate(
        selectedTemplate.id,
        voiceoverText.trim() || selectedTemplate.default_voiceover || 'Текст озвучки.',
        images
      );
      if (res.job_id) {
        setJobId(res.job_id);
      } else {
        setError('Нет job_id в ответе');
        setGenerating(false);
      }
    } catch (e) {
      setError(e.message || 'Не удалось запустить генерацию');
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultCreative?.video_url) return;
    const a = document.createElement('a');
    a.href = resultCreative.video_url;
    a.download = `creative_${resultCreative.id}.mp4`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const resetFlow = () => {
    setResultCreative(null);
    setJobId(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-gray-900 font-bold">
              <Sparkles className="w-6 h-6 text-primary" />
              adPilotsAI
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                На главную
              </Link>
              {api.isAuthenticated() ? (
                <button
                  type="button"
                  onClick={() => { api.logout(); window.location.href = '/'; }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium"
                >
                  Выйти
                </button>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90"
                >
                  Войти
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Video className="w-8 h-8 text-primary" />
          Выберите шаблон и повторите за 2 клика
        </h1>
        <p className="text-gray-600 mb-8">
          Загрузите фото продукта и при необходимости отредактируйте текст озвучки — затем нажмите «Сгенерировать».
        </p>

        {/* Галерея шаблонов */}
        <section className="mb-10">
          {loadingTemplates ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-gray-200 aspect-[9/16] max-h-[320px] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setSelectedTemplate(t); resetFlow(); }}
                  className={`text-left rounded-2xl overflow-hidden shadow-lg transition-all duration-200 border-2 ${
                    selectedTemplate?.id === t.id
                      ? 'border-primary ring-2 ring-primary/30 scale-[0.98]'
                      : 'border-transparent hover:border-gray-300 hover:shadow-xl'
                  }`}
                >
                  <div className="relative aspect-[9/16] max-h-[320px] bg-black">
                    <img
                      src={t.preview_url}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <span className="font-semibold">{t.name}</span>
                      {t.description && (
                        <p className="text-sm text-white/90 mt-1 line-clamp-2">{t.description}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Панель: загрузка + озвучка + кнопка */}
        {selectedTemplate && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Повторить шаблон «{selectedTemplate.name}»</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <p className="text-sm text-gray-500 mb-2">Превью шаблона</p>
                <div className="rounded-xl overflow-hidden aspect-[9/16] max-h-[280px] bg-black">
                  <img
                    src={selectedTemplate.preview_url}
                    alt={selectedTemplate.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Фото продукта (1–3 шт.)
                  </label>
                  <div className="flex flex-wrap gap-3 items-start">
                    {images.length < 3 && (
                      <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors">
                        <span className="text-2xl text-gray-400">+</span>
                        <span className="text-xs text-gray-500">Добавить</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                    {images.map((file, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Фото ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Текст озвучки (AI UGC)
                  </label>
                  <textarea
                    value={voiceoverText}
                    onChange={(e) => setVoiceoverText(e.target.value)}
                    placeholder="Введите или отредактируйте текст для озвучки..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y"
                  />
                </div>
                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Генерация...
                    </>
                  ) : (
                    'Сгенерировать'
                  )}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Результат */}
        {resultCreative && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Готово</h2>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="rounded-xl overflow-hidden aspect-[9/16] max-h-[360px] bg-black flex-shrink-0">
                <img
                  src={resultCreative.video_url}
                  alt="Результат"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-gray-600 text-sm mb-4">Скачайте видео или сохраните в дашборде после входа.</p>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:opacity-90"
                >
                  <Download className="w-5 h-5" />
                  Скачать видео
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default CreateFromTemplate;
