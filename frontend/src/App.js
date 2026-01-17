import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import ProductForm from './components/ProductForm';
import ProductPage from './pages/ProductPage';
import AuthPage from './pages/AuthPage';
import VideoCarousel from './components/VideoCarousel';
import Sparkles from './assets/icons/Sparkles';
import Package from './assets/icons/Package';
import Globe from './assets/icons/Globe';
import Video from './assets/icons/Video';
import Lightning from './assets/icons/Lightning';
import Checkmark from './assets/icons/Checkmark';
import api from './services/api';

function AppContent() {
  const [showForm, setShowForm] = useState(false);
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

  const handleCreateNew = () => {
    // Проверяем авторизацию
    if (!api.isAuthenticated()) {
      navigate('/login');
      return;
    }
    setShowForm(true);
  };

  const handleFormSuccess = (product) => {
    setShowForm(false);
    navigate(`/products/${product.id}`);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
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
                <button className="flex items-center gap-1 text-gray-700 hover:text-gray-900 font-medium transition-colors">
                  Функции
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Тарифы
              </a>
              <a href="#blog" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Блог
              </a>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {api.isAuthenticated() ? (
                <>
                  <span className="hidden md:block text-gray-700 font-medium">
                    {api.getCurrentUser()?.name || 'Пользователь'}
                  </span>
                  <button
                    onClick={() => {
                      api.logout();
                      window.location.reload();
                    }}
                    className="hidden md:block text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <a href="/login" className="hidden md:block text-gray-700 hover:text-gray-900 font-medium transition-colors">
                  Войти
                </a>
              )}
              {!showForm && (
                <button
                  onClick={handleCreateNew}
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
        {showForm ? (
          <div className="py-12 bg-gray-50">
            <ProductForm
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        ) : (
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
                      onClick={handleCreateNew}
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
                      Все, что нужно для создания рекламы TikTok, которая выглядит реально и действительно конвертирует.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateNew}
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

            {/* Testimonials Section */}
            <section className="py-24 bg-gray-50">
              <div className="max-w-1140 mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-heading2 text-gray-900 mb-4">
                    Отзывы наших клиентов
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Узнайте, что говорят о нас маркетологи и создатели контента
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      name: 'Анна Петрова',
                      role: 'Маркетолог, E-commerce',
                      text: 'adPilotsAI изменил наш подход к рекламе. Теперь мы создаем десятки креативов за минуты вместо дней. ROAS вырос на 40%!',
                      rating: 5
                    },
                    {
                      name: 'Дмитрий Соколов',
                      role: 'Основатель стартапа',
                      text: 'Невероятно реалистичные видео! Наши клиенты не могут отличить AI-контент от настоящего. Экономия бюджета колоссальная.',
                      rating: 5
                    },
                    {
                      name: 'Мария Иванова',
                      role: 'SMM-менеджер',
                      text: 'Простота использования поражает. Даже без опыта в видеомонтаже я создаю профессиональные ролики. Рекомендую всем!',
                      rating: 5
                    },
                  ].map((testimonial, index) => (
                    <div key={index} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-xl hover:border-primary transition-all duration-300 transform hover:-translate-y-2">
                      <div className="flex mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.text}"</p>
                      <div>
                        <div className="font-semibold text-gray-900">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
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
                        <button
                          onClick={handleCreateNew}
                          className={`w-full py-3 rounded-xl font-semibold transition-all ${
                            plan.popular
                              ? 'bg-primary text-white hover:bg-primary-hover shadow-lg hover:shadow-xl'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          Начать
                        </button>
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
                    onClick={handleCreateNew}
                    className="px-8 py-4 bg-white text-primary rounded-2xl font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                  >
                    Создать первое видео бесплатно
                  </button>
                  <button className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-200">
                    Посмотреть демо
                  </button>
                </div>
                <p className="mt-6 text-blue-100 text-sm">
                  Без кредитной карты • Начните за 2 минуты • Отмена в любой момент
                </p>
              </div>
            </section>

          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-1140 mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-8 h-8">
                  <svg viewBox="0 0 32 32" className="w-8 h-8">
                    <path
                      d="M8 4C5.8 4 4 5.8 4 8v12c0 2.2 1.8 4 4 4h4l6 6v-6h6c2.2 0 4-1.8 4-4V8c0-2.2-1.8-4-4-4H8z"
                      fill="#2588FF"
                    />
                    <circle cx="12" cy="14" r="2" fill="white" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white tracking-tight">ADPILOTSAI</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Создавайте реалистичные AI-видео для рекламы за минуты. Профессиональные креативы без съемок.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Продукт</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="hover:text-primary transition-colors duration-300">Функции</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors duration-300">Тарифы</a></li>
                <li><a href="#demo" className="hover:text-primary transition-colors duration-300">Демо</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-300">API</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-300">Интеграции</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Компания</h3>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-primary transition-colors duration-300">О нас</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-300">Блог</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-300">Карьера</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-300">Партнеры</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-300">Пресса</a></li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Поддержка</h3>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-primary transition-colors duration-300">Помощь</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-300">Документация</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-300">Контакты</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-300">Статус</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-300">Безопасность</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} adPilotsAI. Все права защищены.
              </p>
              <div className="flex gap-6 text-sm">
                <a href="#" className="hover:text-primary transition-colors duration-300">Политика конфиденциальности</a>
                <a href="#" className="hover:text-primary transition-colors duration-300">Условия использования</a>
                <a href="#" className="hover:text-primary transition-colors duration-300">Cookie</a>
              </div>
            </div>
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
      </Routes>
    </Router>
  );
}

export default App;
