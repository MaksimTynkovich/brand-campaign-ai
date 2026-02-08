import React from 'react';
import Video from '../../assets/icons/Video';
import Package from '../../assets/icons/Package';
import Lightning from '../../assets/icons/Lightning';
import Checkmark from '../../assets/icons/Checkmark';

function StatsCards({ stats }) {
  const defaultStats = {
    total_projects: 0,
    total_creatives: 0,
    completed_creatives: 0,
    videos_this_month: 0,
  };

  const data = stats || defaultStats;

  const cards = [
    {
      title: 'Всего проектов',
      value: data.total_projects || 0,
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      bgGradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Всего креативов',
      value: data.total_creatives || 0,
      icon: Video,
      color: 'bg-purple-50 text-purple-600',
      bgGradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Готовых видео',
      value: data.completed_creatives || 0,
      icon: Checkmark,
      color: 'bg-green-50 text-green-600',
      bgGradient: 'from-green-500 to-green-600',
    },
    {
      title: 'За этот месяц',
      value: data.videos_this_month || 0,
      icon: Lightning,
      color: 'bg-orange-50 text-orange-600',
      bgGradient: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                <IconComponent className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{card.value}</div>
            <div className="text-sm text-gray-600">{card.title}</div>
          </div>
        );
      })}
    </div>
  );
}

export default StatsCards;
