import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/authService';
import { User } from '../types/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          // Verify token and get user profile
          const userProfile = await authService.getProfile();
          setUser(userProfile);
        }
      } catch (error) {
        // Token might be expired, try to refresh
        try {
          await refreshToken();
        } catch (refreshError) {
          // Clear invalid tokens
          localStorage.removeItem('accessToken');
          console.error('Auth initialization failed:', refreshError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login(username, password);
      
      // Store access token
      localStorage.setItem('accessToken', response.accessToken);
      
      // Set user data
      setUser(response.user);
      
      toast.success('Login successful!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem('accessToken');
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const response = await authService.refreshToken();
      localStorage.setItem('accessToken', response.accessToken);
      
      // Get updated user profile
      const userProfile = await authService.getProfile();
      setUser(userProfile);
    } catch (error) {
      // Refresh failed, clear auth state
      localStorage.removeItem('accessToken');
      setUser(null);
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};