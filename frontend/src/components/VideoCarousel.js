import React, { useState, useEffect, useRef } from 'react';
import api, { getStorageUrl } from '../services/api';

function CarouselCard({ item, index, hoveredIndex, onHoverChange, soundEnabledIndex, onSoundToggle, sectionInView, globalIndex }) {
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [cardInView, setCardInView] = useState(false);

  const shouldLoad = sectionInView && cardInView;
  const isHovered = hoveredIndex === index;
  const isSoundOn = soundEnabledIndex === index;

  // Lazy: observe card, load video only when card is in view
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !sectionInView) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => setCardInView(e.isIntersecting));
      },
      { rootMargin: '100px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [sectionInView]);

  // When allowed, set video src and start playing (muted for autoplay policy)
  useEffect(() => {
    if (!shouldLoad || !item.example_video_url || !videoRef.current) return;
    const video = videoRef.current;
    if (video.src) return;
    const url = getStorageUrl(item.example_video_url);
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.src = url;
    setVideoLoaded(true);
    const play = () => {
      video.muted = true;
      video.play().catch(() => {});
    };
    video.addEventListener('canplay', play, { once: true });
    video.addEventListener('loadeddata', play, { once: true });
    video.load();
    play();
    return () => {
      video.removeEventListener('canplay', play);
      video.removeEventListener('loadeddata', play);
    };
  }, [shouldLoad, item.example_video_url]);

  // При наведении только останавливаем карусель, видео играет без звука
  const handleMouseEnter = () => onHoverChange(index);
  const handleMouseLeave = () => onHoverChange(null);

  // Звук по клику на иконку или на сам шаблон (в контексте жеста пользователя)
  const handleSoundClick = (e) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video || !videoLoaded) return;
    const turnOn = soundEnabledIndex !== index;
    onSoundToggle(turnOn ? index : null);
    video.muted = !turnOn;
    if (turnOn) video.play().catch(() => {});
  };

  // Когда звук отключили снаружи (уход с карусели) — заглушаем
  useEffect(() => {
    if (!videoRef.current || !videoLoaded) return;
    if (soundEnabledIndex !== index) videoRef.current.muted = true;
  }, [soundEnabledIndex, index, videoLoaded]);

  // Пауза видео, когда карточка далеко за экраном — меньше нагрузка, нет лагов
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoLoaded) return;
    if (cardInView) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [cardInView, videoLoaded]);

  const posterUrl = item.preview_url ? getStorageUrl(item.preview_url) : null;
  const videoUrl = item.example_video_url;

  return (
    <div
      ref={cardRef}
      className="flex-shrink-0 mx-2 w-[260px] group cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => handleSoundClick()}
    >
      <div className="relative rounded-2xl overflow-hidden shadow-lg bg-black aspect-[9/16] hover:shadow-2xl transition-shadow duration-300">
        {videoUrl && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            poster={posterUrl || undefined}
            preload="none"
            muted
            loop
            playsInline
            aria-label={item.description || `Шаблон ${globalIndex + 1}`}
          />
        )}
        {(!videoUrl || !videoLoaded) && posterUrl && (
          <img
            src={posterUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}
        {!videoUrl && !posterUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            Нет видео
          </div>
        )}
        {videoUrl && videoLoaded && (
          <button
            type="button"
            onClick={(e) => handleSoundClick(e)}
            className="absolute bottom-2 right-2 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black/70 transition-colors cursor-pointer"
            title={isSoundOn ? 'Выключить звук' : 'Включить звук'}
            aria-label={isSoundOn ? 'Выключить звук' : 'Включить звук'}
          >
            {isSoundOn ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function VideoCarousel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [soundEnabledIndex, setSoundEnabledIndex] = useState(null);
  const sectionRef = useRef(null);
  const [sectionInView, setSectionInView] = useState(true);

  useEffect(() => {
    api
      .getCarousel()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || items.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => setSectionInView(e.isIntersecting));
      },
      { rootMargin: '50% 0px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [items.length]);

  if (loading) {
    return (
      <div className="pb-16 bg-white overflow-hidden">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Четыре копии ленты для бесшовного бесконечного цикла: сдвиг на -25% = ровно один круг шаблонов
  const duplicated = [...items, ...items, ...items, ...items];

  return (
    <div ref={sectionRef} className="pb-16 bg-white overflow-hidden">
      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          setHoveredIndex(null);
          setSoundEnabledIndex(null);
        }}
      >
        <div
          className={`flex w-max animate-infinite-scroll [animation-duration:12s] ${isPaused ? '[animation-play-state:paused]' : ''}`}
        >
          {duplicated.map((item, index) => {
            const sourceIndex = index % items.length;
            return (
              <CarouselCard
                key={`${item.id}-${index}`}
                item={item}
                index={index}
                globalIndex={sourceIndex}
                hoveredIndex={hoveredIndex}
                onHoverChange={setHoveredIndex}
                soundEnabledIndex={soundEnabledIndex}
                onSoundToggle={setSoundEnabledIndex}
                sectionInView={sectionInView}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VideoCarousel;
