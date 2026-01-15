import React, { useState } from 'react';
import api from '../services/api';
import './ProductForm.css';

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
    <div className="product-form-container">
      <h2>Создать новый продукт</h2>
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label htmlFor="name">Название продукта *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Например: Умные часы Pro"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Описание продукта *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows="4"
            placeholder="Опишите ваш продукт..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="images">Изображения (1-3 шт) *</label>
          <input
            type="file"
            id="images"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            required
          />
          {images.length > 0 && (
            <div className="image-preview">
              {images.map((image, index) => (
                <div key={index} className="image-preview-item">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="remove-image-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="target_audience">Целевая аудитория</label>
          <input
            type="text"
            id="target_audience"
            name="target_audience"
            value={formData.target_audience}
            onChange={handleInputChange}
            placeholder="Например: Молодые профессионалы 25-35 лет"
          />
        </div>

        <div className="form-group">
          <label htmlFor="language">Язык</label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleInputChange}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="uk">Українська</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ad_angle">Рекламный угол</label>
          <input
            type="text"
            id="ad_angle"
            name="ad_angle"
            value={formData.ad_angle}
            onChange={handleInputChange}
            placeholder="Например: Решение проблемы, Преимущества, Эмоции"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={loading}
            >
              Отмена
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
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
