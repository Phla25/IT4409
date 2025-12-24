import React from 'react';
import { useAuth } from '../context/AuthContext';
// 👇 Import Theme Context và Icon
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import { FaBell, FaSun, FaMoon } from 'react-icons/fa';

export default function Header({ onToggleSidebar, onOpenAuth, pendingCount }) {
  const { user, logout, userRole } = useAuth();
  // 👇 Lấy theme và hàm toggle
  const { theme, toggleTheme } = useTheme();
  
  const isAdmin = userRole === 'admin';

  return (
    <header className="app-header">
      <div className="header-brand">
        <button className="menu-toggle-btn" onClick={onToggleSidebar}>☰</button>
        {/* Thêm icon cái bát hoặc location cho hợp theme ăn uống */}
        <span>HANOI FOODMAP</span> 
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        {/* ✨ NÚT CHUYỂN THEME */}
        <button 
            onClick={toggleTheme}
            style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '50%',
                width: '35px',
                height: '35px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.1rem',
                transition: 'all 0.2s'
            }}
            title={theme === 'light' ? 'Chuyển chế độ tối' : 'Chuyển chế độ sáng'}
        >
            {theme === 'light' ? <FaMoon /> : <FaSun />}
        </button>

        {/* 2. CHUÔNG THÔNG BÁO (Chỉ hiện cho Admin) */}
        {user && isAdmin && (
          <Link 
            to="/admin" 
            title="Duyệt địa điểm"
            style={{ 
              position: 'relative', 
              color: 'white', 
              fontSize: '1.4rem', 
              display: 'flex', 
              alignItems: 'center',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <FaBell />
            {pendingCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-6px',
                backgroundColor: '#e74c3c',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                height: '18px',
                minWidth: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '2px solid #c0392b',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {pendingCount}
              </span>
            )}
          </Link>
        )}

        {/* Vạch ngăn cách */}
        <div style={{ width: '1px', height: '25px', background: 'rgba(255,255,255,0.3)' }}></div>

        {/* 3. Khu vực User */}
        {user ? (
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span>Xin chào, <b>{user.username}</b></span>
            
            {/* Dùng class CSS thay vì style cứng */}
            <button onClick={logout} className="btn-header-logout">
              Thoát
            </button>
          </div>
        ) : (
          // Nút Đăng nhập màu trắng, chữ đỏ cho nổi bật trên nền đỏ
          <button onClick={onOpenAuth} className="btn-header-login">
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}