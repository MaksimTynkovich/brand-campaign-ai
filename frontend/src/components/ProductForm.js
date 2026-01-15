import React, { useState } from 'react';
import api from '../services/api';

function ProductForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_audience: '',
    language: 'ru',
    ad_angle: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      setError('Максимум 3 изображения');
      return;
    }
    setImages(files);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('target_audience', formData.target_audience);
      formDataToSend.append('language', formData.language);
      formDataToSend.append('ad_angle', formData.ad_angle);

      images.forEach((image) => {
        formDataToSend.append('images[]', image);
      });

      const product = await api.createProduct(formDataToSend);
      onSuccess(product);
    } catch (err) {
      setError(err.message || 'Ошибка при создании продукта');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-200">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Создать новый продукт</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
            Название продукта *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Например: Умные часы Pro"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
            Описание продукта *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows="4"
            placeholder="Опишите ваш продукт..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-y text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="images" className="block text-sm font-semibold text-gray-900 mb-2">
            Изображения (1-3 шт) *
          </label>
          <input
            type="file"
            id="images"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"
          />
          {images.length > 0 && (
            <div className="flex gap-4 mt-4 flex-wrap">
              {images.map((image, index) => (
                <div key={index} className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="target_audience" className="block text-sm font-semibold text-gray-900 mb-2">
            Целевая аудитория
          </label>
          <input
            type="text"
            id="target_audience"
            name="target_audience"
            value={formData.target_audience}
            onChange={handleInputChange}
            placeholder="Например: Молодые профессионалы 25-35 лет"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-semibold text-gray-900 mb-2">
            Язык
          </label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-gray-900 bg-white"
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="uk">Українська</option>
          </select>
        </div>

        <div>
          <label htmlFor="ad_angle" className="block text-sm font-semibold text-gray-900 mb-2">
            Рекламный угол
          </label>
          <input
            type="text"
            id="ad_angle"
            name="ad_angle"
            value={formData.ad_angle}
            onChange={handleInputChange}
            placeholder="Например: Решение проблемы, Преимущества, Эмоции"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-gray-900"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="flex gap-4 justify-end pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3 bg-gray-100 text-gray-900 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
              disabled={loading}
            >
              Отмена
            </button>
          )}
          <button
            type="submit"
            className="px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || images.length === 0}
          >
            {loading ? 'Создание...' : 'Создать продукт'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
