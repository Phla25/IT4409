// frontend/src/App.js
import React, { useEffect, useState } from 'react';
import './App.css';
import LeafletMapComponent from './MapContainer';
import LocationCRUD from './LocationCRUD';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './pages/AuthModal';

function MainApp() {
  const { authToken, logout, userRole, login } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Giữ trạng thái đăng nhập sau khi reload trang
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) login(token, role);
  }, [login]);

  return (
    <div className="App">
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
            <button
              onClick={logout}
              className="login-btn"
            >
              Đăng xuất
            </button>
          </div>
        )}
      </header>

      {/* CRUD chỉ Admin mới thấy */}
      {authToken && userRole === 'admin' && <LocationCRUD />}

      <div style={{ padding: '20px' }}>
        <LeafletMapComponent />
      </div>

      {/* Popup đăng nhập / đăng ký */}
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

