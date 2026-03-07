import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getStorageUrl } from '../../services/api';

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 120;
const READY_MARKER = '[[READY_TO_GENERATE]]';
const VIDEO_PROMPT_OPEN = '[[VIDEO_PROMPT]]';
const VIDEO_PROMPT_CLOSE = '[[/VIDEO_PROMPT]]';

function trimTitle(value) {
  if (!value) return 'Новый чат';
  return value.length > 58 ? `${value.slice(0, 58)}...` : value;
}

const QUICK_PROMPTS = [
  'Сделай 5 hook-ов для моего товара',
  'Напиши UGC-сценарий на 8 секунд',
  'Дай 3 разных рекламных угла для TikTok',
  'Проанализируй фото и предложи оффер',
  'Придумай сценарий в формате «до и после»',
  'Напиши сценарий для Reels с сильным CTA в конце',
  'Дай идеи для сторис с опросом про продукт',
  'Предложи 3 боли аудитории и оффер под каждую',
  'Сделай сценарий в стиле неформального отзыва',
  'Придумай заставку и концовку для рекламного ролика',
];

function DotTyping() {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:150ms]" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:300ms]" />
    </div>
  );
}

function renderInlineMarkdown(text) {
  const nodes = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={`${match.index}-b`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code key={`${match.index}-c`} className="px-1.5 py-0.5 rounded bg-black/5 text-[0.95em]">
          {token.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderRichMessage(text) {
  const cleanedText = String(text ?? '')
    .replace(READY_MARKER, '')
    .replace(/\[\[VIDEO_PROMPT\]\][\s\S]*?\[\[\/VIDEO_PROMPT\]\]/gi, '')
    .replace(/VEO3_PROMPT\s*:?\s*```[\s\S]*?```/gi, '')
    .replace(/VEO3_PROMPT\s*:.*/gi, '')
    .trim();
  const lines = cleanedText.split('\n');
  return lines.map((line, index) => {
    const trimmed = line.trim();
    const isBullet = /^[-*]\s+/.test(trimmed);
    const isNumbered = /^\d+[.)]\s+/.test(trimmed);

    if (isBullet) {
      return (
        <div key={`line-${index}`} className="flex items-start gap-2">
          <span className="mt-[2px]">•</span>
          <span>{renderInlineMarkdown(trimmed.replace(/^[-*]\s+/, ''))}</span>
        </div>
      );
    }

    if (isNumbered) {
      const marker = trimmed.match(/^\d+[.)]/)?.[0] ?? '';
      return (
        <div key={`line-${index}`} className="flex items-start gap-2">
          <span className="mt-[1px]">{marker}</span>
          <span>{renderInlineMarkdown(trimmed.replace(/^\d+[.)]\s+/, ''))}</span>
        </div>
      );
    }

    if (trimmed === '') {
      return <div key={`line-${index}`} className="h-2" />;
    }

    return (
      <div key={`line-${index}`}>
        {renderInlineMarkdown(line)}
      </div>
    );
  });
}

