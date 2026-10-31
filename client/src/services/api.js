import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Note: using 5000 as backend runs on 5000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
