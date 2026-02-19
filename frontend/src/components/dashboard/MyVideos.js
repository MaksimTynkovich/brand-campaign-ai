import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api, { getStorageUrl, API_BASE_URL } from '../../services/api';

const STATUS_LABELS = {
  pending: 'В очереди',
  processing: 'Создаётся',
  completed: 'Готово',
  failed: 'Ошибка',
};

function StatusBadge({ status }) {
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isPending = status === 'pending' || status === 'processing';
  const styles = isCompleted
    ? 'bg-emerald-500/95 text-white shadow-emerald-500/30'
    : isFailed
    ? 'bg-red-500/95 text-white shadow-red-500/30'
    : 'bg-primary/95 text-white shadow-primary/30';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-lg backdrop-blur-sm ${styles}`}
    >
      {isPending && (
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {isCompleted && (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {isFailed && (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function MyVideos() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [modalSoundOn, setModalSoundOn] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const modalVideoRef = useRef(null);

  const handleDownload = async () => {
    if (!selectedVideo?.video_url) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/generation/${selectedVideo.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `video_${selectedVideo.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(getStorageUrl(selectedVideo.video_url), '_blank');
    } finally {
      setDownloading(false);
    }
  };

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

  // При открытии модалки — звук вкл, запуск воспроизведения
  useEffect(() => {
    if (selectedVideo?.video_url) {
      setModalSoundOn(true);
      if (modalVideoRef.current) {
        modalVideoRef.current.play().catch(() => {});
      }
    }
  }, [selectedVideo?.video_url]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Мои видео</h1>
          <p className="text-gray-500">Загрузка списка…</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <div className="aspect-[9/16] bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Мои видео</h1>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-red-800">{error}</p>
            <p className="text-sm text-red-600 mt-1">Попробуйте обновить страницу или зайти позже.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Мои видео</h1>
        <p className="text-gray-500">
          Все ваши ролики: в процессе создания и уже готовые. Готовые можно открыть в новой вкладке.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 p-14 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-700 mb-2">Пока нет ни одного видео</p>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Выберите шаблон на главной дашборда и запустите генерацию — ролик появится здесь.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors"
          >
            Перейти к созданию
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {list.map((item) => (
            <div
              key={item.id}
              role={item.video_url ? 'button' : undefined}
              tabIndex={item.video_url ? 0 : undefined}
              onClick={item.video_url ? () => setSelectedVideo(item) : undefined}
              onKeyDown={item.video_url ? (e) => e.key === 'Enter' && setSelectedVideo(item) : undefined}
              className={`group rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm transition-all duration-300 ${
                item.video_url ? 'cursor-pointer hover:shadow-xl hover:border-primary/20' : ''
              }`}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                {isInProgress(item.status) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                    <div className="flex flex-col items-center gap-3">
                      <svg
                        className="w-14 h-14 text-white animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span className="text-white/90 text-sm font-medium">Создаётся…</span>
                    </div>
                  </div>
                )}
                {!item.video_url && !item.template?.preview_url && !isInProgress(item.status) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                    <span className="text-white/40 text-5xl font-light">?</span>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <StatusBadge status={item.status} />
                </div>
                {item.status === 'failed' && item.error_message && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/80 text-white text-xs line-clamp-2 backdrop-blur-sm">
                    {item.error_message}
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(item.created_at)}
                </p>
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                  {item.template?.category || `Видео #${item.id}`}
                </p>
                {!item.video_url && (
                  <div className="mt-2 py-2 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium text-center">
                    Ожидание
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно просмотра видео */}
      {selectedVideo?.video_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр видео"
        >
          <div
            className="relative flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-max max-w-[min(360px,calc(100vw-2rem))] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Шапка модалки */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate pr-2">
                {selectedVideo.template?.category || `Видео #${selectedVideo.id}`}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                aria-label="Закрыть"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Видео — по ширине контента, без чёрных полос по бокам */}
            <div className="flex justify-center shrink-0 w-fit mx-auto" style={{ height: 'min(500px, 58vh)' }}>
              <div className="relative h-full w-auto bg-black" style={{ aspectRatio: '9/16' }}>
                <video
                  ref={modalVideoRef}
                  src={getStorageUrl(selectedVideo.video_url)}
                  autoPlay
                  muted={!modalSoundOn}
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover [&::-webkit-media-controls]:hidden"
                  style={{ pointerEvents: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setModalSoundOn((v) => !v)}
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                  aria-label={modalSoundOn ? 'Выключить звук' : 'Включить звук'}
                >
                  {modalSoundOn ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Подвал: скачать и открыть в новой вкладке */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center justify-center gap-2 flex-1 py-2.5 px-4 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-70"
              >
                {downloading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                {downloading ? 'Скачивание…' : 'Скачать'}
              </button>
              <a
                href={getStorageUrl(selectedVideo.video_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                В новой вкладке
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyVideos;
