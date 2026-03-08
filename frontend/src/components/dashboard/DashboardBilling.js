import React, { useState } from 'react';
import Checkmark from '../../assets/icons/Checkmark';

const PLANS = [
  {
    name: 'Старт',
    desc: 'Попробовать сервис и сделать первые креативы',
    monthPrice: 999,
    yearPrice: 799, // −20% при оплате за год
    videos: 16,
    popular: false,
  },
  {
    name: 'Профессионал',
    desc: 'Для регулярной рекламы и большего объёма',
    monthPrice: 2999,
    yearPrice: 2399,
    videos: 42,
    popular: true,
  },
  {
    name: 'Бизнес',
    desc: 'Для команд и высокого объёма генерации',
    monthPrice: 8999,
    yearPrice: 7199,
    videos: 110,
    popular: false,
  },
];

function DashboardBilling() {
  const [billingPeriod, setBillingPeriod] = useState('month');

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Тариф и оплата
        </h1>
        <p className="text-lg text-gray-600">
          Оплата доступна любым удобным для вас способом — принимаем всё: карты, счёт, крипту и даже больше! Свяжитесь с нами, и мы подберём тариф и оперативно предоставим все необходимые реквизиты.
        </p>
      </div>

      <div id="billing-contact" className="max-w-2xl scroll-mt-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Связаться для оплаты</h2>
          <p className="text-gray-600 mb-6">
            Выберите удобный способ — ответим в течение рабочего дня. Укажите в сообщении желаемый тариф (Старт / Профессионал / Бизнес).
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:hello@veydo.cc?subject=Заявка на тариф Veydo"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </a>
            <a
              href="https://t.me/veydoHelp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0088cc]/10 text-[#0088cc] font-medium hover:bg-[#0088cc]/20 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Telegram
            </a>
          </div>
        </div>
      </div>

      {/* Карточки тарифов (как на главной) */}
      <div className="mb-14 mt-5">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-1 p-1.5 bg-gray-100 rounded-xl">
            <button
              type="button"
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
              type="button"
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
          {PLANS.map((plan, index) => {
            const price = billingPeriod === 'month' ? plan.monthPrice : plan.yearPrice;
            const savings = billingPeriod === 'year' ? plan.monthPrice * 12 - plan.yearPrice * 12 : 0;
            const mailtoSubject = `Заявка на тариф Veydo — ${plan.name}`;
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
                  <span className={`text-4xl font-extrabold tracking-tight ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{price.toLocaleString('ru-RU')} ₽</span>
                  <span className={plan.popular ? 'text-blue-200' : 'text-gray-500'}>/{billingPeriod === 'month' ? 'мес' : 'мес'}</span>
                  {billingPeriod === 'year' && savings > 0 && (
                    <p className={`text-sm mt-1 ${plan.popular ? 'text-blue-100' : 'text-green-600'}`}>
                      Выгода {savings.toLocaleString('ru-RU')} ₽ в год
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
                    'Без водяных знаков',
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
                <a
                  href={`mailto:hello@veydo.cc?subject=${encodeURIComponent(mailtoSubject)}`}
                  className={`block w-full py-3 rounded-xl font-semibold text-center transition-all ${
                    plan.popular
                      ? 'bg-white text-primary hover:bg-blue-50 shadow'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Выбрать тариф
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DashboardBilling;
