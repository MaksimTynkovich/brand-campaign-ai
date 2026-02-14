import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import ProductPage from './pages/ProductPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import VideoCarousel from './components/VideoCarousel';
import Sparkles from './assets/icons/Sparkles';
import Package from './assets/icons/Package';
import Globe from './assets/icons/Globe';
import Video from './assets/icons/Video';
import Lightning from './assets/icons/Lightning';
import Checkmark from './assets/icons/Checkmark';
import api from './services/api';

function AppContent() {
  const [billingPeriod, setBillingPeriod] = useState('month'); // 'month' or 'year'
  const [openFaq, setOpenFaq] = useState(null);
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
      navigate('/login');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-1140 mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <svg viewBox="0 0 32 32" className="w-8 h-8">
                  <path
                    d="M8 4C5.8 4 4 5.8 4 8v12c0 2.2 1.8 4 4 4h4l6 6v-6h6c2.2 0 4-1.8 4-4V8c0-2.2-1.8-4-4-4H8z"
                    fill="#2588FF"
                  />
                  <circle cx="12" cy="14" r="2" fill="white" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">ADPILOTSAI</span>
            </a>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#demo" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Демо
              </a>
              <div className="relative group">
                <a href="#features" className="flex items-center gap-1 text-gray-700 hover:text-gray-900 font-medium transition-colors">
                  Функции
                </a>
              </div>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Тарифы
              </a>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {api.isAuthenticated() ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all duration-200"
                >
                  Профиль
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
      </header>

      <main>
        <>
            {/* Hero Section */}
            <section className="relative pt-24 pb-8 overflow-hidden">
              <div className="max-w-1140 mx-auto px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                  <h1 className="text-heading1 text-gray-900 mb-6">
                    Создавайте рекламу <br className="hidden md:block" />
                    <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      через AI
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Генерируйте реалистичные видео в стиле инфлюенсеров, где AI-аватары держат и рассказывают о ваших продуктах. Готово для TikTok, Reels и Meta рекламы менее чем за 3 минуты.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={handlePrimaryCta}
                      className="px-8 py-4 bg-primary text-white rounded-2xl font-semibold text-lg hover:bg-primary-hover transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                    >
                      Создать первое видео
                    </button>
                    <button className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-2xl font-semibold text-lg hover:border-gray-300 transition-all duration-200 flex items-center gap-2">
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

            {/* Video Carousel */}
            <VideoCarousel />

            {/* Stats Section */}
            <section className="py-16 bg-white border-y border-gray-100">
              <div className="max-w-1140 mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">10k+</div>
                    <div className="text-gray-600">Активных пользователей</div>
                  </div>
                  <div className="text-center border-x border-gray-200 px-8">
                    <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">2.5мин</div>
                    <div className="text-gray-600">Среднее время генерации</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">$1M+</div>
                    <div className="text-gray-600">Сгенерировано с AI UGC</div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3 Steps Section */}
            <section className="py-24 bg-white">
              <div className="max-w-1140 mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-heading2 text-gray-900 mb-4">
                    Реклама за 3 шага
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    От идеи до реалистичного видео — adPilotsAI делает процесс простым, быстрым и невероятно реалистичным.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl hover:border-primary transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                    <div className="text-sm font-semibold text-primary mb-4">Шаг 1</div>
                    <h3 className="text-heading4 text-gray-900 mb-4">Добавьте Ваш Продукт</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Загрузите изображения продукта, добавьте описание и укажите целевую аудиторию. Наш AI идеально поймет ваш продукт.
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl hover:border-primary transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                    <div className="text-sm font-semibold text-primary mb-4">Шаг 2</div>
                    <h3 className="text-heading4 text-gray-900 mb-4">AI Генерирует Сценарий</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Превратите идеи в готовые к съемке рекламные ролики с помощью умного AI-письма. Получите хуки, видео-сценарий, подпись и CTA автоматически.
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl hover:border-primary transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                    <div className="text-sm font-semibold text-primary mb-4">Шаг 3</div>
                    <h3 className="text-heading4 text-gray-900 mb-4">Сгенерируйте Видео</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Воплотите все в жизнь с потрясающим, реалистичным UGC-видео за минуты. Готово для TikTok, Reels и Meta рекламы.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-gray-50 scroll-mt-20">
              <div className="max-w-1140 mx-auto px-6 lg:px-8">
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
            <section className="py-24 bg-white">
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
                    { title: 'AI Сценарии', count: '95%', desc: 'используют' },
                    { title: 'UGC Видео', count: '87%', desc: 'создают' },
                    { title: 'Мультиязычность', count: '72%', desc: 'применяют' },
                    { title: 'Быстрая генерация', count: '98%', desc: 'довольны' },
                  ].map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-2xl p-6 border border-gray-200 text-center hover:bg-white hover:border-primary hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                      <div className="text-4xl font-bold text-primary mb-2 transition-transform duration-300 hover:scale-110">{item.count}</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* AI vs Manual Section — две отдельные таблицы, визуально доработаны */}
            <section className="py-24 bg-gray-50">
              <div className="max-w-1140 mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-heading2 text-gray-900 mb-4">
                    Почему выбирают AI вместо ручной работы
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Сравните традиционный ручной подход с возможностями генерации с помощью искусственного интеллекта
                  </p>
                </div>
                {(() => {
                  const rows = [
                    { criterion: 'Время', ai: 'Менее 3 минут на один креатив от идеи до готового видео', manual: 'Дни или недели: кастинг, съёмка, монтаж, согласования' },
                    { criterion: 'Прайс', ai: 'От $29/мес — десятки видео в рамках подписки, без скрытых платежей', manual: 'От $500–2000 за ролик + права, рекламные пакеты, доработки' },
                    { criterion: 'Масштаб', ai: 'Десятки вариантов в день: разные сценарии, хуки, форматы под тесты', manual: 'Обычно 1–3 варианта за цикл; больше — кратный рост бюджета' },
                    { criterion: 'Итерации', ai: 'Правки сценария и перегенерация за минуты, без доплат', manual: 'Любая правка — пересъёмка или долгий монтаж, часто за доплату' },
                    { criterion: 'Языки', ai: '35+ языков: сценарий, озвучка и субтитры из одного интерфейса', manual: 'Отдельный инфлюенсер или дубляж на каждый язык, дороже и дольше' },
                    { criterion: 'Запуск', ai: 'Старт сразу после регистрации, без договоров и поиска съёмочной команды', manual: 'Поиск инфлюенсера, брифа, контракт, дедлайны, логистика' },
                  ];
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-6 items-stretch">
                      {/* Левая карточка — adPilotsAI (в тонах сайта: primary) */}
                      <div className="group rounded-2xl border-2 border-primary bg-white shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="py-5 px-6 border-b border-gray-100 bg-gradient-to-b from-blue-50 to-white">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">Veydo</h3>
                              <p className="text-sm font-medium text-gray-600">Искусственный интеллект</p>
                            </div>
                            <span className="ml-auto text-xs font-semibold text-primary bg-blue-50 px-2.5 py-1 rounded-full">Рекомендуем</span>
                          </div>
                        </div>
                        <table className="w-full">
                          <tbody className="divide-y divide-gray-100">
                            {rows.map((row, index) => (
                              <tr key={index} className="transition-colors hover:bg-blue-50/50">
                                <td className="py-3.5 pl-6 pr-4 text-sm font-bold text-gray-500 uppercase tracking-wider w-[130px] align-top pt-4">
                                  {row.criterion}
                                </td>
                                <td className="py-3.5 pr-6 pl-0 text-[15px] font-medium text-gray-900 leading-relaxed pt-4">
                                  {row.ai}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Минималистичный разделитель между карточками — только на десктопе */}
                      <div className="hidden lg:block w-px flex-shrink-0 bg-gray-200 self-stretch" aria-hidden="true" />
                      {/* Правая карточка — Классическая съёмка (в тонах сайта: серые) */}
                      <div className="group rounded-2xl border-2 border-gray-200 bg-white shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300 hover:-translate-y-1">
                        <div className="py-5 px-6 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-400 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">Классическая съёмка</h3>
                              <p className="text-sm font-medium text-gray-600">Традиционный способ</p>
                            </div>
                          </div>
                        </div>
                        <table className="w-full">
                          <tbody className="divide-y divide-gray-100">
                            {rows.map((row, index) => (
                              <tr key={index} className="transition-colors hover:bg-gray-50/80">
                                <td className="py-3.5 pl-6 pr-4 text-sm font-bold text-gray-500 uppercase tracking-wider w-[130px] align-top pt-4">
                                  {row.criterion}
                                </td>
                                <td className="py-3.5 pr-6 pl-0 text-[15px] font-medium text-gray-700 leading-relaxed pt-4">
                                  {row.manual}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-white scroll-mt-20">
              <div className="max-w-1140 mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-heading2 text-gray-900 mb-4">
                    Тарифы
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                    Выберите план, который подходит именно вам
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setBillingPeriod('month')}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                        billingPeriod === 'month'
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Месяц
                    </button>
                    <button
                      onClick={() => setBillingPeriod('year')}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                        billingPeriod === 'year'
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Год
                      <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded">-20%</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      name: 'Старт',
                      monthPrice: 29,
                      yearPrice: 23,
                      features: [
                        '10 видео в месяц',
                        'Базовые шаблоны',
                        '1 язык',
                        'Поддержка по email',
                      ],
                      popular: false
                    },
                    {
                      name: 'Профессионал',
                      monthPrice: 99,
                      yearPrice: 79,
                      features: [
                        '100 видео в месяц',
                        'Все шаблоны',
                        '35+ языков',
                        'Приоритетная поддержка',
                        'API доступ',
                      ],
                      popular: true
                    },
                    {
                      name: 'Бизнес',
                      monthPrice: 299,
                      yearPrice: 239,
                      features: [
                        'Безлимит видео',
                        'Все функции',
                        'Все языки',
                        'Персональный менеджер',
                        'API доступ',
                        'Кастомные интеграции',
                      ],
                      popular: false
                    },
                  ].map((plan, index) => {
                    const price = billingPeriod === 'month' ? plan.monthPrice : plan.yearPrice;
                    return (
                      <div
                        key={index}
                        className={`bg-white rounded-2xl p-8 border-2 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl ${
                          plan.popular
                            ? 'border-primary shadow-xl scale-105'
                            : 'border-gray-200 hover:border-primary'
                        } relative`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                            Популярный
                          </div>
                        )}
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                        <div className="mb-6">
                          <span className="text-4xl font-bold text-gray-900">${price}</span>
                          <span className="text-gray-600">/{billingPeriod === 'month' ? 'мес' : 'год'}</span>
                        </div>
                        <ul className="space-y-4 mb-8">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <Checkmark className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        {api.isAuthenticated() ? (
                          <Link
                            to="/dashboard/billing"
                            className={`block w-full py-3 rounded-xl font-semibold transition-all text-center ${
                              plan.popular
                                ? 'bg-primary text-white hover:bg-primary-hover shadow-lg hover:shadow-xl'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                          >
                            Оплатить
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className={`w-full py-3 rounded-xl font-semibold transition-all ${
                              plan.popular
                                ? 'bg-primary text-white hover:bg-primary-hover shadow-lg hover:shadow-xl'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                          >
                            Войти для оплаты
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 bg-gray-50">
              <div className="max-w-3xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-heading2 text-gray-900 mb-4">
                    Часто задаваемые вопросы
                  </h2>
                  <p className="text-xl text-gray-600">
                    Все, что вам нужно знать о adPilotsAI
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
                      answer: 'Да, все видео, созданные через adPilotsAI, можно использовать для коммерческих целей, включая рекламу в социальных сетях, на сайтах и в других маркетинговых каналах.'
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
            <section className="py-24 bg-gradient-to-br from-primary to-blue-600 text-white">
              <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
                <h2 className="text-heading2 text-white mb-6">
                  Готовы создать свое первое AI-видео?
                </h2>
                <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                  Присоединяйтесь к тысячам маркетологов, которые уже используют adPilotsAI для создания эффективной рекламы
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handlePrimaryCta}
                    className="px-8 py-4 bg-white text-primary rounded-2xl font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                  >
                    Создать первое видео бесплатно
                  </button>
                  <button className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-200">
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
      <footer className="bg-gray-900 text-gray-400 border-t border-gray-800">
        <div className="max-w-1140 mx-auto px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-500 max-w-xl mx-auto mb-6">
            AI‑реклама нового поколения — запускай и смотри, как лиды летят к тебе! Вирально, мощно, именно то, что нужно для роста.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm">
            <span>© {new Date().getFullYear()} adPilotsAI</span>
            <span className="hidden sm:inline text-gray-600">·</span>
            <a href="#" className="hover:text-primary transition-colors">Политика конфиденциальности</a>
            <span className="hidden sm:inline text-gray-600">·</span>
            <a href="mailto:hello@adpilotsai.com" className="hover:text-primary transition-colors">hello@adpilotsai.com</a>
            <span className="hidden sm:inline text-gray-600">·</span>
            <a href="#" className="hover:text-primary transition-colors">Условия использования</a>
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
      </Routes>
    </Router>
  );
}

export default App;
