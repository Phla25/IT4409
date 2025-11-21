import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components & Pages
import MainLayout from './components/MainLayout';
import LeafletMapComponent from './MapContainer';
import LocationCRUD from './LocationCRUD';
import LandingPage from './pages/LandingPage.jsx'; // Import trang mới tạo
import ProtectedRoute from './components/ProtectedRoute';

import { AuthProvider, useAuth } from './context/AuthContext';

function AppRoutes() {
  const { user } = useAuth();

  // --- LOGIC ĐIỀU HƯỚNG QUAN TRỌNG ---
  // Nếu chưa đăng nhập -> Hiện Landing Page
  if (!user) {
    return <LandingPage />;
  }

  // Nếu đã đăng nhập -> Hiện Main Layout (Bản đồ + Sidebar)
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<LeafletMapComponent />} />
        
        <Route 
          path="admin" 
          element={
            <ProtectedRoute requiredRole="admin">
               <div style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
                  <h2>⚙️ Quản lý địa điểm</h2>
                  <LocationCRUD />
               </div>
            </ProtectedRoute>
          } 
        />
        
        {/* Các route khác nếu có */}
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
         {/* Tách Routes ra component con để dùng được hook useAuth */}
         <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;