import axios from 'axios';

const API = axios.create({
  baseURL: 'https://vv3rq1lx-5000.asse.devtunnels.ms/api',
});

// Interceptor: Tự động gắn Token vào mỗi request nếu có
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;