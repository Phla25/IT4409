import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Lấy từ localStorage nếu có (đảm bảo đăng nhập vẫn giữ khi refresh)
  const [authToken, setAuthToken] = useState(localStorage.getItem('token') || null);
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'user');

  // Header có token để gọi API
  const authHeaders = authToken
    ? {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    : { 'Content-Type': 'application/json' };

  // 🔐 Login (được gọi sau khi backend trả token)
  const login = (token, role) => {
    setAuthToken(token);
    setUserRole(role);
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
  };

  // 🚪 Logout
  const logout = () => {
    setAuthToken(null);
    setUserRole('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  };

  return (
    <AuthContext.Provider value={{ authToken, userRole, authHeaders, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
