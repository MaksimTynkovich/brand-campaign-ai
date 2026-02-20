export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Подставляет origin бэкенда для URL storage, если пришли ссылки с localhost без порта.
 * Устраняет ERR_CONNECTION_REFUSED, когда APP_URL=http://localhost, а сервер на :8000.
 */
export function getStorageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost' && (u.port === '80' || u.port === '')) {
      return API_ORIGIN + u.pathname + u.search;
    }
  } catch (_) {}
  return url;
}

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
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('API Error: invalid or empty JSON response');
      } else {
        console.error('API Error:', error);
      }
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

  // Templates
  async getTemplates(category = null) {
    const url = category ? `/templates?category=${encodeURIComponent(category)}` : '/templates';
    const res = await this.request(url);
    return { data: res.data || [], meta: res.meta || {} };
  }

  async getTemplate(id) {
    const res = await this.request(`/templates/${id}`);
    return res.data ?? res;
  }

  async createTemplate(data) {
    const token = localStorage.getItem('auth_token');
    const form = new FormData();
    // Сначала скалярные поля (Laravel ожидает их до файлов)
    ['category', 'original_prompt', 'default_voiceover', 'sort_order'].forEach((key) => {
      const v = data[key];
      if (v !== undefined && v !== null) form.append(key, String(v));
    });
    // Затем файлы — с именем файла для корректной загрузки
    if (data.preview instanceof File) form.append('preview', data.preview, data.preview.name);
    if (data.example_video instanceof File) form.append('example_video', data.example_video, data.example_video.name);
    if (Array.isArray(data.reference_images))
      data.reference_images.forEach((file) => { if (file instanceof File) form.append('reference_images[]', file, file.name); });
    const res = await fetch(`${API_BASE_URL}/templates`, {
      method: 'POST',
      headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form,
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(json.error?.message || json.message || json.errors ? JSON.stringify(json.errors) : 'Request failed');
    return json;
  }

  async updateTemplate(id, data) {
    const token = localStorage.getItem('auth_token');
    const form = new FormData();
    form.append('_method', 'PUT');
    ['category', 'original_prompt', 'default_voiceover', 'sort_order'].forEach((key) => {
      const v = data[key];
      if (v !== undefined && v !== null) form.append(key, String(v));
    });
    if (data.preview instanceof File) form.append('preview', data.preview, data.preview.name);
    if (data.example_video instanceof File) form.append('example_video', data.example_video, data.example_video.name);
    if (Array.isArray(data.reference_images))
      data.reference_images.forEach((file) => { if (file instanceof File) form.append('reference_images[]', file, file.name); });
    const res = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'POST',
      headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form,
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(json.error?.message || json.message || json.errors ? JSON.stringify(json.errors) : 'Request failed');
    return json;
  }

  async deleteTemplate(id) {
    await this.request(`/templates/${id}`, { method: 'DELETE' });
  }

  // Template Categories (admin)
  async getTemplateCategories() {
    const res = await this.request('/template-categories');
    return res.data ?? [];
  }

  async createTemplateCategory(data) {
    const res = await this.request('/template-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data ?? res;
  }

  async updateTemplateCategory(id, data) {
    const res = await this.request(`/template-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data ?? res;
  }

  async deleteTemplateCategory(id) {
    await this.request(`/template-categories/${id}`, { method: 'DELETE' });
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

  // Billing: API (credits in DB) + localStorage fallback for legacy
  async getBillingFromApi() {
    const res = await this.request('/billing');
    const d = res.data ?? res;
    return { credits: d.credits ?? 0, plan: d.plan ?? 'trial' };
  }

  getBilling() {
    try {
      const raw = localStorage.getItem('billing');
      return raw ? JSON.parse(raw) : { plan: 'trial', credits: 5 };
    } catch {
      return { plan: 'trial', credits: 5 };
    }
  }

  setBilling(data) {
    localStorage.setItem('billing', JSON.stringify(data));
  }

  spendCredits(amount = 1) {
    const billing = this.getBilling();
    if ((billing.credits ?? 0) < amount) return false;
    billing.credits = Math.max(0, (billing.credits ?? 0) - amount);
    this.setBilling(billing);
    return true;
  }

  // Generation
  async startGenerationFromTemplate(templateId, userPrompt, imageFiles = []) {
    const token = localStorage.getItem('auth_token');
    const url = `${API_BASE_URL}/generation/start`;
    const form = new FormData();
    form.append('template_id', templateId);
    if (userPrompt) form.append('prompt', userPrompt);
    imageFiles.forEach((file) => form.append('images[]', file));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
    });
    const data = await response.json();
    if (!response.ok) {
      const msg = response.status === 402 ? 'Недостаточно кредитов' : (data.error?.message || data.message || 'Request failed');
      const err = new Error(msg);
      err.status = response.status;
      throw err;
    }
    return data;
  }

  async getGenerationStatus(jobId) {
    const res = await this.request(`/generation/status/${jobId}`);
    return res.data ?? res;
  }

  async getMyVideos() {
    const res = await this.request('/my-videos');
    return { data: res.data ?? [], meta: res.meta ?? {} };
  }

  /** Карусель на главной (публичный, без авторизации) */
  async getCarousel() {
    const res = await this.request('/carousel');
    return res.data ?? [];
  }

  // Admin: пользователи
  async getAdminUsers() {
    const res = await this.request('/admin/users');
    return { data: res.data ?? [], meta: res.meta ?? {} };
  }

  async updateAdminUser(id, data) {
    const res = await this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data ?? res;
  }

  async getAdminCarousel() {
    return this.request('/admin/carousel');
  }

  async updateAdminCarousel(templateIds) {
    return this.request('/admin/carousel', {
      method: 'PUT',
      body: JSON.stringify({ template_ids: templateIds }),
    });
  }

  // Auth
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      if (!localStorage.getItem('billing')) {
        this.setBilling({ plan: 'trial', credits: 5 });
      }
    }

    return response;
  }

  async register(email, password) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      if (!localStorage.getItem('billing')) {
        this.setBilling({ plan: 'trial', credits: 5 });
      }
    }

    return response;
  }

  async logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPassword,
      }),
    });
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }

  // Dashboard
  async getDashboardStats() {
    try {
      return await this.request('/dashboard/stats');
    } catch (err) {
      // Если endpoint не существует, возвращаем mock данные
      return {
        total_projects: 0,
        total_creatives: 0,
        completed_creatives: 0,
        videos_this_month: 0,
      };
    }
  }
}

export default new ApiService();
