import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

// Cấu hình API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function AuthModal({ onClose }) {
  const { login } = useAuth();
  
  // State quản lý
  const [isLogin, setIsLogin] = useState(true);   // True: Đăng nhập, False: Đăng ký
  const [isAdmin, setIsAdmin] = useState(false);  // True: Admin Mode, False: User Mode
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [form, setForm] = useState({ email: '', password: '', username: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setMessage('');

    try {
      let endpoint = '';
      
      if (!isLogin) {
        endpoint = '/auth/register';
      } else {
        endpoint = isAdmin ? '/auth/admin/login' : '/auth/login';
      }

      const { data } = await axios.post(`${API_URL}${endpoint}`, form, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (data.success) {
        if (isLogin && data.token) {
          login(data.token, data.role || (isAdmin ? 'admin' : 'user'));
          onClose();
        } else {
          setMessage('Đăng ký thành công! Vui lòng đăng nhập.');
          setIsLogin(true);
          setIsAdmin(false);
          setForm({ email: '', password: '', username: '' }); // Reset form
        }
      }
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Lỗi kết nối hoặc sai thông tin.';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className={`auth-modal ${isAdmin && isLogin ? 'admin-theme' : ''}`}>
        <button className="close-btn" onClick={onClose}>×</button>

        {/* HEADER */}
        <h2 style={{ color: isAdmin && isLogin ? '#d9534f' : '#333', marginTop: 0 }}>
          {isLogin 
            ? (isAdmin ? 'QUẢN TRỊ VIÊN' : 'ĐĂNG NHẬP') 
            : 'TẠO TÀI KHOẢN'}
        </h2>
        
        {isAdmin && isLogin && (
          <p style={{fontSize: '0.9em', color: '#666', marginBottom: '20px', marginTop: '-10px'}}>
            Hệ thống dành cho quản lý
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              name="username"
              placeholder="Tên hiển thị"
              value={form.username}
              onChange={handleChange}
              required
            />
          )}
          <input
            type="email"
            name="email"
            placeholder={isAdmin && isLogin ? "Email quản trị" : "Email"}
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
            disabled={loading}
            style={{ 
                background: isAdmin && isLogin 
                  ? 'linear-gradient(135deg, #d9534f, #c9302c)' 
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)'
            }}
          >
            {loading 
              ? 'Đang xử lý...' 
              : (isLogin ? (isAdmin ? 'Đăng nhập Admin' : 'Đăng nhập') : 'Đăng ký')}
          </button>
        </form>

        {message && <div className="error">{message}</div>}

        {/* --- UI TOGGLE SWITCH (NÚT GẠT) --- */}
        {isLogin && (
          <div className="mode-switch">
            <label className="switch-label">
              <input 
                type="checkbox" 
                checked={isAdmin} 
                onChange={() => {
                    setIsAdmin(!isAdmin);
                    setMessage('');
                }} 
              />
              <span className="slider"></span>
            </label>
            
            <span 
              className="switch-text"
              onClick={() => setIsAdmin(!isAdmin)}
            >
              Đăng nhập với quyền <strong>Admin</strong>
            </span>
          </div>
        )}

        <div className="toggle">
          {isLogin ? (
            <>Chưa có tài khoản? <span onClick={() => { setIsLogin(false); setIsAdmin(false); }}>Đăng ký ngay</span></>
          ) : (
            <>Đã có tài khoản? <span onClick={() => setIsLogin(true)}>Đăng nhập</span></>
          )}
        </div>
      </div>
    </div>
  );
}