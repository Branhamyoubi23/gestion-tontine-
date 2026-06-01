import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, userService } from '@/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: 'user' | 'admin' | 'super_admin' | 'member';
  avatar?: string;
  profile_picture?: string;
  onboarding_step?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<User>;
  updateOnboardingStep: (step: number) => Promise<void>;
  refreshUser: () => Promise<void>;
  setAuthData: (token: string, user: User) => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => ({}),
  register: async () => {},
  logout: () => {},
  updateProfile: async () => ({ id: '', name: '', email: '', phone: '' }),
  updateOnboardingStep: async () => {},
  refreshUser: async () => {},
  setAuthData: () => {},
});

// Export the provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Use the specific services from api.ts
  const fetchUserProfile = async () => {
    try {
      const response = await authService.getCurrentUser();
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await fetchUserProfile();
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      const response = await authService.login(phone, password);
      
      if (response.require_password_setup) {
        return response;
      }

      if (response.token && response.user) {
        localStorage.setItem('token', response.token);
        setUser(response.user);
        setIsAuthenticated(true);
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authService.register(userData);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      const response = await userService.updateProfile(userData);
      const updatedUser = { ...user, ...response.user };
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const updateOnboardingStep = async (step: number) => {
    try {
      const { userService } = await import('@/services/api');
      await userService.updateOnboardingStep(step);
      setUser(prev => prev ? { ...prev, onboarding_step: step } : null);
    } catch (error) {
      console.error('Update onboarding step error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    await fetchUserProfile();
  };

  const setAuthData = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    updateOnboardingStep,
    refreshUser,
    setAuthData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Export the hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
