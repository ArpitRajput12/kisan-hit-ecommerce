import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../api/auth.api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  adminLogin: (email: string, password: string) => Promise<User>;
  loginWithOtp: (phone: string, otp: string) => Promise<User>;
  loginWithGoogle: (
    idToken: string,
    role?: 'BUYER' | 'SELLER'
  ) => Promise<{
    user: User | null;
    requiresPhoneLinking?: boolean;
    isNewUser?: boolean;
    isExistingDealer?: boolean;
    redirectUrl?: string;
    email?: string;
    name?: string;
    googleId?: string;
  }>;
  registerFarmerProfile: (payload: any) => Promise<User>;
  completeFarmerProfile: (payload: any) => Promise<User>;
  completeDealerProfile: (payload: any) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await authApi.getProfile();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          }
        } catch {
          // Token invalid, clear
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login(email, password);
    const loggedUser = res.data.user;
    const accessToken = res.data.tokens?.accessToken;

    if (!loggedUser || !accessToken) {
      throw new Error('Invalid login response from server');
    }

    setUser(loggedUser);
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  const adminLogin = async (email: string, password: string): Promise<User> => {
    const res = await authApi.adminLogin(email, password);
    const loggedUser = res.data.user;
    const accessToken = res.data.tokens?.accessToken;

    if (!loggedUser || !accessToken) {
      throw new Error('Invalid Super Admin credentials or response from server');
    }

    setUser(loggedUser);
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  const loginWithOtp = async (phone: string, otp: string): Promise<User> => {
    const res = await authApi.verifyOtp(phone, otp);
    const loggedUser = res.data.user;
    const accessToken = res.data.tokens?.accessToken;

    if (!loggedUser || !accessToken) {
      throw new Error('Invalid OTP login response from server');
    }

    setUser(loggedUser);
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  const loginWithGoogle = async (
    idToken: string,
    role?: 'BUYER' | 'SELLER'
  ): Promise<{
    user: User | null;
    requiresPhoneLinking?: boolean;
    isNewUser?: boolean;
    isExistingDealer?: boolean;
    redirectUrl?: string;
    email?: string;
    name?: string;
    googleId?: string;
  }> => {
    const res = await authApi.googleAuth(idToken, role);
    if (res.data.isNewUser) {
      return {
        user: null,
        requiresPhoneLinking: true,
        isNewUser: true,
        isExistingDealer: false,
        redirectUrl: res.data.redirectUrl,
        email: res.data.email,
        name: res.data.name,
        googleId: res.data.googleId,
      };
    }
    const loggedUser = res.data.user;
    const accessToken = res.data.tokens?.accessToken;

    if (loggedUser && accessToken) {
      setUser(loggedUser);
      setToken(accessToken);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));
    }
    return {
      user: loggedUser,
      requiresPhoneLinking: res.data.requiresPhoneLinking,
      isNewUser: false,
      isExistingDealer: res.data.isExistingDealer ?? true,
      redirectUrl: res.data.redirectUrl,
      email: res.data.email,
      googleId: res.data.googleId,
    };
  };

  const registerFarmerProfile = async (payload: any): Promise<User> => {
    const res = await authApi.registerFarmerProfile(payload);
    const loggedUser = res.data.user!;
    const accessToken = res.data.tokens!.accessToken;

    setUser(loggedUser);
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  const completeFarmerProfile = async (payload: any): Promise<User> => {
    const res = await authApi.completeFarmerProfile(payload);
    const updatedUser = res.data;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const completeDealerProfile = async (payload: any): Promise<User> => {
    const res = await authApi.completeDealerProfile(payload);
    const updatedUser = res.data;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const register = async (payload: any): Promise<User> => {
    const res = await authApi.register(payload);
    const newUser = res.data.user!;
    const accessToken = res.data.tokens!.accessToken;

    setUser(newUser);
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const role = user?.role || null;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isSeller = role === 'SELLER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isSuperAdmin,
        isAdmin,
        isSeller,
        role,
        loading,
        login,
        adminLogin,
        loginWithOtp,
        loginWithGoogle,
        registerFarmerProfile,
        completeFarmerProfile,
        completeDealerProfile,
        register,
        logout,
        setUser,
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
