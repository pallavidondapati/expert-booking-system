import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.response?.data?.errors?.[0]?.msg ||
      err.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const expertAPI = {
  getAll: (params) => api.get('/experts', { params }),
  getById: (id) => api.get(`/experts/${id}`),
  getCategories: () => api.get('/experts/categories'),
};

export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getByEmail: (email) => api.get('/bookings', { params: { email } }),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
};

export default api;
