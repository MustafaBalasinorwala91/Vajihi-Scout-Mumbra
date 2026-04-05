import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setUser, checkAuth } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Get session_id from URL hash or params
        let sessionId = params.session_id as string;
        
        if (!sessionId && typeof window !== 'undefined') {
          const hash = window.location.hash;
          const match = hash.match(/session_id=([^&]+)/);
          if (match) {
            sessionId = match[1];
          }
        }

        if (!sessionId) {
          console.error('No session_id found');
          router.replace('/login');
          return;
        }

        // Exchange session_id for session_token
        const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
        const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange session');
        }

        const data = await response.json();
        setUser(data.user);

        // Navigate to home
        router.replace('/(tabs)/home');
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/login');
      }
    };

    processSession();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#5B4FCE" />
      <Text style={styles.text}>Authenticating...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#F8D57E',
    marginTop: 16,
    fontSize: 16,
  },
});
