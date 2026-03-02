import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { getStorageUrl, API_BASE_URL } from '../../services/api';

const STATUS_LABELS = {
  pending: 'В очереди',
  processing: 'Создаётся',
  completed: 'Готово',
  failed: 'Ошибка',
};
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 120;

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
  const [billingPlan, setBillingPlan] = useState(api.getCurrentUser()?.plan ?? 'trial');
  const paidPlans = ['professional', 'business', 'pro', 'enterprise'];
  const isPaidUser = paidPlans.includes(String(billingPlan ?? 'trial').toLowerCase());
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cardSoundOn, setCardSoundOn] = useState({});
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalPromptText, setModalPromptText] = useState('');
  const [modalImages, setModalImages] = useState([null, null]);
  const [modalSourceJobId, setModalSourceJobId] = useState(null);
  const [modalSourceImages, setModalSourceImages] = useState([]);
  const [modalGenerating, setModalGenerating] = useState(false);
  const [modalResultVideoUrl, setModalResultVideoUrl] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [modalSoundOn, setModalSoundOn] = useState(true);
  const cardVideoRefs = useRef({});
  const modalVideoRef = useRef(null);

  const refreshBillingPlan = useCallback(() => {
    api
      .getBillingFromApi()
      .then(({ plan }) => {
        if (plan) setBillingPlan(plan);
      })
      .catch(() => {});
  }, []);

  const handleDownload = async (item) => {
    if (!item?.video_url) return;
    setDownloadingId(item.id);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/generation/${item.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `video_${item.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(getStorageUrl(item.video_url), '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    api
      .getMyVideos()
      .then((res) => setList(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setError(err.message || 'Не удалось загрузить список'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshBillingPlan();
    const onFocus = () => refreshBillingPlan();
    window.addEventListener('focus', onFocus);
    const intervalId = window.setInterval(refreshBillingPlan, 60000);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(intervalId);
    };
  }, [refreshBillingPlan]);

  useEffect(() => {
    if (!selectedItem || modalGenerating || !modalVideoRef.current) return;
    modalVideoRef.current.play().catch(() => {});
  }, [selectedItem, modalGenerating, modalResultVideoUrl]);

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

  const openDetails = (item) => {
    setSelectedItem(item);
    setModalPromptText(item.user_prompt || '');
    setModalImages([null, null]);
    setModalSourceJobId(item.id);
    setModalSourceImages(Array.isArray(item.input_images) ? item.input_images.slice(0, 2) : []);
    setModalGenerating(false);
    setModalResultVideoUrl(null);
    setModalError(null);
    setModalSoundOn(true);
  };

  const closeDetails = () => {
    if (modalGenerating) return;
    setSelectedItem(null);
    setModalPromptText('');
    setModalImages([null, null]);
    setModalSourceJobId(null);
    setModalSourceImages([]);
    setModalGenerating(false);
    setModalResultVideoUrl(null);
    setModalError(null);
    setModalSoundOn(true);
  };

  const setModalImageAt = (index, file) => {
    if (file) {
      setModalSourceJobId(null);
      setModalSourceImages([]);
    }
    setModalImages((prev) => {
      const next = [...prev];
      next[index] = file || null;
      return next;
    });
  };

  const handleRepeatTemplate = async () => {
    if (!selectedItem?.template?.id) return;

    setModalGenerating(true);
    setModalResultVideoUrl(null);
    setModalError(null);
    const imageFiles = modalImages.filter(Boolean);

    try {
      const res = await api.startGenerationFromTemplate(
        selectedItem.template.id,
        modalPromptText.trim(),
        imageFiles,
        imageFiles.length === 0 && modalSourceJobId ? { sourceJobId: modalSourceJobId } : {}
      );

      const id = res.data?.job_id ?? res.job_id;
      if (!id) throw new Error('Нет job_id в ответе');

      let attempts = 0;
      const poll = async () => {
        if (attempts >= MAX_POLL_ATTEMPTS) {
          setModalError('Превышено время ожидания');
          setModalGenerating(false);
          return;
        }
        const status = await api.getGenerationStatus(id);
        if (status.status === 'completed') {
          setModalResultVideoUrl(status.video_url || null);
          setModalGenerating(false);
          setModalError(null);
          return;
        }
        if (status.status === 'failed') {
          setModalError(status.error_message || 'Генерация не удалась');
          setModalGenerating(false);
          return;
        }
        attempts += 1;
        setTimeout(poll, POLL_INTERVAL_MS);
      };
      await poll();
    } catch (err) {
      setModalError(err.message || 'Ошибка запуска генерации');
      setModalGenerating(false);
    }
  };

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
            Выберите шаблон на главной и запустите генерацию — ролик появится здесь.
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
              className={`group rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm transition-all duration-200 text-left ${
                item.video_url ? 'hover:shadow-lg hover:border-primary/20 cursor-pointer' : ''
              }`}
              role={item.video_url ? 'button' : undefined}
              tabIndex={item.video_url ? 0 : undefined}
              onClick={() => item.video_url && openDetails(item)}
              onKeyDown={(e) => {
                if (!item.video_url) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openDetails(item);
                }
              }}
            >
              <div
                className="relative aspect-[9/16] bg-gray-900"
                onMouseEnter={() => {
                  if (!item.video_url) return;
                  const video = cardVideoRefs.current[item.id];
                  if (!video) return;
                  const play = () => video.play().catch(() => {});
                  if (video.readyState >= 2) play();
                  else video.addEventListener('canplay', play, { once: true });
                }}
                onMouseLeave={() => {
                  const video = cardVideoRefs.current[item.id];
                  if (video) {
                    video.pause();
                    video.currentTime = 0;
                  }
                }}
              >
                {item.video_url ? (
                  <>
                    {item.template?.preview_url && (
                      <img
                        src={getStorageUrl(item.template.preview_url)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        aria-hidden
                      />
                    )}
                    <video
                      ref={(el) => { cardVideoRefs.current[item.id] = el; }}
                      src={getStorageUrl(item.video_url)}
                      poster={item.template?.preview_url ? getStorageUrl(item.template.preview_url) : undefined}
                      loop
                      playsInline
                      muted={!cardSoundOn[item.id]}
                      preload="auto"
                      className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = !cardSoundOn[item.id];
                        setCardSoundOn((prev) => ({ ...prev, [item.id]: next }));
                        const video = cardVideoRefs.current[item.id];
                        if (video) {
                          video.muted = !next;
                          if (next) video.play().catch(() => {});
                        }
                      }}
                      className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-opacity opacity-0 group-hover:opacity-100 z-10"
                      aria-label={cardSoundOn[item.id] ? 'Выключить звук' : 'Включить звук'}
                    >
                      {cardSoundOn[item.id] ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                        </svg>
                      )}
                    </button>
                  </>
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
                      <svg className="w-14 h-14 text-white animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
                {item.video_url && (
                  <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetails(item);
                      }}
                      className="mb-3 px-4 py-2 rounded-xl bg-white/95 text-gray-900 text-xs sm:text-sm font-semibold shadow-lg hover:bg-white"
                    >
                      Подробнее
                    </button>
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
              {!item.video_url && (
                <div className="p-4">
                  <div className="py-2 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium text-center">
                    Ожидание
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
      {selectedItem && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div />
              <button
                type="button"
                onClick={closeDetails}
                disabled={modalGenerating}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 disabled:opacity-60"
              >
                <span className="sr-only">Закрыть</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-2/5 border-b lg:border-b-0 lg:border-r border-gray-200 p-4 flex flex-col gap-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[min(520px,70vh)] w-full mx-auto">
                  {modalGenerating ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-primary/20 to-gray-900">
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-24 h-24 rounded-full border-2 border-primary/40 animate-ping [animation-duration:2s]" />
                        <span className="absolute w-20 h-20 rounded-full border-2 border-primary/50 animate-ping [animation-duration:2.5s] [animation-delay:0.3s]" />
                        <span className="absolute w-16 h-16 rounded-full border-2 border-primary/60 animate-ping [animation-duration:2.2s] [animation-delay:0.6s]" />
                        <div className="relative w-14 h-14 rounded-2xl bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="absolute w-12 h-16 rounded bg-white/5 border border-white/10"
                            style={{
                              left: `${15 + i * 25}%`,
                              top: `${20 + (i % 2) * 45}%`,
                              animation: 'floatFrame 4s ease-in-out infinite',
                              animationDelay: `${i * 0.5}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={modalVideoRef}
                        src={getStorageUrl(modalResultVideoUrl || selectedItem.video_url)}
                        autoPlay
                        loop
                        playsInline
                        muted={!modalSoundOn}
                        className="w-full h-full object-cover [&::-webkit-media-controls]:hidden"
                        style={{ pointerEvents: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = !modalSoundOn;
                          setModalSoundOn(next);
                          if (modalVideoRef.current) modalVideoRef.current.muted = !next;
                        }}
                        className="absolute bottom-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
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
                    </>
                  )}
                </div>
              </div>

              <div className="lg:w-3/5 p-4 sm:p-6 flex flex-col gap-4">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Создано: {formatDate(selectedItem.created_at)}
                </p>
                {modalGenerating ? (
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
                ) : (
                  <>
                    {!isPaidUser && (
                      <div className="flex justify-start">
                        <Link
                          to="/dashboard/billing"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300/70 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 hover:border-amber-400 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5L3 8z" />
                          </svg>
                          Убрать водяной знак
                        </Link>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Фото продукта</h4>
                      <p className="text-xs text-gray-500 mb-2">
                        Если не загружаете — используются фото из текущей генерации или референсы шаблона.
                      </p>
                      {modalSourceJobId && modalSourceImages.length > 0 && (
                        <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 p-2.5">
                          <p className="text-[11px] text-primary mb-2">
                            Сейчас выбраны фото из текущей генерации.
                          </p>
                          <div className="flex gap-2">
                            {modalSourceImages.map((img, idx) => (
                              <img
                                key={`${img}-${idx}`}
                                src={img}
                                alt={`Фото продукта ${idx + 1}`}
                                className="w-12 h-12 rounded-lg object-cover border border-primary/20"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 max-w-[200px]">
                        {[0, 1].map((slot) => (
                          <label key={slot} className="cursor-pointer flex-1 min-w-0">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => setModalImageAt(slot, e.target.files?.[0] || null)}
                            />
                            <div className="aspect-square w-full max-w-[92px] rounded-lg border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-[11px] text-gray-500 hover:border-primary hover:text-primary transition-colors overflow-hidden">
                              {modalImages[slot] ? (
                                <span className="px-2 truncate w-full text-center text-gray-700">
                                  {modalImages[slot].name}
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
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Описание</h4>
                      <textarea
                        value={modalPromptText}
                        onChange={(e) => setModalPromptText(e.target.value.slice(0, 5000))}
                        rows={6}
                        placeholder={selectedItem.template?.default_voiceover ?? ''}
                        className="w-full h-40 sm:h-44 lg:h-48 bg-white border border-gray-300 rounded-2xl px-3 sm:px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                      />
                      <div className="mt-1 text-[11px] text-gray-400 text-right">
                        {modalPromptText.length} / 5000
                      </div>
                    </div>

                    {modalError && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm text-red-700">{modalError}</p>
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-[11px] text-gray-400">
                    Формат: 8 сек · вертикальное видео 9:16
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={modalGenerating}
                      onClick={handleRepeatTemplate}
                      className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-primary text-white hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {modalGenerating ? 'Генерация…' : 'Повторить шаблон'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(selectedItem)}
                      disabled={downloadingId === selectedItem.id || modalGenerating}
                      className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-xl border border-gray-300 text-gray-700 hover:border-primary/40 hover:text-primary disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {downloadingId === selectedItem.id ? 'Скачивание…' : 'Скачать'}
                    </button>
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

export default MyVideos;
