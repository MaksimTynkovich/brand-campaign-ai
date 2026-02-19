import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Sparkles from '../../assets/icons/Sparkles';

function CreditCardIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function TemplateIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function TagIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M3 11l8.586 8.586a2 2 0 002.828 0l6.586-6.586a2 2 0 000-2.828L12.414 3H7a4 4 0 00-4 4v4z" />
    </svg>
  );
}

function VideoIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const [billing, setBilling] = useState({ credits: 0, plan: 'trial' });

  useEffect(() => {
    if (!api.isAuthenticated()) return;
    api.getBillingFromApi().then(setBilling).catch(() => {});
  }, [location.pathname]);

  const user = api.getCurrentUser();
  const menuItems = [
    {
      title: 'Главная',
      icon: Sparkles,
      path: '/dashboard',
      exact: true,
    },
    {
      title: 'Мои видео',
      icon: VideoIcon,
      path: '/dashboard/my-videos',
    },
    {
      title: 'Тариф и оплата',
      icon: CreditCardIcon,
      path: '/dashboard/billing',
    },
    ...(user?.is_admin
      ? [
          {
            title: 'Категории шаблонов',
            icon: TagIcon,
            path: '/dashboard/template-categories',
          },
          {
            title: 'Шаблоны (админ)',
            icon: TemplateIcon,
            path: '/dashboard/templates',
          },
        ]
      : []),
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Overlay для мобильных */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 shadow-sm transform transition-transform duration-300 ease-in-out lg:static lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <svg viewBox="0 0 32 32" className="w-8 h-8">
                  <path
                    d="M8 4C5.8 4 4 5.8 4 8v12c0 2.2 1.8 4 4 4h4l6 6v-6h6c2.2 0 4-1.8 4-4V8c0-2.2-1.8-4-4-4H8z"
                    fill="#2588FF"
                  />
                  <circle cx="12" cy="14" r="2" fill="white" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">VEYDO</span>
            </Link>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-5 overflow-y-auto">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.path, item.exact);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border-l-2 ${
                      active
                        ? 'bg-primary/10 text-primary border-primary'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary' : 'text-gray-400'}`} />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Баланс и тариф */}
          <div className="p-3 pt-2 border-t border-gray-100">
            <Link
              to="/dashboard/billing"
              className="flex items-center justify-between gap-3 rounded-lg py-2.5 px-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">Кредиты</p>
                <p className="text-lg font-semibold text-gray-900 tabular-nums leading-tight">{billing.credits ?? 0}</p>
              </div>
              <span className="text-[11px] text-gray-500 capitalize shrink-0">{billing.plan ?? 'trial'}</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
