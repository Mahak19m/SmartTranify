import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, UserResponse, FitnessProfileData } from '../api/client';

interface AuthContextType {
  user: UserResponse | null;
  profile: FitnessProfileData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: FitnessProfileData) => Promise<FitnessProfileData>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [profile, setProfile] = useState<FitnessProfileData | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('smarttranify_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchUserData = async () => {
    const storedToken = localStorage.getItem('smarttranify_token');
    if (!storedToken) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userData = await api.getMe();
      setUser(userData);
      try {
        const profileData = await api.getProfile();
        setProfile(profileData);
      } catch (pErr) {
        console.warn('Profile fetch warning:', pErr);
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      api.logout();
      setToken(null);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const data = await api.login(email, password);
      setToken(data.access_token);
      await fetchUserData();
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setAuthError(null);
    try {
      const data = await api.register(name, email, password);
      setToken(data.access_token);
      await fetchUserData();
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    api.logout();
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: FitnessProfileData) => {
    const updated = await api.saveProfile(data);
    setProfile(updated);
    if (user && updated.name) {
      setUser((prev) => (prev ? { ...prev, name: updated.name! } : null));
    }
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        authError,
        login,
        register,
        logout,
        updateProfile,
        refreshUser: fetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
