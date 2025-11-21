import React, { useState } from 'react';
import { Outlet } from 'react-router-dom'; // Outlet là nơi nội dung con (Map/Admin) hiển thị
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import AuthModal from '../pages/AuthModal';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State cho mobile sidebar
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="app-container">
      {/* 1. HEADER */}
      <Header 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* 2. BODY (SIDEBAR + CONTENT) */}
      <div className="body-container">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onCloseMobile={() => setIsSidebarOpen(false)} 
        />
        
        <main className="main-content">
          {/* Outlet: Đây là nơi Router sẽ render MapContainer hoặc AdminCRUD */}
          <Outlet /> 
        </main>
      </div>

      {/* 3. FOOTER */}
      <Footer />

      {/* 4. MODAL */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}