import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Sparkles from '../../assets/icons/Sparkles';
import Logo from '../../assets/Logo';

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

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

function SettingsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

function CarouselIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
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
            title: 'Пользователи',
            icon: UsersIcon,
            path: '/dashboard/users',
          },
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
          {
            title: 'Карусель на главной',
            icon: CarouselIcon,
            path: '/dashboard/carousel',
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
            <Link to="/" className="flex items-center gap-3">
              <Logo className="w-8 h-8" ariaLabel="Veydo — на главную" />
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
