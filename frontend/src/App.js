import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import LeafletMapComponent from './MapContainer';
import LocationCRUD from './pages/LocationCRUD'; 
import LocationListPage from './pages/LocationListPage';
import LocationDetailPage from './pages/LocationDetailPage.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import FavoriteLocationsPage from './pages/FavoriteLocationsPage';
import AdminMenuManager from './pages/AdminMenuManager';
import { AuthProvider, useAuth } from './context/AuthContext';
import DishRecommendation from './components/DishRecommendation';
import AuthModal from './pages/AuthModal';

// --- TRANG BÁO LỖI QUYỀN ---
function UnauthorizedPage() {
  return (
    <div style={{ padding: 50, textAlign: 'center', marginTop: 50 }}>
      <h1>⛔ Truy cập bị từ chối</h1>
      <p>Bạn cần quyền <b>Quản trị viên (Admin)</b> để truy cập trang này.</p>
      <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>Quay lại trang chủ</a>
    </div>
  );
}

function AppContent() {
  const { authToken, logout, userRole, login } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // State hiển thị tên người dùng
  const [username, setUsername] = useState('');

  // 🌞 Theme (mặc định là light)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Logic Theme
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

  // Logic Scroll
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Logic Auth & Username
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const savedName = localStorage.getItem('username'); 

    if (token && role) login(token, role);
    if (savedName) setUsername(savedName);
  }, [login]);

  useEffect(() => {
    if (authToken) {
      const name = localStorage.getItem('username');
      if (name) setUsername(name);
    } else {
      setUsername('');
    }
  }, [authToken]);

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

      <Routes>
        {/* === TRANG CHỦ (Hiển thị Header + Gợi ý + Bản đồ) === */}
        <Route path="/" element={
          <>
            {/* 👇 HEADER NGUYÊN BẢN CỦA BẠN */}
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

            {/* Gợi ý món ăn */}
            <DishRecommendation />

            {/* Bản đồ */}
            <div style={{ padding: '20px' }}>
               <div style={{ height: '800px' }}>
                  <LeafletMapComponent />
               </div>
            </div>
          </>
        } />

        {/* === CÁC TRANG CON === */}
        <Route path="/nearby" element={<LocationListPage />} />
        <Route path="/favorites" element={<FavoriteLocationsPage />} />
        <Route path="/locations/:id" element={<LocationDetailPage />} />
        
        {/* === ADMIN ROUTES === */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="admin">
               <div style={{ padding: '20px', overflowY: 'auto', height: '100%', width: '100%' }}>
                  <LocationCRUD />
               </div>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/menu-manager" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminMenuManager />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Modal Đăng nhập hiển thị toàn cục */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
         <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;