import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch (_) {
    return '—';
  }
}

function getSessionTitle(session) {
  if (session?.title && String(session.title).trim() !== '') return session.title;
  return `Чат #${session?.id ?? '—'}`;
}

function shorten(text, limit = 110) {
  if (!text) return '';
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function AdminChatSessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );

  const loadSessions = async () => {
    setLoadingSessions(true);
    setError(null);
    try {
      const res = await api.getAdminChatSessions();
      const list = Array.isArray(res.data) ? res.data : [];
      setSessions(list);
      setActiveSessionId((prev) => prev ?? list[0]?.id ?? null);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить чаты');
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSessionMessages = async (sessionId) => {
    if (!sessionId) {
      setActiveMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const res = await api.getAdminChatSession(sessionId);
      setActiveMessages(Array.isArray(res.messages) ? res.messages : []);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить переписку');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!api.getCurrentUser()?.is_admin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    loadSessions();
  }, [navigate]);

  useEffect(() => {
    loadSessionMessages(activeSessionId);
  }, [activeSessionId]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI-чаты пользователей</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Просмотр диалогов: кто общается с ИИ, что отправляет и какие ответы получает.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
          <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-gray-100">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Сессии</p>
              <button
                type="button"
                onClick={loadSessions}
                className="text-xs px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50"
              >
                Обновить
              </button>
            </div>
            <div className="max-h-[640px] overflow-y-auto">
              {loadingSessions ? (
                <p className="px-4 py-4 text-sm text-gray-500">Загрузка…</p>
              ) : sessions.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-500">Диалогов пока нет</p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${
                      activeSessionId === session.id ? 'bg-primary/5' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">{getSessionTitle(session)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {session.user?.email || 'Пользователь удален'} · {formatDate(session.last_message_at || session.created_at)}
                    </p>
                    {session.latest_message?.content && (
                      <p className="text-xs text-gray-600 mt-1">{shorten(session.latest_message.content, 95)}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="lg:col-span-8 flex flex-col">
            <div className="px-4 sm:px-5 py-3 border-b border-gray-100">
              {activeSession ? (
                <>
                  <p className="text-sm font-semibold text-gray-900">{getSessionTitle(activeSession)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {activeSession.user?.email || 'Пользователь удален'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Выбери чат слева</p>
              )}
            </div>

            <div className="flex-1 max-h-[640px] overflow-y-auto p-4 sm:p-5 bg-gray-50/40 space-y-3">
              {loadingMessages ? (
                <p className="text-sm text-gray-500">Загрузка переписки…</p>
              ) : activeMessages.length === 0 ? (
                <p className="text-sm text-gray-500">В выбранном чате пока нет сообщений</p>
              ) : (
                activeMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[92%] rounded-xl px-3.5 py-3 border ${
                      message.role === 'assistant'
                        ? 'bg-white border-gray-200 mr-auto'
                        : 'bg-primary text-white border-primary ml-auto'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-[11px] uppercase tracking-wide opacity-80">
                        {message.role === 'assistant' ? 'AI' : 'Пользователь'}
                      </p>
                      <p className="text-[11px] opacity-70">{formatDate(message.created_at)}</p>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {message.attachments.map((attachment) => (
                          <img
                            key={attachment.path || attachment.url}
                            src={attachment.url}
                            alt=""
                            className="w-full h-20 object-cover rounded-md border border-black/10"
                          />
                        ))}
                      </div>
                    )}
                    {message.meta?.source && (
                      <p className="text-[11px] opacity-70 mt-2">source: {message.meta.source}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminChatSessions;
