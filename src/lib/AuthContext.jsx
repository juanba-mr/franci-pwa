import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al cargar la app, vemos si ya había un token guardado
    const savedToken = localStorage.getItem('hermes_token');
    const savedUser = localStorage.getItem('hermes_user');

    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (dni) => {
    const res = await fetch(`http://${window.location.hostname}:8000/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni })
    });

    if (!res.ok) throw new Error('DNI no válido');

    const data = await res.json();

    // Guardamos el "pase" en el navegador
    localStorage.setItem('hermes_token', data.token);
    localStorage.setItem('hermes_user', JSON.stringify(data.user));

    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('hermes_token');
    localStorage.removeItem('hermes_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);