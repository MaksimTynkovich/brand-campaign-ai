import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import DashboardHome from '../components/dashboard/DashboardHome';
import DashboardBilling from '../components/dashboard/DashboardBilling';
import MyVideos from '../components/dashboard/MyVideos';
import AdminTemplates from '../components/dashboard/AdminTemplates';
import AdminTemplateCategories from '../components/dashboard/AdminTemplateCategories';
import AdminUsers from '../components/dashboard/AdminUsers';
import AdminCarousel from '../components/dashboard/AdminCarousel';
import DashboardSettings from '../components/dashboard/DashboardSettings';
import AdminPromptSettings from '../components/dashboard/AdminPromptSettings';
import AdminChatSessions from '../components/dashboard/AdminChatSessions';

function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Проверяем авторизацию
    if (!api.isAuthenticated()) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0 min-w-0">
        {/* Top Bar */}
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content — лёгкий градиент для глубины */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white/60 to-gray-50/50">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="my-videos" element={<MyVideos />} />
            <Route path="billing" element={<DashboardBilling />} />
            <Route path="settings" element={<DashboardSettings />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="templates" element={<AdminTemplates />} />
            <Route path="template-categories" element={<AdminTemplateCategories />} />
            <Route path="carousel" element={<AdminCarousel />} />
            <Route path="prompt-settings" element={<AdminPromptSettings />} />
            <Route path="chat-sessions" element={<AdminChatSessions />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
