import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const PLAN_OPTIONS = [
  { value: 'trial', label: 'Триал' },
  { value: 'start', label: 'Старт' },
  { value: 'professional', label: 'Профессионал' },
  { value: 'business', label: 'Бизнес' },
];

function AdminUsers() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ plan: 'trial', credits: 0, is_blocked: false });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .getAdminUsers()
      .then(({ data }) => setList(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || 'Не удалось загрузить пользователей'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!api.getCurrentUser()?.is_admin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    load();
  }, [navigate]);

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      plan: user.plan ?? 'start',
      credits: user.credits ?? 0,
      is_blocked: user.is_blocked ?? false,
    });
  };

  const closeEdit = () => {
    setEditing(null);
  };

  const saveUser = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateAdminUser(editing.id, {
        plan: form.plan,
        credits: Math.max(0, parseInt(form.credits, 10) || 0),
        is_blocked: form.is_blocked,
      });
      closeEdit();
      load();
    } catch (err) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Управление тарифами, кредитами и блокировкой доступа к генерации видео
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-10 h-10 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Пользователей пока нет</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Тариф
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Кредиты
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="w-32 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{u.name || '—'}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                        {u.is_admin && (
                          <span className="inline-block mt-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            Админ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                      {PLAN_OPTIONS.find((o) => o.value === u.plan)?.label ?? u.plan}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium tabular-nums text-gray-900">{u.credits ?? 0}</td>
                    <td className="px-4 py-3">
                      {u.is_blocked ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                          Заблокирован
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="px-3 py-2 text-sm font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5"
                      >
                        Изменить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модальное окно редактирования */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeEdit}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-1">Редактировать пользователя</h2>
            <p className="text-sm text-gray-500 mb-4">{editing.email}</p>
            <form onSubmit={saveUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тариф</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {PLAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Кредиты</label>
                <input
                  type="number"
                  min={0}
                  value={form.credits}
                  onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_blocked"
                  checked={form.is_blocked}
                  onChange={(e) => setForm((f) => ({ ...f, is_blocked: e.target.checked }))}
                  className="rounded border-gray-300 text-red-600 focus:ring-primary"
                />
                <label htmlFor="is_blocked" className="text-sm font-medium text-gray-700">
                  Заблокировать доступ к генерации видео
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover disabled:opacity-60"
                >
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
