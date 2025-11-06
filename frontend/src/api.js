import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // chỉnh port theo backend của bạn
});

export default API;
