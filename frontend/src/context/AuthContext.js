import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'guest');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  // Hàm Login: Nhận data từ response backend
  const login = (token, role, userData) => {
    setAuthToken(token);
    setUserRole(role);
    setUser(userData);

    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Hàm Logout
  const logout = () => {
    setAuthToken(null);
    setUserRole('guest');
    setUser(null);

    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    
    // Optional: Reload trang để clear state sạch sẽ
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ authToken, userRole, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};