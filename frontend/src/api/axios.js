import axios from 'axios';
import { redirect } from 'react-router-dom';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

//reusable axios instance with base config
const api = axios.create({
  baseURL: API_BASE_URL,
});

// automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//handle expired token - log user out automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      -(
        //token expired or invalid
        localStorage.removeItem('token')
      );
      localStorage.removeItem('user');
      window.location.href = '/login'; //redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
