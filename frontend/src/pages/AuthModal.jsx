import React, { useState } from 'react';
import API from '../api'; // Đảm bảo đường dẫn đúng file api.js của bạn
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

  // Xử lý thay đổi input text
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIC ĐĂNG NHẬP ---
        // Nếu chọn Admin -> gọi route admin, Nếu User -> gọi route user
        const endpoint = role === 'admin' ? '/auth/admin/login' : '/auth/login';
        
        console.log(`Dang goi API: ${endpoint} vao role: ${role}`);

        const res = await API.post(endpoint, {
          email: formData.email,
          password: formData.password
        });

        // Lưu vào Context (Backend trả về token, role, user info)
        // Lưu ý: API Admin trả về { user: ... } hoặc { data: ... } tùy code controller
        // Ở đây giả sử cấu trúc trả về là { token, user, role }
        const userData = res.data.user || { username: 'Admin' }; 
        const userRole = res.data.role || role;

        login(res.data.token, userRole, userData);
        onClose(); // Đóng modal
      } else {
        // --- LOGIC ĐĂNG KÝ ---
        // Lưu ý: Backend hiện tại đang hardcode role='user'. 
        // Nếu bạn muốn đăng ký Admin, cần sửa Backend để nhận biến role từ req.body
        await API.post('/auth/register', {
            ...formData,
            role: role // Gửi role lên (nếu backend hỗ trợ)
        });
        
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        setIsLogin(true); // Chuyển sang tab đăng nhập
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
          
          {/* --- PHẦN CHỌN ROLE --- */}
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

        <p className="switch-mode">
          {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}
          </span>
        </p>
      </div>
    </div>
  );
}