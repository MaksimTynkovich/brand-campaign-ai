import React, { useState } from 'react';
import api from '../../services/api';

function SettingsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function DashboardSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPassword !== newPasswordConfirm) {
      setError('Новый пароль и подтверждение не совпадают');
      return;
    }
    if (newPassword.length < 6) {
      setError('Новый пароль должен быть не менее 6 символов');
      return;
    }
    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err) {
      setError(err.message || 'Не удалось изменить пароль');
    } finally {
      setLoading(false);
    }
  };

  const user = api.getCurrentUser();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Настройки аккаунта</h1>
        <p className="text-gray-500">
          Измените пароль и контактные данные для связи с поддержкой.
        </p>
      </div>

      <div className="max-w-xl space-y-8">
        {/* Смена пароля */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Сменить пароль</h2>
              <p className="text-sm text-gray-500">Введите текущий пароль и новый пароль</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Текущий пароль
              </label>
              <input
                type="password"
                id="current_password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Новый пароль
              </label>
              <input
                type="password"
                id="new_password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">Не менее 6 символов</p>
            </div>
            <div>
              <label htmlFor="new_password_confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                Подтвердите новый пароль
              </label>
              <input
                type="password"
                id="new_password_confirm"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
                Пароль успешно изменён.
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Сохранение…' : 'Сохранить пароль'}
            </button>
          </form>
        </section>

        {/* Контакты поддержки */}
        <section className="bg-gray-50 rounded-2xl border border-gray-200 p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">По всем вопросам</h2>
          <p className="text-gray-600 mb-4">
            Если у вас возникли вопросы по аккаунту, тарифам или работе сервиса — напишите нам на почту или в Telegram. Мы ответим в течение рабочего дня.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:hello@veydo.com?subject=Вопрос по аккаунту Veydo"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              hello@veydo.com
            </a>
            <a
              href="https://t.me/veydoHelp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0088cc]/10 text-[#0088cc] font-medium hover:bg-[#0088cc]/20 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Telegram
            </a>
          </div>
          {user?.email && (
            <p className="mt-4 text-sm text-gray-500">
              Ваш аккаунт: <span className="font-medium text-gray-700">{user.email}</span>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default DashboardSettings;
