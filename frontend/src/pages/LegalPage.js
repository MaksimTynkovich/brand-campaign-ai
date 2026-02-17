import React from 'react';
import { Link } from 'react-router-dom';

const content = {
  privacy: {
    title: 'Политика конфиденциальности',
    updated: 'Обновлено: 2025 г.',
    body: (
      <>
        <p className="mb-4">
          Veydo соблюдает вашу конфиденциальность. Мы собираем только те данные, которые необходимы для работы сервиса: регистрация, использование продукта и оплата.
        </p>
        <p className="mb-4">
          Мы не передаём ваши персональные данные третьим лицам в маркетинговых целях. Данные хранятся на защищённых серверах и используются в соответствии с применимым законодательством.
        </p>
        <p>
          По вопросам персональных данных обращайтесь:{' '}
          <a href="mailto:hello@veydo.com" className="text-primary hover:underline">hello@veydo.com</a>.
        </p>
      </>
    ),
  },
  terms: {
    title: 'Условия использования',
    updated: 'Обновлено: 2025 г.',
    body: (
      <>
        <p className="mb-4">
          Используя Veydo, вы соглашаетесь с настоящими условиями. Сервис предоставляется «как есть» для создания рекламного контента с помощью искусственного интеллекта.
        </p>
        <p className="mb-4">
          Вы несёте ответственность за соблюдение прав третьих лиц при загрузке материалов и использовании сгенерированных видео в рекламе. Запрещается использовать сервис для создания незаконного или вводящего в заблуждение контента.
        </p>
        <p>
          Мы оставляем за собой право обновлять условия. Продолжение использования сервиса после изменений означает принятие новых условий.
        </p>
      </>
    ),
  },
};

function LegalPage({ type }) {
  const page = content[type];
  if (!page) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to="/" className="text-primary font-semibold hover:underline">
            ← На главную
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{page.title}</h1>
        <p className="text-gray-500 text-sm mb-8">{page.updated}</p>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-gray-700 leading-relaxed">
          {page.body}
        </div>
      </main>
    </div>
  );
}

export default LegalPage;
