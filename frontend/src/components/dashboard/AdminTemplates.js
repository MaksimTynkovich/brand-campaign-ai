import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getStorageUrl } from '../../services/api';

const defaultForm = {
  category: '',
  original_prompt: '',
  default_voiceover: '',
  sort_order: '',
  example_video: null,
  reference_images: [],
  existingExampleVideoUrl: null,
};

function FileDrop({ label, hint, accept, multiple, value, onChange, currentUrl, currentLabel }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Локальные превью для новых файлов (из File / File[])
  useEffect(() => {
    // очищаем старые URL
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    const next = [];
    if (multiple) {
      if (Array.isArray(value)) {
        value.forEach((file) => {
          if (file instanceof File) {
            next.push(URL.createObjectURL(file));
          }
        });
      }
    } else if (value instanceof File) {
      next.push(URL.createObjectURL(value));
    }
    setPreviewUrls(next);

    return () => {
      next.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, multiple]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const files = e.dataTransfer?.files;
    if (!files?.length) return;
    if (multiple) {
      const incoming = Array.from(files);
      const existing = Array.isArray(value) ? value : [];
      onChange([...existing, ...incoming]);
    } else {
      onChange(files[0]);
    }
  };

  const handleChange = (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    if (multiple) {
      const incoming = Array.from(files);
      const existing = Array.isArray(value) ? value : [];
      onChange([...existing, ...incoming]);
    } else {
      onChange(files[0]);
    }
  };

  const clear = () => {
    onChange(multiple ? [] : null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const hasNew = multiple ? value?.length : value;
  const hasCurrent = currentUrl && !hasNew;

  return (
    <div className="space-y-1">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-2xl p-4 text-center cursor-pointer border-2 border-dashed transition-all duration-200 ${
          drag
            ? 'border-primary bg-primary/5 shadow-sm'
            : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50/80'
        }`}
      >
        {hasNew && !multiple && (
          <div className="flex flex-col items-center gap-2 mb-2">
            {/* Превью для одиночного файла */}
            {previewUrls[0] && accept.includes('video') && (
              <video
                src={previewUrls[0]}
                className="w-full max-h-40 rounded-lg border border-gray-200 object-cover"
                controls
                muted
              />
            )}
            {previewUrls[0] && accept.startsWith('image') && (
              <img
                src={previewUrls[0]}
                alt=""
                className="w-full max-h-40 rounded-lg object-cover border border-gray-200"
              />
            )}
            <div className="flex items-center justify-between gap-2 w-full">
              <span className="text-sm text-gray-700 truncate">
                {value?.name}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clear(); }}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Убрать
              </button>
            </div>
          </div>
        )}
        {hasNew && multiple && (
          <div className="flex flex-col gap-2 mb-2">
            {accept.startsWith('image') && previewUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {previewUrls.map((url, i) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="w-16 h-16 rounded-md object-cover border border-gray-200"
                  />
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 justify-center">
              {Array.isArray(value) && value.map((f, i) => (
                <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {f.name}
                </span>
              ))}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clear(); }}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Очистить
              </button>
            </div>
          </div>
        )}
        {hasCurrent && accept.startsWith('image') && (
          <div className="mb-2 flex flex-col items-center gap-2">
            <img
              src={getStorageUrl(currentUrl)}
              alt=""
              className="mx-auto max-h-24 rounded-lg object-cover border border-gray-200"
            />
            <p className="text-xs text-gray-500">
              {currentLabel || 'Текущее превью. Нажмите, чтобы заменить.'}
            </p>
          </div>
        )}
        {hasCurrent && accept.includes('video') && (
          <p className="text-sm text-gray-600 mb-2">
            {currentLabel || 'Видео загружено. Нажмите, чтобы заменить.'}
          </p>
        )}
        {!hasNew && !hasCurrent && (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-400">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 16V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M12 5V15M12 5L8.5 8.5M12 5L15.5 8.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Перетащите файл</span>
              <span className="text-gray-400"> или нажмите, чтобы выбрать</span>
            </div>
            <p className="text-xs text-gray-400">
              {accept.startsWith('image') ? 'Поддерживаются JPG, PNG, WEBP' : 'MP4, WebM или MOV'}
            </p>
          </div>
        )}
      </div>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function AdminTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadTemplates = () => {
    setLoading(true);
    api
      .getTemplates()
      .then((res) => {
        setTemplates(Array.isArray(res.data) ? res.data : []);
        const cats = res.meta?.categories;
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!api.getCurrentUser()?.is_admin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    loadTemplates();
  }, [navigate]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm });
    setModalOpen(true);
    setError(null);
  };

  const openEdit = async (t) => {
    setModalOpen(true);
    setError(null);
    setEditingId(t.id);
    try {
      const full = await api.getTemplate(t.id);
      setForm({
        category: full.category ?? '',
        original_prompt: full.original_prompt ?? '',
        default_voiceover: full.default_voiceover ?? '',
        sort_order: full.sort_order ?? '',
        example_video: null,
        reference_images: [],
        existingExampleVideoUrl: full.example_video_url ?? full.example_video_path ?? null,
      });
    } catch (e) {
      setError(e.message);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...defaultForm });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      category: form.category || undefined,
      original_prompt: form.original_prompt,
      default_voiceover: form.default_voiceover || undefined,
      sort_order: form.sort_order === '' ? undefined : Number(form.sort_order),
      example_video: form.example_video instanceof File ? form.example_video : undefined,
      reference_images: Array.isArray(form.reference_images) && form.reference_images.length ? form.reference_images : undefined,
    };
    try {
      if (editingId) {
        await api.updateTemplate(editingId, payload);
      } else {
        await api.createTemplate(payload);
      }
      loadTemplates();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    try {
      await api.deleteTemplate(id);
      loadTemplates();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Шаблоны</h1>
          <p className="text-sm text-gray-500 mt-0.5">Создание и редактирование шаблонов для генерации видео</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить шаблон
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between gap-4">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="w-10 h-10 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600 font-medium mb-1">Нет шаблонов</p>
          <p className="text-sm text-gray-500 mb-4">Добавьте первый шаблон, чтобы пользователи могли создавать по нему видео.</p>
          <button type="button" onClick={openCreate} className="text-primary font-medium hover:underline">
            Добавить шаблон
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Превью</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Категория</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Порядок</th>
                  <th className="w-40 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {templates.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      {t.preview_url ? (
                        <img src={getStorageUrl(t.preview_url)} alt="" className="w-14 h-20 object-cover rounded-lg border border-gray-100" />
                      ) : (
                        <div className="w-14 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">—</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.category ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 tabular-nums">{t.sort_order}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            deleteConfirm === t.id
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'text-red-600 border border-red-200 hover:bg-red-50'
                          }`}
                        >
                          {deleteConfirm === t.id ? 'Подтвердить' : 'Удалить'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Редактировать шаблон' : 'Новый шаблон'}
              </h2>
              <button type="button" onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Закрыть">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-8">
                {/* Основные данные */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Основные данные</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                      >
                        <option value="">Без категории</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Категории создаются отдельно в разделе «Категории шаблонов».
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Порядок сортировки</label>
                      <input
                        type="number"
                        min={0}
                        value={form.sort_order}
                        onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Меньше — выше в списке</p>
                    </div>
                  </div>
                </section>

                {/* Медиа */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Медиафайлы</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <FileDrop
                        label="Пример видео"
                        hint="MP4, WebM или MOV. При редактировании пусто = не менять."
                        accept="video/mp4,video/webm,video/quicktime"
                        value={form.example_video}
                        onChange={(v) => setForm((f) => ({ ...f, example_video: v }))}
                        currentUrl={form.existingExampleVideoUrl}
                        currentLabel={form.existingExampleVideoUrl ? 'Видео загружено' : null}
                      />
                    </div>
                    <div>
                      <FileDrop
                        label="Референсы (макс. 2)"
                        hint="1-е фото — начальный кадр, 2-е — фото продукта."
                        accept="image/*"
                        multiple
                        value={form.reference_images}
                        onChange={(v) => setForm((f) => ({ ...f, reference_images: (v && Array.isArray(v) ? v.slice(0, 2) : []) }))}
                      />
                    </div>
                  </div>
                </section>

                {/* Текст для AI */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Текст для генерации (AI)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Промпт для генерации видео <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={form.original_prompt}
                        onChange={(e) => setForm((f) => ({ ...f, original_prompt: e.target.value }))}
                        rows={5}
                        required
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
                        placeholder="Опишите сцену и действия для AI-видео…"
                      />
                      <p className="text-xs text-gray-500 mt-1">Обязательное поле. Сливается с текстом пользователя при генерации.</p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/50 shrink-0">
                <button type="button" onClick={closeModal} className="px-4 py-2.5 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium">
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Сохранение…
                    </>
                  ) : editingId ? (
                    'Сохранить'
                  ) : (
                    'Создать шаблон'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTemplates;
