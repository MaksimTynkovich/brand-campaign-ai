import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function AdminTemplateCategories() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSort, setNewSort] = useState('0');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [savingRowId, setSavingRowId] = useState(null);

  const sorted = useMemo(() => {
    return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.name).localeCompare(String(b.name)));
  }, [list]);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .getTemplateCategories()
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || 'Не удалось загрузить категории'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!api.getCurrentUser()?.is_admin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    load();
  }, [navigate]);

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await api.createTemplateCategory({ name: newName.trim(), sort_order: Number(newSort || 0) });
      setNewName('');
      setNewSort('0');
      load();
    } catch (err) {
      setError(err.message || 'Ошибка создания');
    } finally {
      setCreating(false);
    }
  };

  const updateRow = async (row) => {
    setSavingRowId(row.id);
    setError(null);
    try {
      await api.updateTemplateCategory(row.id, { name: row.name, sort_order: Number(row.sort_order ?? 0) });
      load();
    } catch (err) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setSavingRowId(null);
    }
  };

  const remove = async (id) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    setError(null);
    try {
      await api.deleteTemplateCategory(id);
      setDeleteConfirm(null);
      load();
    } catch (err) {
      setError(err.message || 'Ошибка удаления');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Категории шаблонов</h1>
          <p className="text-sm text-gray-500 mt-0.5">Создавайте категории, затем выбирайте их при создании шаблона</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/templates')}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
        >
          К шаблонам
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Новая категория</h2>
        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Например: Распаковка"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Порядок</label>
            <input
              type="number"
              min={0}
              value={newSort}
              onChange={(e) => setNewSort(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="md:col-span-1">
            <button
              type="submit"
              disabled={creating}
              className="w-full px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover disabled:opacity-60"
            >
              {creating ? 'Создание…' : 'Создать'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-10 h-10 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Категорий пока нет</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Название</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Порядок</th>
                  <th className="w-40 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        value={c.name ?? ''}
                        onChange={(e) =>
                          setList((prev) => prev.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))
                        }
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={c.sort_order ?? 0}
                        onChange={(e) =>
                          setList((prev) =>
                            prev.map((x) => (x.id === c.id ? { ...x, sort_order: Number(e.target.value) } : x))
                          )
                        }
                        className="w-28 border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateRow(c)}
                          disabled={savingRowId === c.id}
                          className="px-3 py-2 text-sm font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 disabled:opacity-60"
                        >
                          {savingRowId === c.id ? '…' : 'Сохранить'}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(c.id)}
                          className={`px-3 py-2 text-sm font-medium rounded-xl ${
                            deleteConfirm === c.id
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'text-red-600 border border-red-200 hover:bg-red-50'
                          }`}
                        >
                          {deleteConfirm === c.id ? 'Подтвердить' : 'Удалить'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminTemplateCategories;

