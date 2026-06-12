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
  badge?: string;

  age?: string;
  birth_date?: string;
  parent_contact?: string;
  instrument?: string;
  joining_year?: string;

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

  saveUser: (
    user: User,
    token: string
  ) => Promise<void>;

  logout: () => Promise<void>;

  checkAuth: () => Promise<void>;

  hasPermission: (
    permission:
      | 'attendance'
      | 'inventory'
      | 'fees'
      | 'uniforms'
      | 'members'
  ) => boolean;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  const saveUser = async (
    userData: User,
    token: string
  ) => {

    console.log('SAVE USER START');

    await AsyncStorage.setItem(
      'user',
      JSON.stringify(userData)
    );

    await AsyncStorage.setItem(
      'session_token',
      token
    );

    console.log(
      'SAVE USER COMPLETE',
      token
    );

    setUser(userData);
  };

  const hasPermission = (
    permission:
      | 'attendance'
      | 'inventory'
      | 'fees'
      | 'uniforms'
      | 'members'
  ) => {
    if (!user) return false;

    if (user.role === 'admin') return true;

    return (
      user.permissions?.[permission] ?? false
    );
  };

  const checkAuth = useCallback(async () => {

    try {
      const BACKEND_URL =
        process.env.EXPO_PUBLIC_BACKEND_URL;

      // Load cached user first
      const storedUser =
        await AsyncStorage.getItem('user');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }


      console.log('CHECK AUTH START');

      const token =
        await AsyncStorage.getItem(
          'session_token'
        );

      console.log('TOKEN FOUND:', token);

      console.log(
        'BACKEND URL:',
        BACKEND_URL
      );


      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${BACKEND_URL}/api/auth/me`,
        {
          method: 'GET',
          headers: {
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(
        'AUTH RESPONSE STATUS:',
        response.status
      );

      if (response.ok) {
        const userData =
          await response.json();

        console.log(
          'AUTH SUCCESS:',
          userData
        );

        setUser(userData);

        await AsyncStorage.setItem(
          'user',
          JSON.stringify(userData)
        );
      } else {
        console.log(
          'AUTH FAILED - REMOVING TOKEN'
        );

        await AsyncStorage.removeItem(
          'session_token'
        );

        await AsyncStorage.removeItem(
          'user'
        );

        setUser(null);

      }
    } catch (error) {
      console.error(
        'Auth check failed:',
        error
      );

      // DON'T logout user on network failure
      // Keep cached user
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      const BACKEND_URL =
        process.env.EXPO_PUBLIC_BACKEND_URL;

      const token =
        await AsyncStorage.getItem(
          'session_token'
        );

      if (token) {
        await fetch(
          `${BACKEND_URL}/api/auth/logout`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error(
        'Logout failed:',
        error
      );
    } finally {
      await AsyncStorage.removeItem(
        'session_token'
      );

      await AsyncStorage.removeItem(
        'user'
      );

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

        saveUser,

        logout,

        checkAuth,

        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}