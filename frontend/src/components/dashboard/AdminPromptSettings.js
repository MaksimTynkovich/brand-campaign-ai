import React, { useEffect, useState } from 'react';
import api from '../../services/api';

function AdminPromptSettings() {
  const [visionPrompt, setVisionPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getAdminPromptSettings()
      .then((res) => {
        if (cancelled) return;
        setVisionPrompt(res.vision_system_prompt ?? '');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Не удалось загрузить настройки промптов');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await api.updateAdminPromptSettings(visionPrompt);
      setVisionPrompt(res.vision_system_prompt ?? visionPrompt);
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Не удалось сохранить настройки промптов');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI промпты</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Глобальный системный промпт для GPT при мерже шаблонного промпта, пожеланий пользователя и фото продукта.
          Здесь можно тонко настраивать поведение AI без правок кода.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
          {loading ? (
            <p className="text-gray-500 text-sm">Загрузка текущих настроек…</p>
          ) : (
            <>
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    System prompt для vision-мержа
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Используется для всех генераций с фото продукта
                  </span>
                </div>
                <textarea
                  className="w-full h-72 text-sm font-mono bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-vertical"
                  value={visionPrompt}
                  onChange={(e) => setVisionPrompt(e.target.value)}
                  spellCheck={false}
                />
              </label>

              {error && (
                <p className="text-sm text-red-600">
                  {error}
                </p>
              )}
              {saved && !error && (
                <p className="text-sm text-emerald-600">
                  Настройки сохранены. Новые генерации будут использовать обновлённый промпт.
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPromptSettings;

