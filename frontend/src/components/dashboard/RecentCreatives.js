import React from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ORIGIN } from '../../services/api';
import Video from '../../assets/icons/Video';
import Checkmark from '../../assets/icons/Checkmark';
import Lightning from '../../assets/icons/Lightning';

function RecentCreatives({ creatives, onViewAll, onSelectCreative }) {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Ожидание', classes: 'bg-yellow-100 text-yellow-800', icon: null },
      processing: { text: 'Обработка', classes: 'bg-blue-100 text-blue-800', icon: Lightning },
      completed: { text: 'Готово', classes: 'bg-green-100 text-green-800', icon: Checkmark },
      failed: { text: 'Ошибка', classes: 'bg-red-100 text-red-800', icon: null },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    const IconComponent = statusInfo.icon;
    return (
      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${statusInfo.classes}`}>
        {IconComponent && <IconComponent className="w-3 h-3" />}
        {statusInfo.text}
      </span>
    );
  };

  if (!creatives || creatives.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Последние креативы</h2>
        </div>
        <div className="text-center py-8">
          <Video className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Пока нет созданных креативов</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Последние креативы</h2>
        <button
          onClick={onViewAll}
          className="text-primary hover:text-primary-hover font-medium transition-colors text-sm"
        >
          Все →
        </button>
      </div>
      <div className="space-y-3">
        {creatives.slice(0, 5).map((creative) => (
          <div
            key={creative.id}
            onClick={() => onSelectCreative(creative.id)}
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-300 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {creative.video_path ? (
                <video
                  src={`${API_ORIGIN}/storage/${creative.video_path}`}
                  className="w-full h-full object-cover rounded-lg"
                  muted
                />
              ) : (
                <Video className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors text-sm">
                  Креатив #{creative.id}
                </h3>
                {getStatusBadge(creative.status)}
              </div>
              {creative.video_script && (
                <p className="text-xs text-gray-600 line-clamp-1">
                  {creative.video_script.substring(0, 60)}...
                </p>
              )}
            </div>
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentCreatives;
