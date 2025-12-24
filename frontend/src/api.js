// frontend/src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Gửi Token đi
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ✅ Bắt lỗi 401 để đá User ra
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session hết hạn hoặc bị đá!");
      localStorage.clear(); // Xóa sạch token
      window.location.href = '/'; // Reload về trang chủ
    }
    return Promise.reject(error);
  }
);

export default API;