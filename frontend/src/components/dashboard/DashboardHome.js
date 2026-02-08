import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatsCards from './StatsCards';
import QuickActions from './QuickActions';
import RecentProjects from './RecentProjects';
import RecentCreatives from './RecentCreatives';

function DashboardHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentCreatives, setRecentCreatives] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Загружаем статистику
      try {
        const statsData = await api.getDashboardStats();
        setStats(statsData);
      } catch (err) {
        // Если endpoint не существует, используем mock данные
        setStats({
          total_projects: 0,
          total_creatives: 0,
          completed_creatives: 0,
          videos_this_month: 0,
        });
      }

      // Загружаем последние проекты
      try {
        const projectsData = await api.getProducts();
        const projects = projectsData.data || projectsData || [];
        setRecentProjects(projects.slice(0, 6));
      } catch (err) {
        setRecentProjects([]);
      }

      // Загружаем последние креативы
      try {
        const creativesData = await api.getCreatives();
        const creatives = creativesData.data || creativesData || [];
        setRecentCreatives(creatives.slice(0, 6));
      } catch (err) {
        setRecentCreatives([]);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Добро пожаловать, {api.getCurrentUser()?.name || 'Пользователь'}! 👋
        </h1>
        <p className="text-lg text-gray-600">
          Создавайте профессиональные AI-видео для рекламы за минуты
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Quick Actions */}
      <QuickActions onCreateNew={() => navigate('/dashboard/create')} />

      {/* Recent Projects & Creatives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RecentProjects 
          projects={recentProjects} 
          onViewAll={() => navigate('/dashboard/projects')}
          onSelectProject={(id) => navigate(`/dashboard/projects/${id}`)}
        />
        <RecentCreatives 
          creatives={recentCreatives}
          onViewAll={() => navigate('/dashboard/creatives')}
          onSelectCreative={(id) => navigate(`/dashboard/creatives/${id}`)}
        />
      </div>
    </div>
  );
}

export default DashboardHome;
