import React, { useEffect, useState } from 'react';
import './App.css';
import LeafletMapComponent from './MapContainer';
import LocationCRUD from './LocationCRUD';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './pages/AuthModal';

function MainApp() {
  const { authToken, logout, userRole, login } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 🌞 Theme (mặc định là light)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    } else {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 🔑 Giữ trạng thái đăng nhập
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) login(token, role);
  }, [login]);

  return (
    <div className="App">
      {/* ☀️ / 🌙 Nút chuyển theme */}
      <button
        className="theme-toggle"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        title={theme === 'light' ? 'Chuyển sang tối' : 'Chuyển sang sáng'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <header className="App-header">
        <h1>Bản đồ Ẩm thực Hà Nội</h1>

        {!authToken ? (
          <button
            onClick={() => setShowAuthModal(true)}
            className="login-btn"
          >
            Đăng nhập / Đăng ký
          </button>
        ) : (
          <div>
            <p>Vai trò: {userRole}</p>
            <button onClick={logout} className="login-btn">
              Đăng xuất
            </button>
          </div>
        )}
      </header>

      {/* CRUD chỉ hiển thị khi là admin */}
      {authToken && userRole === 'admin' && <LocationCRUD />}

      <div style={{ padding: '20px' }}>
        <LeafletMapComponent />
      </div>

      {/* Modal đăng nhập / đăng ký */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;