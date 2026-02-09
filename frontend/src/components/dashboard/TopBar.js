import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function TopBar({ onMenuClick }) {
  const navigate = useNavigate();
  const user = api.getCurrentUser();

  const handleLogout = () => {
    api.logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Menu Button & Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Поиск проектов, креативов..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right: User */}
        <div className="flex items-center gap-4">
          {/* User Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900">{user?.name || 'Пользователь'}</p>
                <p className="text-xs text-gray-600">{user?.email || ''}</p>
              </div>
              <svg className="w-4 h-4 text-gray-600 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="py-2">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'Пользователь'}</p>
                  <p className="text-xs text-gray-600 truncate">{user?.email || ''}</p>
                </div>
                <a
                  href="/dashboard/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Настройки аккаунта
                </a>
                <a
                  href="/"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Главная страница
                </a>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
