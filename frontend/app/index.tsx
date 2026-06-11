import { wp, hp } from '../utils/responsive';
import { rf } from '../utils/fonts';
import { useEffect } from 'react';
import {
  Image,
  StyleSheet,
  ActivityIndicator,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/login');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../assets/logo/vajihi-scout-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator
        size="large"
        color="#5B4FCE"
        style={styles.loader}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Developed by
        </Text>

        <Text style={styles.footerName}>
          Mustafa Balasinorwala
        </Text>

        <Text style={styles.footerCopyright}>
          © 2026 Vajihi Scout Mumbra
        </Text>

        <Text style={styles.footerCopyright}>
          All Rights Reserved
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: wp(45),
    height: wp(45),
  },
  loader: {
    marginTop: hp(2),
  },
  footer: {
    position: 'absolute',
    bottom: hp(4),
    alignItems: 'center',
  },

  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: rf(11),
  },

  footerName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: rf(12),
    fontWeight: '600',
    marginTop: 2,
  },

  footerCopyright: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: rf(10),
    marginTop: 2,
  },
});
