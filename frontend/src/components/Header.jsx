import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaBell } from 'react-icons/fa'; // Icon cái chuông

export default function Header({ onToggleSidebar, onOpenAuth, pendingCount }) {
  const { user, logout, userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  return (
    <header className="app-header">
      {/* 1. Logo & Menu Toggle */}
      <div className="header-brand">
        <button className="menu-toggle-btn" onClick={onToggleSidebar}>☰</button>
        <span style={{ marginLeft: '10px' }}>HANOI FOODMAP</span> 
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        {/* 2. CHUÔNG THÔNG BÁO (Chỉ hiện cho Admin) */}
        {user && isAdmin && (
          <Link 
            to="/admin" 
            title="Duyệt địa điểm"
            style={{ 
              position: 'relative', 
              color: 'white', 
              fontSize: '1.4rem', // Chuông to rõ
              display: 'flex', 
              alignItems: 'center',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <FaBell />
            
            {/* Số đỏ tròn nằm ngay góc chuông */}
            {pendingCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-6px',
                backgroundColor: '#e74c3c', // Màu đỏ nổi bật
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                height: '18px',
                minWidth: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%', // Tròn xoe
                border: '2px solid #c0392b', // Viền đỏ đậm để tách nền
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {pendingCount}
              </span>
            )}
          </Link>
        )}

        {/* Vạch ngăn cách giữa chuông và user */}
        {user && isAdmin && <div style={{ width: '1px', height: '25px', background: 'rgba(255,255,255,0.3)' }}></div>}

        {/* 3. Khu vực User */}
        {user ? (
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span className="user-welcome">
              Hi, <b>{user.username}</b>
            </span>
            
            <button onClick={logout} className="btn-header-logout">
              Thoát
            </button>
          </div>
        ) : (
          <button onClick={onOpenAuth} className="btn-header-login">
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}