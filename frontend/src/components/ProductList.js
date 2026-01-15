import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './ProductList.css';

function ProductList({ onSelectProduct, onCreateNew }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data.data || data);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки продуктов');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Удалить этот продукт?')) return;

    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (err) {
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">Ошибка: {error}</div>;
  }

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <h2>Мои продукты</h2>
        <button onClick={onCreateNew} className="btn btn-primary">
          <span>+</span> Создать продукт
        </button>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>У вас пока нет продуктов</p>
          <button onClick={onCreateNew} className="btn btn-primary">
            Создать первый продукт
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => onSelectProduct(product)}
            >
              <div className="product-card-header">
                <h3>{product.name}</h3>
                <button
                  onClick={(e) => handleDelete(product.id, e)}
                  className="delete-btn"
                  title="Удалить"
                >
                  ×
                </button>
              </div>
              
              <p className="product-description">
                {product.description.length > 100
                  ? product.description.substring(0, 100) + '...'
                  : product.description}
              </p>

              {product.images && product.images.length > 0 && (
                <div className="product-images">
                  {product.images.slice(0, 3).map((image, index) => (
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
              )}

              <div className="product-meta">
                <span className="meta-item">Язык: {product.language}</span>
                {product.target_audience && (
                  <span className="meta-item">{product.target_audience}</span>
                )}
              </div>

              {product.creatives && product.creatives.length > 0 && (
                <div className="creatives-count">
                  Креативов: {product.creatives.length}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductList;
