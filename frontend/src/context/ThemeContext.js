import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // 1. Logic khởi tạo thông minh
  const [theme, setTheme] = useState(() => {
    // Ưu tiên 1: Lấy từ LocalStorage (người dùng đã từng chọn)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }

    // Ưu tiên 2: Nếu chưa chọn bao giờ, kiểm tra cài đặt hệ thống máy tính
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // Mặc định: Light
    return 'light';
  });

  useEffect(() => {
    const root = document.body;

    // Xóa sạch các class cũ để tránh xung đột
    root.classList.remove('light-mode', 'dark-mode');

    // Thêm class tương ứng để CSS thuần (App.css) hoạt động
    if (theme === 'dark') {
      root.classList.add('dark-mode');
    } else {
      root.classList.add('light-mode');
    }

    // Lưu lựa chọn vào localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};