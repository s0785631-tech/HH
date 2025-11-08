import axios from 'axios';

// Detectar automáticamente la URL base
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // En desarrollo usar puerto 3000, en producción usar el mismo dominio
    const port = hostname === 'localhost' || hostname === '127.0.0.1' ? ':3000' : '';
    return `${protocol}//${hostname}${port}`;
  }
  return 'http://localhost:3000';
};

const API_URL = getBaseURL();

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { cedula: string; password: string }) =>
    api.post('/auth/login', data),

  register: (data: {
    name: string;
    email: string;
    cedula: string;
    password: string;
    role: string;
  }) => api.post('/auth/register', data),
};

export const patientsAPI = {
  getAll: () => api.get('/patients'),
  getById: (id: string) => api.get(`/patients/${id}`),
  search: (query: string) => api.get(`/patients/search/${query}`),
  create: (data: any) => api.post('/patients', data),
  update: (id: string, data: any) => api.put(`/patients/${id}`, data),
};

export const appointmentsAPI = {
  getAll: (params?: any) => api.get('/appointments', { params }),
  getById: (id: string) => api.get(`/appointments/${id}`),
  create: (data: any) => api.post('/appointments', data),
  update: (id: string, data: any) => api.put(`/appointments/${id}`, data),
};

export const triageAPI = {
  getAll: (params?: any) => api.get('/triage', { params }),
  getById: (id: string) => api.get(`/triage/${id}`),
  create: (data: any) => api.post('/triage', data),
  update: (id: string, data: any) => api.put(`/triage/${id}`, data),
};

export const consultationsAPI = {
  getAll: (params?: any) => api.get('/consultations', { params }),
  getPendingTriages: () => api.get('/consultations/pending-triages'),
  create: (data: any) => api.post('/consultations', data),
  update: (id: string, data: any) => api.put(`/consultations/${id}`, data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
};

export const doctorsAPI = {
  getAll: () => api.get('/doctors'),
  getById: (id: string) => api.get(`/doctors/${id}`),
  getAvailable: (fecha: string, hora: string) => api.get(`/doctors/available/${fecha}/${hora}`),
  getSchedule: (id: string, fecha: string) => api.get(`/doctors/${id}/horarios/${fecha}`),
  create: (data: any) => api.post('/doctors', data),
  update: (id: string, data: any) => api.put(`/doctors/${id}`, data),
};

export default api;
