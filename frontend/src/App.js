import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import ProductPage from './pages/ProductPage';
import VideoCarousel from './components/VideoCarousel';
import Sparkles from './assets/icons/Sparkles';
import Package from './assets/icons/Package';
import Globe from './assets/icons/Globe';
import Video from './assets/icons/Video';
import Lightning from './assets/icons/Lightning';
import Checkmark from './assets/icons/Checkmark';

function AppContent() {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const handleCreateNew = () => {
    setShowForm(true);
  };

  const handleFormSuccess = (product) => {
    setShowForm(false);
    navigate(`/products/${product.id}`);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  const handleSelectProduct = (product) => {
    navigate(`/products/${product.id}`);
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
              <a href="#login" className="hidden md:block text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Войти
              </a>
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
                  <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                    <div className="text-sm font-semibold text-primary mb-4">Шаг 1</div>
                    <h3 className="text-heading4 text-gray-900 mb-4">Добавьте Ваш Продукт</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Загрузите изображения продукта, добавьте описание и укажите целевую аудиторию. Наш AI идеально поймет ваш продукт.
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                    <div className="text-sm font-semibold text-primary mb-4">Шаг 2</div>
                    <h3 className="text-heading4 text-gray-900 mb-4">AI Генерирует Сценарий</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Превратите идеи в готовые к съемке рекламные ролики с помощью умного AI-письма. Получите хуки, видео-сценарий, подпись и CTA автоматически.
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
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
            <section className="py-24 bg-gray-50">
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

            {/* Products List Section */}
            <section className="py-24 bg-white">
              <div className="max-w-1140 mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-heading2 text-gray-900">Мои Продукты</h2>
                  <button
                    onClick={handleCreateNew}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    + Создать продукт
                  </button>
                </div>
                <ProductList
                  onSelectProduct={handleSelectProduct}
                  onCreateNew={handleCreateNew}
                />
              </div>
            </section>
          </>
        )}
      </main>
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
      </Routes>
    </Router>
  );
}

export default App;
