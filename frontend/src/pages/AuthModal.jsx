// frontend/src/pages/AuthModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

export default function AuthModal({ onClose }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // 👈 thêm

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // ⛔ tránh submit liên tiếp
    setLoading(true);
    setMessage('');

    try {
      let endpoint;
      if (isLogin) {
        endpoint = isAdmin ? '/auth/admin/login' : '/auth/login';
      } else {
        endpoint = '/auth/register';
      }

      const { data } = await axios.post(`http://localhost:5000/api${endpoint}`, form, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (data.success && data.token) {
        login(data.token, data.role);
        onClose();
      } else if (data.success) {
        setMessage('Đăng ký thành công! Hãy đăng nhập.');
        setIsLogin(true);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false); // 👈 bật lại khi xong
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>{isLogin ? (isAdmin ? 'Đăng nhập Admin' : 'Đăng nhập') : 'Đăng ký'}</h2>

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
            className="submit-btn"
            disabled={loading} // 👈 disable khi đang gửi request
          >
            {loading
              ? 'Đang xử lý...' // 👈 hiển thị trạng thái loading
              : isLogin
                ? (isAdmin ? 'Đăng nhập Admin' : 'Đăng nhập')
                : 'Đăng ký'}
          </button>
        </form>

        {message && <p className="error">{message}</p>}

        {isLogin && (
          <p className="toggle-admin">
            <span onClick={() => setIsAdmin(!isAdmin)}>
              {isAdmin ? '← Quay lại đăng nhập người dùng' : 'Đăng nhập với tư cách Admin'}
            </span>
          </p>
        )}

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