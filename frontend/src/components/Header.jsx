import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ onToggleSidebar, onOpenAuth }) {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="header-brand">
        <button className="menu-toggle-btn" onClick={onToggleSidebar}>☰</button>
        {/* Thêm icon cái bát hoặc location cho hợp theme ăn uống */}
        <span>HANOI FOODMAP</span> 
      </div>

      <div className="header-actions">
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