import React, { useEffect, useState } from 'react';
import './App.css';
import LeafletMapComponent from './MapContainer';
import LocationCRUD from './LocationCRUD';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './pages/AuthModal';

function MainApp() {
  const { authToken, logout, userRole, login } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // State để hiển thị tên người dùng
  const [username, setUsername] = useState('');

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

  // 👇 Luôn cuộn lên đầu trang khi tải app
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // 🔑 Giữ trạng thái đăng nhập & Cập nhật Username
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const savedName = localStorage.getItem('username'); // Lấy tên từ bộ nhớ

    if (token && role) {
      login(token, role);
    }
    
    if (savedName) {
      setUsername(savedName);
    }
  }, [login]);

  // Cập nhật username khi authToken thay đổi (để UI cập nhật ngay khi login xong)
  useEffect(() => {
    if (authToken) {
      const name = localStorage.getItem('username');
      if (name) setUsername(name);
    } else {
      setUsername('');
    }
  }, [authToken]);

  // Hàm đăng xuất mở rộng (xóa cả username)
  const handleLogout = () => {
    logout();
    localStorage.removeItem('username');
    setUsername('');
  };

  return (
    <div className="App">
      {/* ☀️ / 🌙 Nút chuyển theme */}
      <button
        className="theme-toggle"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        title={theme === 'light' ? 'Chuyển sang tối' : 'Chuyển sang sáng'}
      >
        {theme === 'light' ? '☀️' : '🌙'}
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
            {/* 👇 Hiển thị lời chào */}
            <h3 style={{ margin: '0 0 10px 0', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              Xin chào, {username || 'Bạn'}!
            </h3>
            <p>Vai trò: {userRole === 'admin' ? 'Quản trị viên' : 'Thành viên'}</p>
            
            <button onClick={handleLogout} className="login-btn">
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