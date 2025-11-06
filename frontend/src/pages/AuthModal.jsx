// frontend/src/pages/AuthModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css'; // 👈 thêm dòng này

export default function AuthModal({ onClose }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await axios.post(`http://localhost:5000/api${endpoint}`, form);

      if (data.success && data.token) {
        login(data.token, data.role);
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        onClose();
      } else if (data.success) {
        setMessage('Đăng ký thành công! Hãy đăng nhập.');
        setIsLogin(true);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Lỗi kết nối máy chủ.');
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>{isLogin ? 'Đăng nhập' : 'Đăng ký'}</h2>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              name="username"
              placeholder="Tên người dùng"
              value={form.username}
              onChange={handleChange}
              required
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={handleChange}
            required
          />
            <button
                type="submit"
                className="w-full mt-3 py-3 text-white font-semibold rounded-xl 
                            bg-gradient-to-r from-blue-600 to-indigo-500
                            shadow-lg shadow-blue-500/30 
                            hover:from-indigo-500 hover:to-blue-600
                            transform hover:-translate-y-0.5 
                            transition-all duration-200"
                >
                {isLogin ? 'Đăng nhập' : 'Đăng ký'}
            </button>
        </form>

        {message && <p className="error">{message}</p>}

        <p className="toggle">
          {isLogin ? (
            <>Chưa có tài khoản?{' '}
              <span onClick={() => setIsLogin(false)}>Đăng ký ngay</span>
            </>
          ) : (
            <>Đã có tài khoản?{' '}
              <span onClick={() => setIsLogin(true)}>Đăng nhập</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
