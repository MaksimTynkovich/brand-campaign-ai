import React, { useState, useEffect } from 'react';
import api, { getStorageUrl } from '../../services/api';

const STATUS_LABELS = {
  pending: 'В очереди',
  processing: 'Создаётся',
  completed: 'Готово',
  failed: 'Ошибка',
};

function MyVideos() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getMyVideos()
      .then((res) => setList(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setError(err.message || 'Не удалось загрузить список'))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const isInProgress = (status) => status === 'pending' || status === 'processing';

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Мои видео</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-gray-100 aspect-[9/16] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Мои видео</h1>
        <p className="text-red-600 bg-red-50 rounded-xl p-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Мои видео</h1>
      <p className="text-gray-600 mb-8">
        Все ваши ролики: в процессе создания и уже готовые.
      </p>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600 mb-2">Пока нет ни одного видео.</p>
          <p className="text-sm text-gray-500">
            Перейдите на главную дашборда, выберите шаблон и запустите генерацию.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200"
            >
              <div className="relative aspect-[9/16] bg-gray-900">
                {item.video_url ? (
                  <video
                    src={getStorageUrl(item.video_url)}
                    poster={item.template?.preview_url ? getStorageUrl(item.template.preview_url) : undefined}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : item.template?.preview_url ? (
                  <img
                    src={getStorageUrl(item.template.preview_url)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                )}
                {/* Прелоадер поверх карточки для видео в процессе создания */}
                {isInProgress(item.status) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <svg
                      className="w-14 h-14 text-white animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                )}
                {!item.video_url && !item.template?.preview_url && !isInProgress(item.status) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/50 text-4xl">?</span>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                      item.status === 'completed'
                        ? 'bg-green-500/90 text-white'
                        : item.status === 'failed'
                        ? 'bg-red-500/90 text-white'
                        : 'bg-primary/90 text-white'
                    }`}
                  >
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                </div>
                {item.status === 'failed' && item.error_message && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70 text-white text-xs line-clamp-2">
                    {item.error_message}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-500 mb-1">{formatDate(item.created_at)}</p>
                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                  {item.template?.category || `Видео #${item.id}`}
                </p>
                {item.video_url && (
                  <a
                    href={getStorageUrl(item.video_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
                  >
                    Смотреть
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyVideos;
