import React, { useState, useEffect } from 'react';
import api, { API_ORIGIN } from '../services/api';
import Sparkles from '../assets/icons/Sparkles';

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
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-red-50 rounded-2xl border-2 border-red-200">
        <p className="text-red-600 font-semibold">Ошибка: {error}</p>
      </div>
    );
  }

  return (
    <div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <p className="text-xl text-gray-600 mb-6">У вас пока нет продуктов</p>
          <button
            onClick={onCreateNew}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-semibold text-lg hover:bg-primary-hover transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Создать первый продукт
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => onSelectProduct(product)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex-1 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <button
                  onClick={(e) => handleDelete(product.id, e)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                  title="Удалить"
                >
                  ×
                </button>
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                {product.description.length > 100
                  ? product.description.substring(0, 100) + '...'
                  : product.description}
              </p>

              {product.images && product.images.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {product.images.slice(0, 3).map((image, index) => (
                    <img
                      key={index}
                      src={`${API_ORIGIN}/storage/${image}`}
                      alt={`${product.name} ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                  {product.language}
                </span>
                {product.target_audience && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                    {product.target_audience}
                  </span>
                )}
              </div>

              {product.creatives && product.creatives.length > 0 && (
                <div className="pt-4 border-t border-gray-200 text-primary font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Креативов: {product.creatives.length}</span>
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
