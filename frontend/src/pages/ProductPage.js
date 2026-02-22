import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { API_ORIGIN } from '../services/api';
import CreativeView from '../components/CreativeView';
import Video from '../assets/icons/Video';

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center px-6">
          <div className="mb-6 p-5 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 font-medium">
            Ошибка: {error}
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Назад
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Продукт не найден</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 lg:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {onBack && (
              <button
                onClick={onBack}
                className="flex-shrink-0 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                ← Назад
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                {product.name}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-shrink-0 px-6 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Video className="w-5 h-5" />
              {generating ? 'Генерация...' : 'Сгенерировать креатив'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-5 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 font-medium">
            {error}
          </div>
        )}

        {product.images && product.images.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 lg:p-8 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Изображения продукта</h3>
            <div className="flex flex-wrap gap-6">
              {product.images.map((image, index) => (
                <img
                  key={index}
                  src={`${API_ORIGIN}/storage/${image}`}
                  alt={`${product.name} ${index + 1}`}
                  className="w-56 h-56 object-cover rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">
            Сгенерированные креативы ({creatives.length})
          </h2>
          {creatives.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 lg:p-16 text-center">
              <p className="text-lg text-gray-600 mb-2">Пока нет сгенерированных креативов</p>
              <p className="text-sm text-gray-500">Нажмите "Сгенерировать креатив" чтобы начать</p>
            </div>
          ) : (
            <div className="space-y-6">
              {creatives.map((creative) => (
                <CreativeView key={creative.id} creative={creative} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