export default function AiAdChatPanel() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [generationState, setGenerationState] = useState({ status: 'idle', messageId: null, jobId: null, videoUrl: null, error: null });
  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );

  const isReadyAssistantMessage = (message) => {
    if (message?.role !== 'assistant') return false;
    const content = String(message.content || '');
    return content.includes(READY_MARKER) && content.includes(VIDEO_PROMPT_OPEN) && content.includes(VIDEO_PROMPT_CLOSE);
  };

  const loadSessions = async (preferredId = null) => {
    setLoadingSessions(true);
    try {
      const res = await api.getChatSessions();
      const list = Array.isArray(res.data) ? res.data : [];
      setSessions(list);

      if (preferredId) {
        setActiveSessionId(preferredId);
        return preferredId;
      }

      const nextId = list[0]?.id ?? null;
      setActiveSessionId((prev) => prev ?? nextId);
      return nextId;
    } catch (err) {
      setError(err.message || 'Не удалось загрузить историю чатов');
      return null;
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadMessages = async (sessionId) => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const res = await api.getChatSession(sessionId);
      const list = Array.isArray(res.messages) ? res.messages : [];
      setMessages(list);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить переписку');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    loadMessages(activeSessionId);
    setGenerationState({ status: 'idle', messageId: null, jobId: null, videoUrl: null, error: null });
  }, [activeSessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending, loadingMessages]);

  const imagePreviews = useMemo(
    () => imageFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [imageFiles]
  );

  useEffect(() => () => {
    imagePreviews.forEach((item) => URL.revokeObjectURL(item.url));
  }, [imagePreviews]);

  const onPickImages = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setImageFiles((prev) => [...prev, ...selected].slice(0, 3));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSend = async () => {
    const message = messageInput.trim();
    if (!message && imageFiles.length === 0) return;

    const optimisticMessageId = `temp-user-${Date.now()}`;
    const filesToSend = [...imageFiles];
    const optimisticAttachments = filesToSend.map((file, index) => ({
      path: `optimistic-${file.name}-${file.lastModified}-${index}`,
      url: URL.createObjectURL(file),
      _optimistic: true,
    }));
    setError(null);
    setSending(true);
    setMessageInput('');
    setImageFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMessages((prev) => ([
      ...prev,
      {
        id: optimisticMessageId,
        role: 'user',
        content: message,
        attachments: optimisticAttachments,
        created_at: new Date().toISOString(),
      },
    ]));

    try {
      const payload = await api.sendChatMessage({
        sessionId: activeSessionId,
        message,
        imageFiles: filesToSend,
      });
      const nextSession = payload.session;
      const userMessage = payload.user_message;
      const assistantMessage = payload.assistant_message;

      if (nextSession?.id) {
        setActiveSessionId(nextSession.id);
      }

      setMessages((prev) => {
        const withoutOptimistic = prev.filter((item) => item.id !== optimisticMessageId);

        if (activeSessionId && nextSession?.id === activeSessionId) {
          return [...withoutOptimistic, userMessage, assistantMessage].filter(Boolean);
        }
        return [...withoutOptimistic, userMessage, assistantMessage].filter(Boolean);
      });

      await loadSessions(nextSession?.id ?? activeSessionId);
    } catch (err) {
      setError(err.message || 'Не удалось отправить сообщение');
      // Возвращаем вложения в инпут, если отправка упала.
      setImageFiles(filesToSend);
    } finally {
      optimisticAttachments.forEach((attachment) => {
        if (attachment.url) URL.revokeObjectURL(attachment.url);
      });
      setSending(false);
    }
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const dropped = Array.from(event.dataTransfer?.files || []).filter((file) => file.type.startsWith('image/'));
    if (dropped.length === 0) return;
    setImageFiles((prev) => [...prev, ...dropped].slice(0, 3));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  const startGenerationFromMessage = async (messageId) => {
    if (!activeSessionId || !messageId) return;

    setError(null);
    setGenerationState({ status: 'starting', messageId, jobId: null, videoUrl: null, error: null });

    try {
      const res = await api.startGenerationFromChat(activeSessionId, messageId);
      const jobId = res.job_id;
      if (!jobId) throw new Error('Не удалось запустить генерацию');

      setGenerationState({ status: 'processing', messageId, jobId, videoUrl: null, error: null });

      let attempts = 0;
      const poll = async () => {
        if (attempts >= MAX_POLL_ATTEMPTS) {
          setGenerationState((prev) => ({ ...prev, status: 'failed', error: 'Превышено время ожидания' }));
          return;
        }

        const status = await api.getGenerationStatus(jobId);
        if (status.status === 'completed') {
          setGenerationState((prev) => ({
            ...prev,
            status: 'completed',
            videoUrl: status.video_url ? getStorageUrl(status.video_url) : null,
            error: null,
          }));
          return;
        }

        if (status.status === 'failed') {
          setGenerationState((prev) => ({ ...prev, status: 'failed', error: status.error_message || 'Генерация не удалась' }));
          return;
        }

        attempts += 1;
        window.setTimeout(poll, POLL_INTERVAL_MS);
      };

      await poll();
    } catch (err) {
      setGenerationState((prev) => ({ ...prev, status: 'failed', error: err.message || 'Ошибка запуска генерации' }));
      setError(err.message || 'Не удалось запустить генерацию');
    }
  };

  return (
    <section className="mb-10">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden ring-1 ring-black/[0.02]">
        <div className="border-b border-gray-100 px-4 py-3 sm:px-5 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-900 text-white text-sm font-semibold flex items-center justify-center">
              AI
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">AI-чат для создания рекламы</h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
          <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-gray-100 bg-gray-50/70">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-800">История</p>
              <button
                type="button"
                onClick={() => {
                  setActiveSessionId(null);
                  setMessages([]);
                }}
                className="text-xs px-2.5 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              >
                Новый чат
              </button>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loadingSessions ? (
                <p className="px-4 py-4 text-sm text-gray-500">Загрузка…</p>
              ) : sessions.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-500">Пока нет истории</p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-white ${
                      activeSessionId === session.id ? 'bg-white border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">{trimTitle(session.title)}</p>
                    {session.latest_message?.content && (
                      <p className="text-xs text-gray-600 mt-1">
                        {session.latest_message.content.length > 90
                          ? `${session.latest_message.content.slice(0, 90)}...`
                          : session.latest_message.content}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </aside>

          <div className="lg:col-span-8 flex flex-col">

            <div className="flex-1 p-4 sm:p-5 space-y-4 max-h-[600px] overflow-y-auto bg-[#f7f7f8]">
              {loadingMessages ? (
                <p className="text-sm text-gray-500">Загрузка переписки…</p>
              ) : messages.length === 0 ? (
                <div className="max-w-xl">
                  <p className="text-sm text-gray-600 mb-3">
                    Опиши продукт, цель рекламы и аудиторию. Можешь прикрепить до 3 фото — ИИ сразу их проанализирует.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setMessageInput(prompt)}
                        className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex items-start gap-3 ${message.role === 'assistant' ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${message.role === 'assistant' ? 'bg-gray-900 text-white' : 'bg-primary text-white'}`}>
                      {message.role === 'assistant' ? 'AI' : 'Вы'}
                    </div>
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 border shadow-[0_1px_0_rgba(0,0,0,0.03)] ${
                        message.role === 'assistant'
                          ? 'bg-white border-gray-200 text-gray-800'
                          : 'bg-primary text-white border-primary'
                      }`}
                    >
                      <div className="text-sm leading-relaxed space-y-1">
                        {renderRichMessage(message.content)}
                      </div>
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
                      {isReadyAssistantMessage(message) && (
                        <div className="mt-3 space-y-2">
                          {(() => {
                            const persistedVideoUrl = message.generation_video_url ? getStorageUrl(message.generation_video_url) : null;
                            const justCompletedUrl = generationState.status === 'completed' && generationState.messageId === message.id ? generationState.videoUrl : null;
                            const displayVideoUrl = justCompletedUrl || persistedVideoUrl;
                            const hasVideo = Boolean(displayVideoUrl);
                            return (
                              <>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startGenerationFromMessage(message.id)}
                                    disabled={generationState.status === 'starting' || generationState.status === 'processing'}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 text-white hover:opacity-90 disabled:opacity-60"
                                  >
                                    {hasVideo ? 'Сгенерировать еще раз' : 'Сгенерировать видео'}
                                  </button>
                                  {(generationState.status === 'starting' || generationState.status === 'processing') && generationState.messageId === message.id && (
                                    <span className="text-xs text-gray-500">Генерация запущена, ждем результат...</span>
                                  )}
                                  {generationState.status === 'failed' && generationState.messageId === message.id && (
                                    <span className="text-xs text-red-600">{generationState.error}</span>
                                  )}
                                </div>
                                {displayVideoUrl && (
                                  <div className="space-y-2">
                                    <video
                                      src={displayVideoUrl}
                                      controls
                                      className="w-full max-w-xs rounded-lg border border-gray-200 bg-black"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => navigate('/dashboard/my-videos')}
                                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 hover:bg-gray-50"
                                    >
                                      Открыть в "Мои видео"
                                    </button>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {sending && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 text-white text-xs font-semibold flex items-center justify-center">AI</div>
                  <div className="rounded-2xl px-4 py-3 border border-gray-200 bg-white">
                    <DotTyping />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div
              className={`border-t border-gray-100 p-4 sm:p-5 bg-white ${dragOver ? 'bg-primary/5' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {error && (
                <p className="mb-3 text-sm text-red-600">{error}</p>
              )}

              {imagePreviews.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {imagePreviews.map((item, index) => (
                    <div key={`${item.file.name}-${index}`} className="relative">
                      <img src={item.url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/80 text-white text-[11px] leading-none"
                        aria-label="Удалить фото"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-2xl border border-gray-300 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary overflow-hidden">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  placeholder="Напиши задачу для AI и получи видео-рекламу"
                  className="w-full px-3 py-2.5 text-sm outline-none resize-none"
                />
                <div className="px-3 py-2 border-t border-gray-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    + Фото
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onPickImages}
                  />
                  <span className="text-[11px] text-gray-500">{imageFiles.length}/3 фото</span>
                  <button
                    type="button"
                    onClick={onSend}
                    disabled={sending || (!messageInput.trim() && imageFiles.length === 0)}
                    className="ml-auto inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {sending ? 'Отправка…' : 'Отправить'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
