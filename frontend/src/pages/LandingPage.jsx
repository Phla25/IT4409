import React, { useState } from 'react';
import './LandingPage.css'; // File CSS tạo kiểu blur
import AuthModal from './AuthModal'; // Tận dụng lại Modal cũ

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="landing-container">
      {/* Lớp ảnh nền (Background Layer) */}
      <div className="landing-bg"></div>

      {/* Lớp nội dung nổi lên trên (Content Layer) */}
      <div className="landing-content">
        <h1 className="landing-title">HANOI FOOD MAP 🍜</h1>
        <p className="landing-subtitle">Khám phá tinh hoa ẩm thực Hà Thành qua bản đồ số</p>
        
        <button 
          className="landing-btn"
          onClick={() => setShowAuthModal(true)}
        >
          Bắt đầu khám phá / Đăng nhập
        </button>
      </div>

      <div className="landing-footer">
        © 2025 Hanoi Food Map Project
      </div>

      {/* Popup Đăng nhập/Đăng ký */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}