import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import ProductPage from './pages/ProductPage';
import './App.css';

function AppContent() {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const handleCreateNew = () => {
    setShowForm(true);
  };

  const handleFormSuccess = (product) => {
    setShowForm(false);
    navigate(`/products/${product.id}`);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  const handleSelectProduct = (product) => {
    navigate(`/products/${product.id}`);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="logo">🎬 adPilotsAI</div>
          <div className="nav-actions">
            {!showForm && (
              <button onClick={handleCreateNew} className="btn btn-primary">
                + Создать продукт
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="App-main">
        {showForm ? (
          <div style={{ padding: '2rem 0', background: 'var(--bg-secondary)' }}>
            <ProductForm
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        ) : (
          <>
            <div className="hero-section">
              <div className="hero-content">
                <h1>TikTok Ads Generator для E-commerce</h1>
                <p className="subtitle">
                  Создавайте готовые рекламные креативы для TikTok за минуты. 
                  Текст, видео, сценарии — всё автоматически с помощью AI.
                </p>
                <button onClick={handleCreateNew} className="hero-cta">
                  Начать бесплатно →
                </button>
              </div>
            </div>
            <ProductList
              onSelectProduct={handleSelectProduct}
              onCreateNew={handleCreateNew}
            />
          </>
        )}
      </main>
    </div>
  );
}

function ProductPageWrapper() {
  const navigate = useNavigate();
  return <ProductPage onBack={() => navigate('/')} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/products/:id" element={<ProductPageWrapper />} />
      </Routes>
    </Router>
  );
}

export default App;
