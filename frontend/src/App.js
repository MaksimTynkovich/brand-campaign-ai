import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import ProductPage from './pages/ProductPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import LegalPage from './pages/LegalPage';
import VideoCarousel from './components/VideoCarousel';
import Sparkles from './assets/icons/Sparkles';
import Package from './assets/icons/Package';
import Globe from './assets/icons/Globe';
import Video from './assets/icons/Video';
import Lightning from './assets/icons/Lightning';
import Checkmark from './assets/icons/Checkmark';
import api from './services/api';
import Logo from './assets/Logo';

function AppContent() {
  const [billingPeriod, setBillingPeriod] = useState('month'); // 'month' or 'year'
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Обработчик плавной прокрутки для якорных ссылок
  React.useEffect(() => {
    const handleAnchorClick = (e) => {
      // Находим ближайшую ссылку, если клик был по дочернему элементу
      const link = e.target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#') && href.length > 1) {
          e.preventDefault();
          const targetId = href.substring(1);
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            const headerOffset = 80; // Высота sticky header
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  const handlePrimaryCta = () => {
    if (!api.isAuthenticated()) {
      navigate('/register');
      return;
    }
    navigate('/dashboard');
  };

  const scrollToDemo = () => {
    const el = document.getElementById('demo');
    if (el) {
      const headerOffset = 80;
      const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 relative">
        <div className="max-w-1140 mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3">
              <Logo className="w-8 h-8" ariaLabel="Veydo — на главную" />
              <span className="text-xl font-bold text-gray-900 tracking-tight">VEYDO</span>
            </a>

            {/* Navigation Links — десктоп */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <a href="#demo" className="text-gray-700 hover:text-gray-900 font-medium transition-colors whitespace-nowrap">
                Демо
              </a>
              <a href="#steps" className="text-gray-700 hover:text-gray-900 font-medium transition-colors whitespace-nowrap">
                Как это работает
              </a>
              <a href="#features" className="text-gray-700 hover:text-gray-900 font-medium transition-colors whitespace-nowrap">
                Функции
              </a>
              <a href="#why" className="text-gray-700 hover:text-gray-900 font-medium transition-colors whitespace-nowrap">
                Сравнение
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 font-medium transition-colors whitespace-nowrap">
                Тарифы
              </a>
            </nav>

            {/* Бургер — мобильный */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Меню"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {api.isAuthenticated() ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all duration-200"
                >
                  Создать рекламу
                </button>
              ) : (
                <button
                  onClick={handlePrimaryCta}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all duration-200"
                >
                  Начать
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Мобильное меню — выезжающая панель */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg max-h-[80vh] overflow-y-auto">
            <nav className="flex flex-col py-4 px-6 gap-1">
              <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="py-3 px-4 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium">
                Демо
              </a>
              <a href="#steps" onClick={() => setMobileMenuOpen(false)} className="py-3 px-4 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium">
                Как это работает
              </a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-3 px-4 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium">
                Функции
              </a>
              <a href="#why" onClick={() => setMobileMenuOpen(false)} className="py-3 px-4 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium">
                Сравнение
              </a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-3 px-4 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium">
                Тарифы
              </a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-3 px-4 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium">
                Вопросы
              </a>
            </nav>
          </div>
        )}
      </header>

      <main>
        <>
            {/* Hero Section */}
            <section className="relative pt-24 pb-8 overflow-hidden bg-mesh">
              {/* Декоративные градиентные круги */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
                <div className="absolute top-1/2 -left-32 w-80 h-80 bg-blue-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
              </div>
              <div className="max-w-1140 mx-auto px-6 lg:px-8 relative">
                <div className="max-w-4xl mx-auto text-center">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8">
                    <Sparkles className="w-4 h-4" />
                    Бесплатный старт — без карты
                  </span>
                  <h1 className="text-heading1 text-gray-900 mb-6">
                    Создавайте рекламу <br className="hidden md:block" />
                    <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      через AI
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
                    Создавайте профессиональные видео для соцсетей за пару кликов — никаких сложностей и ограничений. AI поможет вам выделиться и привлечь клиентов.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={handlePrimaryCta}
                      className="px-8 py-4 bg-primary text-white rounded-2xl font-semibold text-lg hover:bg-primary-hover transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                    >
                      Попробовать бесплатно
                    </button>
                    <button
                      onClick={scrollToDemo}
                      className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-2xl font-semibold text-lg hover:border-gray-300 transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Смотреть демо
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Video Carousel — блок демо: готовая библиотека шаблонов */}
            <section id="demo" className="scroll-mt-20 pt-20 bg-slate-50">
              <div className="max-w-1140 mx-auto px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                    Сотни готовых шаблонов
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Выберите креатив и получите своё видео. Без съёмок, без монтажа.
                  </p>
                </div>
              </div>
              <VideoCarousel />
            </section>

            {/* Stats Section */}
            <section className="py-20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-blue-50/50" aria-hidden="true" />
              <div className="relative max-w-1140 mx-auto px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Цифры, которые говорят сами за себя</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="group bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Video className="w-7 h-7" />
                    </div>
                    <div className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">500+</div>
                    <p className="text-gray-600 font-medium">готовых сцен и шаблонов в каталоге</p>
                  </div>
                  <div className="group bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 text-center relative md:shadow-lg md:scale-105">
                    <span className="absolute top-4 right-4 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">Быстрее в 10×</span>
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Lightning className="w-7 h-7" />
                    </div>
                    <div className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">{'< 3 мин'}</div>
                    <p className="text-gray-600 font-medium">ваше видео будет готово меньше чем за 3 минуты</p>
                  </div>
                  <div className="group bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Checkmark className="w-7 h-7" />
                    </div>
                    <div className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">24/7</div>
                    <p className="text-gray-600 font-medium">без дедлайнов и очередей — генерируйте когда угодно</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3 Steps Section */}
            <section id="steps" className="py-24 bg-mesh-warm scroll-mt-20">
              <div className="max-w-1140 mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-heading2 text-gray-900 mb-4">
                    Реклама за 3 шага
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    От идеи до реалистичного видео — Veydo делает процесс простым, быстрым и невероятно реалистичным.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl hover:border-primary transition-all duration-300 transform hover:-translate-y-1 cursor-pointer shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-bold text-lg">1</span>
                    </div>
                    <h3 className="text-heading4 text-gray-900 mb-4">Добавьте Ваш Продукт</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Загрузите изображения продукта, добавьте описание и укажите целевую аудиторию. Наш AI идеально поймет ваш продукт.
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl hover:border-primary transition-all duration-300 transform hover:-translate-y-1 cursor-pointer shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-bold text-lg">2</span>
                    </div>
                    <h3 className="text-heading4 text-gray-900 mb-4">AI Генерирует Сценарий</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Превратите идеи в готовые к съемке рекламные ролики с помощью умного AI-письма. Получите хуки, видео-сценарий, подпись и CTA автоматически.
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl hover:border-primary transition-all duration-300 transform hover:-translate-y-1 cursor-pointer shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-bold text-lg">3</span>
                    </div>
                    <h3 className="text-heading4 text-gray-900 mb-4">Сгенерируйте Видео</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Воплотите все в жизнь с потрясающим, реалистичным UGC-видео за минуты. Готово для TikTok, Reels и Meta рекламы.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-gray-50 scroll-mt-20 bg-mesh">
              <div className="max-w-1140 mx-auto px-6 lg:px-8 relative">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-8">
                  <div className="max-w-2xl">
                    <h2 className="text-heading2 text-gray-900 mb-4">
                      Создавайте выигрышные креативы с мощными функциями
                    </h2>
                    <p className="text-xl text-gray-600">
                      Все, что нужно для создания рекламы, которая выглядит реально и действительно конвертирует.
                    </p>
                  </div>
                  <button
                    onClick={handlePrimaryCta}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-semibold text-lg hover:bg-primary-hover transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    Создать первое видео
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      title: 'Генератор AI Сценариев',
                      description: 'Мгновенно генерируйте высококонвертирующие рекламные сценарии, адаптированные под ваш продукт, с несколькими вариантами хуков.',
                      Icon: Sparkles
                    },
                    {
                      title: 'Интеграция Продукта',
                      description: 'Заставьте AI-аватаров естественно держать, носить или взаимодействовать с вашим продуктом в реалистичных видео.',
                      Icon: Package
                    },
                    {
                      title: 'Многоязычная Поддержка',
                      description: 'Достигайте глобальной аудитории с многоязычными озвучками и субтитрами на 35+ языках.',
                      Icon: Globe
                    },
                    {
                      title: 'Видео в Стиле UGC',
                      description: 'Создавайте аутентично выглядящие видео в стиле пользовательского контента, которые лучше работают на TikTok.',
                      Icon: Video
                    },
                    {
                      title: 'Быстрая Генерация',
                      description: 'Получите полный рекламный креатив с видео, сценарием и подписью менее чем за 3 минуты.',
                      Icon: Lightning
                    },
                    {
                      title: 'Готово к Использованию',
                      description: 'Скачивайте видео и сценарии мгновенно. Редактирование не требуется — готово для TikTok Ads Manager.',
                      Icon: Checkmark
                    }
                  ].map((feature, index) => {
                    const IconComponent = feature.Icon;
                    return (
                      <div
                        key={index}
                        className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-300 group cursor-pointer"
                      >
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-300">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Popular Features Section */}
            <section className="py-24 bg-mesh-rich">
              <div className="max-w-1140 mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-heading2 text-gray-900 mb-4">
                    Самые популярные функции
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Функции, которые помогают нашим клиентам создавать лучшие рекламные креативы
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: 'AI Сценарии', count: '95%', desc: 'используют', Icon: Sparkles },
                    { title: 'UGC Видео', count: '87%', desc: 'создают', Icon: Video },
                    { title: 'Мультиязычность', count: '72%', desc: 'применяют', Icon: Globe },
                    { title: 'Быстрая генерация', count: '98%', desc: 'довольны', Icon: Lightning },
                  ].map((item, index) => {
                    const IconComp = item.Icon;
                    return (
                      <div key={index} className="bg-white/90 backdrop-blur rounded-2xl p-6 border border-gray-200 text-center hover:bg-white hover:border-primary hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/15 text-primary mb-4 ring-2 ring-primary/20">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-2 transition-transform duration-300 hover:scale-110">{item.count}</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* AI vs Manual Section — визуально динамичнее, с иконками и эффектами */}
            <section id="why" className="py-24 bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 relative overflow-hidden scroll-mt-20">
              {/* Фоновая анимация блёклых иконок */}
              <div className="pointer-events-none absolute inset-0 select-none z-0">
                <svg className="absolute top-10 left-[-60px] w-36 h-36 opacity-10 animate-float-slow" fill="none" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="48" stroke="#0EA5E9" strokeWidth="2" />
                  <circle cx="30" cy="70" r="7" stroke="#0EA5E9" strokeWidth="2" />
                </svg>
                <svg className="absolute bottom-0 right-[-40px] w-32 h-32 opacity-10 animate-float-fast" fill="none" viewBox="0 0 100 100">
                  <rect x="10" y="10" width="80" height="80" rx="20" stroke="#64748B" strokeWidth="2" />
                </svg>
              </div>
              <div className="relative max-w-1140 mx-auto px-6 lg:px-8 z-10">
                <div className="text-center mb-16">
                  <h2 className="text-heading2 text-gray-900 mb-4">
                    Почему выбирают нас?
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Сравните традиционный ручной подход с возможностями генерации с помощью искусственного интеллекта
                  </p>
                </div>
                {(() => {
                  const iconClass = 'w-5 h-5 flex-shrink-0';
                  const icons = {
                    'Время': (
                      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    'Прайс': (
                      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    'Масштаб': (
                      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ),
                    'Итерации': (
                      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ),
                    'Языки': (
                      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                      </svg>
                    ),
                    'Запуск': (
                      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                  };
                  const rows = [
                    { criterion: 'Время', ai: 'Менее 3 минут на один креатив от идеи до готового видео', manual: 'Дни или недели: кастинг, съёмка, монтаж, согласования' },
                    { criterion: 'Прайс', ai: 'От $19/мес — десятки видео в рамках подписки, без скрытых платежей', manual: 'От $500–2000 за ролик + права, рекламные пакеты, доработки' },
                    { criterion: 'Масштаб', ai: 'Десятки вариантов в день: разные сценарии, хуки, форматы под тесты', manual: 'Обычно 1–3 варианта за цикл; больше — кратный рост бюджета' },
                    { criterion: 'Итерации', ai: 'Правки сценария и перегенерация за минуты, без доплат', manual: 'Любая правка — пересъёмка или долгий монтаж, часто за доплату' },
                    { criterion: 'Языки', ai: '35+ языков: сценарий, озвучка и субтитры из одного интерфейса', manual: 'Отдельный инфлюенсер или дубляж на каждый язык, дороже и дольше' },
                    { criterion: 'Запуск', ai: 'Старт сразу после регистрации, без договоров и поиска съёмочной команды', manual: 'Поиск инфлюенсера, брифа, контракт, дедлайны, логистика' },
                  ];
                  // Анимировать таблицы поочерёдно через delay на transition
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-6 items-stretch relative">
                      {/* Левая карточка — Veydo */}
                      <div className="group rounded-2xl border-2 border-primary bg-white shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/80">
                        <div className="py-4 px-5 border-b border-gray-100 bg-gradient-to-b from-blue-50 to-white">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">Veydo</h3>
                              <p className="text-xs font-medium text-gray-600">AI генерация</p>
                            </div>
                            <span className="ml-auto text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full">Рекомендуем</span>
                          </div>
                        </div>
                        {/* ТАБЛИЦА */}
                        <table className="w-full">
                          <tbody className="divide-y divide-gray-100">
                            {rows.map((row, index) => (
                              <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                                <td className="py-3 px-5 w-[130px] align-middle">
                                  <div className="flex items-center gap-2">
                                    <span className="text-primary">{icons[row.criterion]}</span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{row.criterion}</span>
                                  </div>
                                </td>
                                <td className="py-3 pr-5 pl-2 text-sm text-gray-800 leading-relaxed align-middle">
                                  {row.ai}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {/* небольшой акцент снизу */}
                        <div className="h-1 w-full bg-gradient-to-r from-primary/70 via-blue-300/40 to-blue-50/0"></div>
                      </div>
                      {/* Минималистичный разделитель */}
                      <div className="hidden lg:flex flex-col items-center justify-center">
                        <div className="w-px h-full relative bg-gradient-to-b from-blue-200/60 via-gray-200/80 to-gray-100/0" aria-hidden="true">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-blue-400 to-primary rounded-full w-7 h-7 opacity-70 animate-pulse shadow-lg border-2 border-white" />
                        </div>
                      </div>
                      {/* Правая карточка — Классическая съёмка */}
                      <div className="group rounded-2xl border-2 border-gray-200 bg-white shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300">
                        <div className="py-4 px-5 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-400 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">Классическая съёмка</h3>
                              <p className="text-xs font-medium text-gray-600">Традиционный способ</p>
                            </div>
                          </div>
                        </div>
                        {/* ТАБЛИЦА */}
                        <table className="w-full">
                          <tbody className="divide-y divide-gray-100">
                            {rows.map((row, index) => (
                              <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                                <td className="py-3 px-5 w-[130px] align-middle">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex text-gray-400">{icons[row.criterion]}</span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{row.criterion}</span>
                                  </div>
                                </td>
                                <td className="py-3 pr-5 pl-2 text-sm text-gray-700 leading-relaxed align-middle">
                                  {row.manual}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {/* акцент снизу */}
                        <div className="h-1 w-full bg-gradient-to-r from-gray-300 via-gray-50 to-transparent"></div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Анимации (вставить с tailwind.config) */}
              <style>{`
                @keyframes float-slow { 0%{transform:translateY(0);} 50%{transform:translateY(18px);} 100%{transform:translateY(0);} }
                @keyframes float-fast { 0%{transform:translateY(0);} 50%{transform:translateY(-12px);} 100%{transform:translateY(0);} }
                .animate-float-slow { animation: float-slow 9s ease-in-out infinite;}
                .animate-float-fast { animation: float-fast 5.5s ease-in-out infinite;}
                .animate-fade-in { opacity: 0; animation: fadeIn .7s .15s forwards; }
                .animate-fade-in-up { opacity: 0; transform: translateY(18px); animation: fadeInUp .7s .18s both; }
                @keyframes fadeIn { to { opacity: 1; } }
                @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
              `}</style>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-white scroll-mt-20">
              <div className="max-w-1140 mx-auto px-6 lg:px-8">
                <div className="text-center mb-14">
                  <h2 className="text-heading2 text-gray-900 mb-4">
                    Сколько это стоит?
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                    Подберите подходящий тариф и начните создавать рекламные ролики за считанные минуты.
                  </p>
                  <div className="inline-flex items-center gap-1 p-1.5 bg-gray-100 rounded-xl">
                    <button
                      onClick={() => setBillingPeriod('month')}
                      className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                        billingPeriod === 'month'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Месяц
                    </button>
                    <button
                      onClick={() => setBillingPeriod('year')}
                      className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                        billingPeriod === 'year'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Год
                      <span className="text-xs font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded">−20%</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  {[
                    {
                      name: 'Старт',
                      desc: 'Попробовать сервис и сделать первые креативы',
                      monthPrice: 19,
                      yearPrice: 15,
                      videos: 25,
                      popular: false
                    },
                    {
                      name: 'Профессионал',
                      desc: 'Для регулярной рекламы и большего объёма',
                      monthPrice: 49,
                      yearPrice: 39,
                      videos: 60,
                      popular: true
                    },
                    {
                      name: 'Бизнес',
                      desc: 'Для команд и высокого объёма генерации',
                      monthPrice: 119,
                      yearPrice: 95,
                      videos: 130,
                      popular: false
                    },
                  ].map((plan, index) => {
                    const price = billingPeriod === 'month' ? plan.monthPrice : plan.yearPrice;
                    const savings = billingPeriod === 'year' ? plan.monthPrice * 12 - plan.yearPrice * 12 : 0;
                    return (
                      <div
                        key={index}
                        className={`relative rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-xl ${
                          plan.popular
                            ? 'bg-primary text-white shadow-xl ring-4 ring-primary/20'
                            : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-white'
                        }`}
                      >
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-primary px-3 py-1 rounded-full text-xs font-bold shadow">
                              Чаще всего выбирают
                            </div>
                        )}
                        <div className="mb-6">
                          <h3 className={`text-xl font-bold mb-1 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                          <p className={`text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-500'}`}>{plan.desc}</p>
                        </div>
                        <div className="mb-6">
                          <span className={`text-4xl font-extrabold tracking-tight ${plan.popular ? 'text-white' : 'text-gray-900'}`}>${price}</span>
                          <span className={plan.popular ? 'text-blue-200' : 'text-gray-500'}>/{billingPeriod === 'month' ? 'мес' : 'мес'}</span>
                          {billingPeriod === 'year' && savings > 0 && (
                            <p className={`text-sm mt-1 ${plan.popular ? 'text-blue-100' : 'text-green-600'}`}>
                              Выгода ${savings} в год
                            </p>
                          )}
                        </div>
                        <p className={`text-sm font-semibold mb-4 ${plan.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                          {plan.videos ? `${plan.videos} видео в месяц` : 'Безлимит видео'}
                        </p>
                        <ul className="space-y-2.5 mb-8 text-sm">
                          {[
                            'Генерация видео',
                            'Готовые шаблоны',
                            'AI-сценарии и хуки',
                            'Качественное видео',
                            'Разные языки',
                            'Поддержка',
                          ].map((feature, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <Checkmark className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-blue-200' : 'text-green-500'}`} />
                              <span className={plan.popular ? 'text-blue-50' : 'text-gray-700'}>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        {api.isAuthenticated() ? (
                          <Link
                            to="/dashboard/billing"
                            className={`block w-full py-3 rounded-xl font-semibold text-center transition-all ${
                              plan.popular
                                ? 'bg-white text-primary hover:bg-blue-50 shadow'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}
                          >
                            Оформить подписку
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className={`w-full py-3 rounded-xl font-semibold transition-all ${
                              plan.popular
                                ? 'bg-white text-primary hover:bg-blue-50 shadow'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}
                          >
                            Попробовать
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-24 bg-gray-50 bg-mesh scroll-mt-20">
              <div className="max-w-3xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-heading2 text-gray-900 mb-4">
                    Часто задаваемые вопросы
                  </h2>
                  <p className="text-xl text-gray-600">
                    Все, что вам нужно знать о Veydo
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      question: 'Как быстро генерируется видео?',
                      answer: 'В среднем генерация одного видео занимает 2-3 минуты. Это включает создание сценария, генерацию видео и подготовку всех материалов для рекламы.'
                    },
                    {
                      question: 'Можно ли использовать видео для коммерческих целей?',
                      answer: 'Да, все видео, созданные через Veydo, можно использовать для коммерческих целей, включая рекламу в социальных сетях, на сайтах и в других маркетинговых каналах.'
                    },
                    {
                      question: 'Какие форматы видео поддерживаются?',
                      answer: 'Мы поддерживаем все популярные форматы для социальных сетей: вертикальные видео для TikTok и Instagram Reels (9:16), квадратные (1:1) и горизонтальные (16:9) для других платформ.'
                    },
                    {
                      question: 'Можно ли редактировать сгенерированные видео?',
                      answer: 'Да, вы можете скачать видео и редактировать их в любом видеоредакторе. Также мы предоставляем исходные материалы для более глубокой кастомизации.'
                    },
                    {
                      question: 'Есть ли ограничения по количеству продуктов?',
                      answer: 'Количество продуктов зависит от выбранного тарифа. В плане "Старт" можно создать до 5 продуктов, в "Профессионал" - до 50, а в "Бизнес" - без ограничений.'
                    },
                    {
                      question: 'Как работает AI генерация сценариев?',
                      answer: 'Наш AI анализирует описание вашего продукта, целевую аудиторию и рекламный угол, чтобы создать высококонвертирующие сценарии с несколькими вариантами хуков, которые привлекают внимание зрителей.'
                    },
                  ].map((faq, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-primary transition-all duration-300 hover:shadow-md"
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-all duration-300"
                      >
                        <span className="font-semibold text-gray-900 pr-8">{faq.question}</span>
                        <svg
                          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                            openFaq === index ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative bg-gradient-to-br from-primary via-blue-600 to-indigo-600 text-white overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10 pointer-events-none" aria-hidden="true" />
              <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
                <h2 className="text-heading2 text-white mb-6">
                  Готовы создать свое первое AI-видео?
                </h2>
                <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                  Присоединяйтесь к тысячам маркетологов, которые уже используют Veydo для создания эффективной рекламы
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handlePrimaryCta}
                    className="px-8 py-4 bg-white text-primary rounded-2xl font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                  >
                    Создать первое видео бесплатно
                  </button>
                  <button
                    onClick={scrollToDemo}
                    className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-200"
                  >
                    Посмотреть демо
                  </button>
                </div>
                <p className="mt-6 text-blue-100 text-sm">
                  Доступно всем • Просто, быстро и удобно • Попробуйте прямо сейчас
                </p>
              </div>
            </section>

        </>
      </main>

      {/* Footer — кратко о продукте + ссылки */}
      <footer className="bg-gray-900 text-gray-400 border-t border-gray-800 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden="true" />
        <div className="max-w-1140 mx-auto px-6 lg:px-8 py-8">
          <div className="flex justify-center mb-4">
            <a href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors" aria-label="Veydo — на главную">
              <Logo className="w-8 h-8" />
              <span className="text-lg font-bold tracking-tight">VEYDO</span>
            </a>
          </div>
          <p className="text-center text-sm text-gray-500 max-w-xl mx-auto mb-6">
            AI‑реклама нового поколения — запускай и смотри, как лиды летят к тебе! Вирально, мощно, именно то, что нужно для роста.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm">
            <span>© {new Date().getFullYear()} Veydo</span>
            <span className="hidden sm:inline text-gray-600">·</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">Политика конфиденциальности</Link>
            <span className="hidden sm:inline text-gray-600">·</span>
            <a href="mailto:hello@veydo.com" className="hover:text-primary transition-colors">hello@veydo.com</a>
            <span className="hidden sm:inline text-gray-600">·</span>
            <Link to="/terms" className="hover:text-primary transition-colors">Условия использования</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductPageWrapper() {
  const navigate = useNavigate();
  return <ProductPage onBack={() => navigate('/')} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/products/:id" element={<ProductPageWrapper />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
      </Routes>
    </Router>
  );
}

export default App;
