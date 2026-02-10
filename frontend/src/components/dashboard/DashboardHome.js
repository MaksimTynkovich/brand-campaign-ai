import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function DashboardHome() {
  const navigate = useNavigate();
  const user = api.getCurrentUser();
  const categories = [
    'Новые',
    'Распаковка',
    'Виральный хук',
    'POV',
    'ASMR',
    'UGC-обзор',
    'Визуальные эффекты',
  ];
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [promptText, setPromptText] = useState(
    'Сделайте короткий вертикальный ролик, где герой показывает продукт крупным планом, рассказывает о ключевом преимуществе и в конце даёт понятный призыв к действию.'
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Добро пожаловать, {user?.name || 'Пользователь'}!
        </h1>
        <p className="text-lg text-gray-600">
          Выберите готовый шаблон и запустите свой первый AI-ролик за пару минут.
        </p>
      </div>

      {/* Templates section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">Шаблоны для быстрого старта</h2>
        </div>

        {/* Categories pills */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex items-center gap-2 sm:gap-3 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm border transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
                }`}
              >
                {cat === 'Виральный хук' ? 'Виральный хук 🔥' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveTemplate(i)}
              className="group rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-primary transition-all duration-200"
            >
              <div className="relative aspect-[9/16] bg-gradient-to-br from-gray-800 via-gray-900 to-gray-700">
                <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.3),_transparent_60%)]" />
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-white/70">
                    Шаблон #{i}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-white line-clamp-2">
                    Заглушка для будущего шаблона
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Модалка настройки шаблона — светлая, минималистичная */}
      {activeTemplate !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 max-w-5xl w-full mx-4">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-200">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                  Шаблон #{activeTemplate} · {activeCategory}
                </p>
                <h3 className="text-lg font-semibold">
                  Параметры ролика
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTemplate(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <span className="sr-only">Закрыть</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* Левая колонка: превью заглушки */}
              <div className="lg:w-2/5 border-b lg:border-b-0 lg:border-r border-gray-200 p-4 flex flex-col gap-3">
                <div className="rounded-2xl overflow-hidden bg-gray-900 aspect-[9/16] max-h-[360px] mx-auto w-full">
                  <div className="w-full h-full bg-gradient-to-br from-primary/60 via-gray-900 to-blue-500/80 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-black/40 flex items-center justify-center border border-white/10">
                      <svg
                        className="w-9 h-9 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Превью формата 9:16. Позже здесь будет кадр из ролика.
                </p>
              </div>

              {/* Правая колонка: простые поля */}
              <div className="lg:w-3/5 p-4 sm:p-6 flex flex-col gap-4">
                {/* Слот для изображений */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      Изображения продукта
                    </h4>
                    <span className="text-[11px] text-gray-400">
                      До 4 фото, по желанию
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className="aspect-square rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-[11px] text-gray-500 hover:border-primary hover:text-primary transition-colors"
                      >
                        <span className="text-lg mb-1">+</span>
                        Фото
                      </button>
                    ))}
                  </div>
                </div>

                {/* Промпт */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      Описание для AI
                    </h4>
                    <span className="text-[11px] text-gray-400">
                      Можно переписать под свой продукт
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <textarea
                      value={promptText}
                      onChange={(e) =>
                        setPromptText(e.target.value.slice(0, 5000))
                      }
                      rows={6}
                      className="w-full h-40 sm:h-44 lg:h-48 bg-white border border-gray-300 rounded-2xl px-3 sm:px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    />
                    <div className="mt-1 text-[11px] text-gray-400 text-right">
                      {promptText.length} / 5000
                    </div>
                  </div>
                </div>

                {/* Нижняя панель */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-[11px] text-gray-400">
                    Формат: 15 сек · вертикальное видео 9:16
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTemplate(null)}
                      className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                    >
                      Отменить
                    </button>
                    <button
                      type="button"
                      disabled
                      className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-primary text-white opacity-70 cursor-not-allowed"
                    >
                      Сгенерировать (скоро)
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

export default DashboardHome;
