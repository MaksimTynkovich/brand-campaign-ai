import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import CreativeView from '../components/CreativeView';
import './ProductPage.css';

function ProductPage({ onBack }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [creatives, setCreatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await api.getProduct(id);
      setProduct(data);
      setCreatives(data.creatives || []);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки продукта');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!window.confirm('Начать генерацию креатива для этого продукта?')) {
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const result = await api.startGeneration(id);
      
      // Начинаем проверку статуса
      checkGenerationStatus(result.text_job_id, result.creative_id);
    } catch (err) {
      setError(err.message || 'Ошибка при запуске генерации');
      setGenerating(false);
    }
  };

  const checkGenerationStatus = async (jobId, creativeId) => {
    const maxAttempts = 60; // 2 минуты при проверке каждые 2 секунды
    let attempts = 0;

    const interval = setInterval(async () => {
      try {
        attempts++;
        const status = await api.getGenerationStatus(jobId);
        
        if (status.status === 'completed') {
          clearInterval(interval);
          setGenerating(false);
          loadProduct(); // Перезагружаем продукт с новым креативом
        } else if (status.status === 'failed') {
          clearInterval(interval);
          setGenerating(false);
          setError('Генерация завершилась с ошибкой');
          loadProduct();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setGenerating(false);
          setError('Превышено время ожидания');
          loadProduct();
        }
      } catch (err) {
        console.error('Status check error:', err);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setGenerating(false);
        }
      }
    }, 2000); // Проверяем каждые 2 секунды
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error && !product) {
    return (
      <div className="error-container">
        <div className="error">Ошибка: {error}</div>
        {onBack && <button onClick={onBack} className="btn btn-secondary">Назад</button>}
      </div>
    );
  }

  if (!product) {
    return <div className="loading">Продукт не найден</div>;
  }

  return (
    <div className="product-page">
      <div className="product-page-header">
        {onBack && (
          <button onClick={onBack} className="btn btn-secondary back-btn">
            ← Назад
          </button>
        )}
        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="product-description">{product.description}</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn btn-primary generate-btn"
        >
          {generating ? 'Генерация...' : '🎬 Сгенерировать креатив'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {product.images && product.images.length > 0 && (
        <div className="product-images-section">
          <h3>Изображения продукта:</h3>
          <div className="product-images">
            {product.images.map((image, index) => (
              <img
                key={index}
                src={`http://localhost:8000/storage/${image}`}
                alt={`${product.name} ${index + 1}`}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="creatives-section">
        <h2>Сгенерированные креативы ({creatives.length})</h2>
        {creatives.length === 0 ? (
          <div className="empty-creatives">
            <p>Пока нет сгенерированных креативов</p>
            <p className="hint">Нажмите "Сгенерировать креатив" чтобы начать</p>
          </div>
        ) : (
          <div className="creatives-list">
            {creatives.map((creative) => (
              <CreativeView key={creative.id} creative={creative} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductPage;
