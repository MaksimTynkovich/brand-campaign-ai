import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Video from '../../assets/icons/Video';
import Package from '../../assets/icons/Package';
import Sparkles from '../../assets/icons/Sparkles';
import Lightning from '../../assets/icons/Lightning';
import Checkmark from '../../assets/icons/Checkmark';
import Globe from '../../assets/icons/Globe';

function CreditCardIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();

  const menuItems = [
    {
      title: 'Главная',
      icon: Sparkles,
      path: '/dashboard',
      exact: true,
    },
    {
      title: 'Создать ролик',
      icon: Video,
      path: '/dashboard/create',
      primary: true,
    },
    {
      title: 'Проекты',
      icon: Package,
      path: '/dashboard/projects',
    },
    {
      title: 'Креативы',
      icon: Checkmark,
      path: '/dashboard/creatives',
    },
    {
      title: 'Тариф и оплата',
      icon: CreditCardIcon,
      path: '/dashboard/billing',
    },
    {
      title: 'Настройки',
      icon: Globe,
      path: '/dashboard/settings',
    },
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
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
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
              <span className="text-xl font-bold text-gray-900 tracking-tight">ADPILOTSAI</span>
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
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.path, item.exact);

                if (item.primary) {
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block w-full"
                    >
                      <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        <IconComponent className="w-5 h-5" />
                        <span>{item.title}</span>
                      </button>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      active
                        ? 'bg-primary/10 text-primary border-l-4 border-primary'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 ${active ? 'text-primary' : 'text-gray-500'}`} />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {api.getCurrentUser()?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {api.getCurrentUser()?.name || 'Пользователь'}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {api.getCurrentUser()?.email || ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
