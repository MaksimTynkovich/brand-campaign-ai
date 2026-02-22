import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <p className="text-6xl font-bold text-gray-300 mb-2">404</p>
      <p className="text-lg text-gray-600 mb-8">Страница не найдена</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors"
      >
        На главную
      </Link>
    </div>
  );
}

export default NotFoundPage;
