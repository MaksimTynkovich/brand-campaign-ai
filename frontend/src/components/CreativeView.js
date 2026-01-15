import React, { useState } from 'react';
import api from '../services/api';
import Download from '../assets/icons/Download';
import Document from '../assets/icons/Document';

function CreativeView({ creative, product }) {
  const [downloading, setDownloading] = useState({ video: false, script: false });

  const handleDownloadVideo = async () => {
    try {
      setDownloading(prev => ({ ...prev, video: true }));
      await api.downloadVideo(creative.id);
    } catch (error) {
      alert('Ошибка при скачивании видео: ' + error.message);
    } finally {
      setDownloading(prev => ({ ...prev, video: false }));
    }
  };

  const handleDownloadScript = async () => {
    try {
      setDownloading(prev => ({ ...prev, script: true }));
      await api.downloadScript(creative.id);
    } catch (error) {
      alert('Ошибка при скачивании сценария: ' + error.message);
    } finally {
      setDownloading(prev => ({ ...prev, script: false }));
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Ожидание', classes: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      processing: { text: 'Обработка', classes: 'bg-blue-100 text-blue-800 border-blue-300' },
      completed: { text: 'Готово', classes: 'bg-green-100 text-green-800 border-green-300' },
      failed: { text: 'Ошибка', classes: 'bg-red-100 text-red-800 border-red-300' },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <span className={`px-5 py-2 rounded-full text-sm font-semibold border ${statusInfo.classes}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 lg:p-8 mb-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b-2 border-gray-200">
        <h3 className="text-2xl font-semibold text-gray-900">Креатив #{creative.id}</h3>
        {getStatusBadge(creative.status)}
      </div>

      {creative.status === 'completed' && (
        <>
          {creative.hooks && creative.hooks.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-5">Варианты хуков:</h4>
              <ul className="space-y-3">
                {creative.hooks.map((hook, index) => (
                  <li
                    key={index}
                    className="p-4 bg-gray-50 border-l-4 border-primary rounded-lg font-medium hover:bg-gray-100 hover:translate-x-1 transition-all duration-200"
                  >
                    {hook}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {creative.video_script && (
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-5">Видео-сценарий:</h4>
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed">
                {creative.video_script}
              </div>
            </div>
          )}

          {creative.caption && (
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-5">Подпись:</h4>
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed">
                {creative.caption}
              </div>
            </div>
          )}

          {creative.cta && (
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-5">Призыв к действию:</h4>
              <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-primary text-lg font-semibold text-primary">
                {creative.cta}
              </div>
            </div>
          )}

          {creative.video_path && (
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-5">Видео:</h4>
              <video
                controls
                className="w-full max-w-md rounded-xl bg-black shadow-lg border-2 border-gray-200"
                src={`http://localhost:8000/storage/${creative.video_path}`}
              >
                Ваш браузер не поддерживает видео.
              </video>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t-2 border-gray-200">
            {creative.video_path && (
              <button
                onClick={handleDownloadVideo}
                disabled={downloading.video}
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                {downloading.video ? 'Скачивание...' : 'Скачать видео'}
              </button>
            )}
            <button
              onClick={handleDownloadScript}
              disabled={downloading.script}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Document className="w-5 h-5" />
              {downloading.script ? 'Скачивание...' : 'Скачать сценарий'}
            </button>
          </div>
        </>
      )}

      {creative.status === 'processing' && (
        <div className="text-center py-12 text-gray-600">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Генерация креатива...</p>
        </div>
      )}

      {creative.status === 'failed' && creative.error_message && (
        <div className="p-5 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 font-medium">
          <strong>Ошибка:</strong> {creative.error_message}
        </div>
      )}
    </div>
  );
}

export default CreativeView;
