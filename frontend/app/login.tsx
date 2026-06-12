import { wp, hp } from '../utils/responsive';
import { rf } from '../utils/fonts';
import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { saveUser } = useAuth();
  const [its_no, setITS_no] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!its_no || !password) {
      Alert.alert('Error', 'Please enter ITS_no and password');
      return;
    }
    console.log(
      'BACKEND URL:',
      process.env.EXPO_PUBLIC_BACKEND_URL
    );

    setLoading(true);
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: its_no,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        console.log(
          'LOGIN SUCCESS RESPONSE:',
          data
        );

        Alert.alert(
          'Success',
          'Login API successful'
        );

        await saveUser(
          data.user,
          data.session_token
        );

        console.log(
          'USER SAVED'
        );

        const savedToken =
          await AsyncStorage.getItem(
            'session_token'
          );

        console.log(
          'TOKEN IN STORAGE:',
          savedToken
        );

        Alert.alert(
          'Token Check',
          savedToken
            ? 'Token saved successfully'
            : 'Token NOT saved'
        );

        router.replace('/(tabs)/home');

        console.log(
          'ROUTER REPLACE CALLED'
        );
      } else {
        const error = await response.json();
        Alert.alert('Login Failed', error.detail || 'Invalid username or password');
      }
    } catch (error: any) {
      console.log(
        'LOGIN ERROR:',
        error
      );

      Alert.alert(
        'Login Error',
        JSON.stringify(error)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={require('../assets/logo/vajihi-scout-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}
          allowFontScaling={false}>Vajihi Scout Mumbra</Text>
        <Text style={styles.subtitle}
          allowFontScaling={false}>Scout & Band - BGMM</Text>
        <Text style={styles.tagline}
          allowFontScaling={false}>Long Live His Holiness</Text>

        <View style={styles.loginCard}>
          <Text style={styles.welcomeText}
            allowFontScaling={false}>Welcome!</Text>
          <Text style={styles.instructionText}
            allowFontScaling={false}>Sign in to your account</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ITS Number / Username"
              placeholderTextColor="#999"
              value={its_no}
              onChangeText={setITS_no}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}
                allowFontScaling={false}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}
              allowFontScaling={false}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}
              allowFontScaling={false}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signupLink}
                allowFontScaling={false}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: wp(38),
    height: wp(38),
    maxWidth: 180,
    maxHeight: 180,
    marginBottom: hp(2),
  },
  title: {
    fontSize: rf(28),
    fontWeight: 'bold',
    color: '#F8D57E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: rf(18),
    color: '#F8D57E',
    textAlign: 'center',
    marginBottom: 4,
  },
  tagline: {
    fontSize: rf(14),
    color: '#F8D57E',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeText: {
    fontSize: rf(24),
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: rf(14),
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a2e',
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#5B4FCE',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#5B4FCE',
    textDecorationLine: 'underline',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    fontSize: 14,
    color: '#5B4FCE',
    fontWeight: '600',
  },
});
