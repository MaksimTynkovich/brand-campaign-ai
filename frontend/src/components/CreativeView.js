import React, { useState } from 'react';
import api from '../services/api';
import './CreativeView.css';

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
      pending: { text: 'Ожидание', class: 'status-pending' },
      processing: { text: 'Обработка', class: 'status-processing' },
      completed: { text: 'Готово', class: 'status-completed' },
      failed: { text: 'Ошибка', class: 'status-failed' },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  return (
    <div className="creative-view">
      <div className="creative-header">
        <h3>Креатив #{creative.id}</h3>
        {getStatusBadge(creative.status)}
      </div>

      {creative.status === 'completed' && (
        <>
          {creative.hooks && creative.hooks.length > 0 && (
            <div className="creative-section">
              <h4>Hook варианты:</h4>
              <ul className="hooks-list">
                {creative.hooks.map((hook, index) => (
                  <li key={index}>{hook}</li>
                ))}
              </ul>
            </div>
          )}

          {creative.video_script && (
            <div className="creative-section">
              <h4>Видео-сценарий:</h4>
              <div className="script-content">{creative.video_script}</div>
            </div>
          )}

          {creative.caption && (
            <div className="creative-section">
              <h4>Caption:</h4>
              <div className="caption-content">{creative.caption}</div>
            </div>
          )}

          {creative.cta && (
            <div className="creative-section">
              <h4>CTA:</h4>
              <div className="cta-content">{creative.cta}</div>
            </div>
          )}

          {creative.video_path && (
            <div className="creative-section">
              <h4>Видео:</h4>
              <video
                controls
                className="creative-video"
                src={`http://localhost:8000/storage/${creative.video_path}`}
              >
                Ваш браузер не поддерживает видео.
              </video>
            </div>
          )}

          <div className="creative-actions">
            {creative.video_path && (
              <button
                onClick={handleDownloadVideo}
                disabled={downloading.video}
                className="btn btn-primary"
              >
                {downloading.video ? 'Скачивание...' : '📥 Скачать видео'}
              </button>
            )}
            <button
              onClick={handleDownloadScript}
              disabled={downloading.script}
              className="btn btn-secondary"
            >
              {downloading.script ? 'Скачивание...' : '📄 Скачать сценарий'}
            </button>
          </div>
        </>
      )}

      {creative.status === 'processing' && (
        <div className="processing-message">
          <div className="spinner"></div>
          <p>Генерация креатива...</p>
        </div>
      )}

      {creative.status === 'failed' && creative.error_message && (
        <div className="error-message">
          <strong>Ошибка:</strong> {creative.error_message}
        </div>
      )}
    </div>
  );
}

export default CreativeView;
