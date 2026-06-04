import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  user_id: string;
  username: string;
  its_no?: string;
  name: string;
  phone?: string;
  email_id?: string;
  picture?: string;
  role: string;
  tag?: string;

  age?: string;
  birth_date?: string;
  parent_contact?: string;
  instrument?: string;
  joining_year?: string;

  uniform_size?: string;

  permissions?: {
    attendance: boolean;
    inventory: boolean;
    fees: boolean;
    uniforms: boolean;
    members: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  const checkAuth = useCallback(async () => {
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

      // LOAD CACHED USER FIRST
      const storedUser = await AsyncStorage.getItem('user');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      const token = await AsyncStorage.getItem('session_token');

      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch(
        `${BACKEND_URL}/api/auth/me`,
        {
          method: 'GET',
          credentials: 'include',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const userData = await response.json();

        setUser(userData);

        await AsyncStorage.setItem(
          'user',
          JSON.stringify(userData)
        );
      } else {
        await AsyncStorage.removeItem('session_token');
        await AsyncStorage.removeItem('user');

        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);

      await AsyncStorage.removeItem('session_token');
      await AsyncStorage.removeItem('user');

      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

      const token = await AsyncStorage.getItem('session_token');

      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',

        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      await AsyncStorage.removeItem('session_token');
      await AsyncStorage.removeItem('user');

      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);

      await AsyncStorage.removeItem('session_token');
      await AsyncStorage.removeItem('user');

      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        setUser,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}