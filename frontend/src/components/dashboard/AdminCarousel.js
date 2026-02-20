import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getStorageUrl } from '../../services/api';

function AdminCarousel() {
  const navigate = useNavigate();
  const [carouselIds, setCarouselIds] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .getAdminCarousel()
      .then((res) => {
        setCarouselIds(res.carousel_template_ids ?? []);
        setTemplates(res.templates ?? []);
      })
      .catch((e) => setError(e.message || 'Не удалось загрузить данные'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!api.getCurrentUser()?.is_admin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    load();
  }, [navigate]);

  const addToCarousel = (id) => {
    if (carouselIds.includes(id)) return;
    setCarouselIds((prev) => [...prev, id]);
  };

  const removeFromCarousel = (index) => {
    setCarouselIds((prev) => prev.filter((_, i) => i !== index));
  };

  const move = (index, direction) => {
    const next = [...carouselIds];
    const to = index + direction;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    setCarouselIds(next);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.updateAdminCarousel(carouselIds);
      load();
    } catch (err) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const inCarouselSet = new Set(carouselIds);
  const availableTemplates = templates.filter((t) => !inCarouselSet.has(t.id));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Карусель на главной</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Выберите шаблоны с примером видео — они появятся в слайдере на главной. Порядок можно менять.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* В карусели */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">В карусели (порядок слева направо)</h2>
            {carouselIds.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">Добавьте шаблоны из списка справа</p>
            ) : (
              <ul className="space-y-2">
                {carouselIds.map((id, index) => {
                  const t = templates.find((x) => x.id === id);
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <span className="text-xs font-medium text-gray-400 w-6">{index + 1}</span>
                      {t?.preview_url ? (
                        <img
                          src={getStorageUrl(t.preview_url)}
                          alt=""
                          className="w-12 h-[21px] object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-[21px] rounded bg-gray-200 flex items-center justify-center text-[10px] text-gray-400">
                          —
                        </div>
                      )}
                      <span className="flex-1 text-sm text-gray-800 truncate">
                        {t?.description || `Шаблон #${id}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Влево"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={index === carouselIds.length - 1}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Вправо"
                        >
                          →
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCarousel(index)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                          title="Убрать"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {carouselIds.length > 0 && (
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="mt-4 w-full py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover disabled:opacity-60"
              >
                {saving ? 'Сохранение…' : 'Сохранить порядок'}
              </button>
            )}
          </div>

          {/* Доступные шаблоны (с видео) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Шаблоны с примером видео</h2>
            {availableTemplates.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">
                {templates.length === 0
                  ? 'Нет шаблонов с загруженным примером видео. Добавьте видео в шаблонах.'
                  : 'Все такие шаблоны уже в карусели.'}
              </p>
            ) : (
              <ul className="space-y-2 max-h-[400px] overflow-y-auto">
                {availableTemplates.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 hover:bg-gray-50"
                  >
                    {t.preview_url ? (
                      <img
                        src={getStorageUrl(t.preview_url)}
                        alt=""
                        className="w-12 h-[21px] object-cover rounded border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-[21px] rounded bg-gray-200 flex items-center justify-center text-[10px] text-gray-400">
                        —
                      </div>
                    )}
                    <span className="flex-1 text-sm text-gray-800 truncate">{t.description || `#${t.id}`}</span>
                    <button
                      type="button"
                      onClick={() => addToCarousel(t.id)}
                      className="px-3 py-1.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5"
                    >
                      В карусель
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCarousel;
