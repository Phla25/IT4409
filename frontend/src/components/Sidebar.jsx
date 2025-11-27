import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onCloseMobile }) {
  const { userRole } = useAuth();
  const location = useLocation();

  const menuItems = [
    { label: '🏠 Trang chủ', path: '/' },
    { label: '📍 Tìm quanh đây', path: '/nearby' }, // Bạn có thể tách route này nếu muốn
  ];

  if (userRole === 'admin') {
    menuItems.push({ label: '⚙️ Quản lý địa điểm', path: '/admin' });
  }

  return (
    <>
      {/* Overlay đen mờ chỉ hiện ở mobile khi sidebar mở */}
      {isOpen && <div className="sidebar-overlay" onClick={onCloseMobile}></div>}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <Link 
              to={item.path} 
              key={item.path} 
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={onCloseMobile} // Đóng sidebar khi chọn menu (trên mobile)
            >
              {item.label}
            </Link>
          ))}
        </ul>
        
        <div style={{ marginTop: 'auto', padding: '20px', fontSize: '0.8rem', color: '#bdc3c7' }}>
          <p>Phiên bản 1.0.0</p>
        </div>
      </aside>
    </>
  );
}