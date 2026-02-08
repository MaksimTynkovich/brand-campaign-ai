import React from 'react';
import { useNavigate } from 'react-router-dom';
import Video from '../../assets/icons/Video';
import Package from '../../assets/icons/Package';
import Sparkles from '../../assets/icons/Sparkles';

function QuickActions({ onCreateNew }) {
  const navigate = useNavigate();
  
  const actions = [
    {
      title: 'Создать новый ролик',
      description: 'Начните создание AI-видео для вашего продукта',
      icon: Video,
      onClick: onCreateNew,
      primary: true,
    },
    {
      title: 'Мои проекты',
      description: 'Просмотр и управление всеми проектами',
      icon: Package,
      onClick: () => navigate('/dashboard/projects'),
      primary: false,
    },
    {
      title: 'Библиотека креативов',
      description: 'Все созданные видео в одном месте',
      icon: Sparkles,
      onClick: () => navigate('/dashboard/creatives'),
      primary: false,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Быстрые действия</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`p-5 rounded-xl border-2 transition-all duration-300 transform hover:-translate-y-1 text-left ${
                action.primary
                  ? 'border-primary bg-gradient-to-br from-primary/5 to-blue-50 hover:shadow-xl'
                  : 'border-gray-200 hover:border-primary hover:shadow-lg'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                action.primary ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuickActions;
