const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Если есть токен авторизации, добавляем его
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Products
  async getProducts() {
    return this.request('/products');
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async createProduct(formData) {
    return this.request('/products', {
      method: 'POST',
      body: formData,
      headers: {
        // Не устанавливаем Content-Type для FormData, браузер сделает это сам
        'Accept': 'application/json',
      },
    });
  }

  async updateProduct(id, data) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Creatives
  async getCreatives() {
    return this.request('/creatives');
  }

  async getCreative(id) {
    return this.request(`/creatives/${id}`);
  }

  async downloadVideo(creativeId) {
    const token = localStorage.getItem('auth_token');
    const url = `${API_BASE_URL}/creatives/${creativeId}/download/video`;
    const headers = { 'Accept': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Download failed');
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `creative_${creativeId}.mp4`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  async downloadScript(creativeId) {
    const token = localStorage.getItem('auth_token');
    const url = `${API_BASE_URL}/creatives/${creativeId}/download/script`;
    const headers = { 'Accept': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Download failed');
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `creative_${creativeId}_script.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Generation
  async startGeneration(productId) {
    return this.request('/generation/start', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    });
  }

  async getGenerationStatus(jobId) {
    return this.request(`/generation/status/${jobId}`);
  }
}

export default new ApiService();
