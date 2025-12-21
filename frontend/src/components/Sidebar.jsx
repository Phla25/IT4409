import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onCloseMobile, pendingCount }) {
  const { userRole } = useAuth();
  const location = useLocation();
  console.log("Current User Role:", userRole);
  const menuItems = [
    { label: '🏠 Trang chủ', path: '/' },
  ];

  if (userRole === 'user') {
    // ✨ THÊM DÒNG NÀY: Dẫn tới trang Gợi ý món ăn
    menuItems.push({ label: '✨ Gợi ý hôm nay', path: '/recommendations' });
    menuItems.push({ label: '📍 Tìm quanh đây', path: '/nearby' });
    menuItems.push({ label: '❤️ Yêu thích', path: '/favorites' });
  }
  
  if (userRole === 'admin') {
    menuItems.push({ 
        label: '⚙️ Quản lý địa điểm', 
        path: '/admin',
        hasBadge: true 
    });
    menuItems.push({ label: '🍽 Quản lý thực đơn', path: '/admin/menu-manager' });
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onCloseMobile}></div>}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <Link 
              to={item.path} 
              key={item.path} 
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={onCloseMobile}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>{item.label}</span>

              {item.hasBadge && pendingCount > 0 && (
                <span style={{
                    backgroundColor: '#e74c3c', color: 'white',
                    fontSize: '0.8rem', fontWeight: 'bold',
                    padding: '2px 8px', borderRadius: '10px'
                }}>
                    {pendingCount}
                </span>
              )}
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