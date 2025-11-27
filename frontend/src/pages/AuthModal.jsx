import React, { useState } from 'react';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

export default function AuthModal({ onClose }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true); // True: Đăng nhập, False: Đăng ký
  
  // State cho form
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });
  
  // State cho Role (Mặc định là 'user')
  const [role, setRole] = useState('user'); 
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- HÀM KIỂM TRA EMAIL (REGEX) ---
  const isValidEmail = (email) => {
    // Regex chuẩn để check email (vd: abc@domain.com)
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Xử lý thay đổi input text
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Xóa lỗi khi người dùng bắt đầu gõ lại
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- 1. VALIDATION ĐẦU VÀO ---
    if (!formData.email || !formData.password) {
        setError("Vui lòng điền đầy đủ thông tin.");
        return;
    }

    if (!isValidEmail(formData.email)) {
        setError("Định dạng email không hợp lệ (ví dụ: user@example.com).");
        return;
    }

    if (!isLogin && !formData.username) {
        setError("Vui lòng nhập tên hiển thị.");
        return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIC ĐĂNG NHẬP ---
        const endpoint = role === 'admin' ? '/auth/admin/login' : '/auth/login';
        
        const res = await API.post(endpoint, {
          email: formData.email,
          password: formData.password
        });

        const userData = res.data.user || { username: 'Admin' }; 
        const userRole = res.data.role || role;

        login(res.data.token, userRole, userData);
        onClose(); 
      } else {
        // --- LOGIC ĐĂNG KÝ ---
        await API.post('/auth/register', {
            ...formData,
            // Role mặc định backend xử lý là 'user'
        });
        
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        setIsLogin(true); 
        setRole('user'); // Reset về user sau khi đăng ký xong
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <h2>{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</h2>
        
        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={handleSubmit}>
          
          {/* --- CHỈ HIỆN CHỌN ROLE KHI ĐANG Ở TAB ĐĂNG NHẬP --- */}
          {isLogin && (
            <div className="role-selector">
              <label className={`role-option ${role === 'user' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="role" 
                  value="user" 
                  checked={role === 'user'}
                  onChange={(e) => setRole(e.target.value)}
                />
                Khách hàng
              </label>
              <label className={`role-option ${role === 'admin' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="role" 
                  value="admin" 
                  checked={role === 'admin'}
                  onChange={(e) => setRole(e.target.value)}
                />
                Quản trị viên
              </label>
            </div>
          )}

          {/* --- CÁC INPUT --- */}
          {!isLogin && (
            <div className="form-group">
              <label>Tên hiển thị:</label>
              <input 
                type="text" 
                name="username"
                required 
                value={formData.username}
                onChange={handleChange}
                placeholder="Ví dụ: Nguyen Van A"
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email:</label>
            <input 
              type="email" 
              name="email"
              required 
              value={formData.email}
              onChange={handleChange}
              placeholder="email@example.com"
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu:</label>
            <input 
              type="password" 
              name="password"
              required 
              value={formData.password}
              onChange={handleChange}
              placeholder="******"
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Đang xử lý...' : (isLogin ? `Đăng Nhập (${role === 'admin' ? 'Admin' : 'User'})` : 'Đăng Ký')}
          </button>
        </form>
        
        {/* LOGIC ẨN HIỆN NÚT CHUYỂN ĐỔI:
            - Chỉ hiển thị đoạn text này nếu Role KHÔNG PHẢI là Admin.
            - Vì Admin không được phép Đăng ký, nên nếu chọn Admin, dòng này sẽ biến mất.
        */}
        {role !== 'admin' && (
            <p className="switch-mode">
            {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <span onClick={() => {
                setIsLogin(!isLogin);
                setError(''); // Xóa lỗi cũ
            }}>
                {isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}
            </span>
            </p>
        )}
      </div>
    </div>
  );
}