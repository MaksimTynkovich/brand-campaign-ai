import React from 'react';
import { useNavigate } from 'react-router-dom';
import Package from '../../assets/icons/Package';

function RecentProjects({ projects, onViewAll, onSelectProject }) {
  const navigate = useNavigate();

  if (!projects || projects.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Последние проекты</h2>
        </div>
        <div className="text-center py-8">
          <Package className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4 text-sm">У вас пока нет проектов</p>
          <button
            onClick={() => navigate('/dashboard/create')}
            className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
          >
            Создать первый проект
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Последние проекты</h2>
        <button
          onClick={onViewAll}
          className="text-primary hover:text-primary-hover font-medium transition-colors text-sm"
        >
          Все →
        </button>
      </div>
      <div className="space-y-3">
        {projects.slice(0, 5).map((project) => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-300 cursor-pointer group"
          >
            {project.images && project.images.length > 0 ? (
              <img
                src={typeof project.images[0] === 'string' && project.images[0].startsWith('http') 
                  ? project.images[0] 
                  : `http://localhost:8000/storage/${project.images[0]}`}
                alt={project.name}
                className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div
              className={`w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 ${project.images && project.images.length > 0 ? 'hidden' : ''}`}
            >
              <Package className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors truncate text-sm">
                {project.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {project.creatives && project.creatives.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {project.creatives.length} креатив{project.creatives.length === 1 ? '' : project.creatives.length < 5 ? 'а' : 'ов'}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(project.created_at || Date.now()).toLocaleDateString('ru-RU')}
                </span>
              </div>
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

export default RecentProjects;
