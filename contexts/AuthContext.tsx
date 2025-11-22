import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { api } from '@/services/api';
import * as Device from 'expo-device';

interface User {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (userId: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}



export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Protected route logic
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login';
    const inAdminGroup = segments[0] === 'admin';
    const inUserGroup = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (user) {
      // Redirect based on role after login
      if (inAuthGroup) {
        if (user.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/(tabs)');
        }
      } else if (inAdminGroup && user.role !== 'admin') {
        // Non-admin trying to access admin routes
        router.replace('/(tabs)');
      } else if (inUserGroup && user.role === 'admin') {
        // Admin trying to access user routes
        router.replace('/admin');
      }
    }
  }, [user, loading, segments]);

  const checkSession = async (): Promise<User | null> => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const userRole = await AsyncStorage.getItem('userRole');
      const userName = await AsyncStorage.getItem('userName');

      if (!userId || !userRole) {
        setUser(null);
        setLoading(false);
        return null;
      }

      // Verify user exists via API
      try {
        const userData = await api.get(`/users/${userId}`);

        const currentUser: User = {
          userId,
          name: userName || userData.name || 'User',
          email: userData.email || '',
          role: userRole as 'admin' | 'user',
        };

        setUser(currentUser);
        setLoading(false);
        return currentUser;
      } catch (error) {
        // If API fails (e.g. 404), sign out
        console.error('User verification failed:', error);
        await signOut();
        setLoading(false);
        return null;
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setUser(null);
      setLoading(false);
      return null;
    }
  };

  const signIn = async (userId: string, role: string) => {
    try {
      // Get user data from API
      const userData = await api.get(`/users/${userId}`);

      // Store in AsyncStorage
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('userRole', role);
      await AsyncStorage.setItem('userName', userData.name || 'User');

      const currentUser: User = {
        userId,
        name: userData.name || 'User',
        email: userData.email || '',
        role: role as 'admin' | 'user',
      };

      setUser(currentUser);



      // Navigation will be handled by useEffect
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.multiRemove(['userId', 'userRole', 'userName']);
      setUser(null);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}
