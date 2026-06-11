import { wp, hp } from '../utils/responsive';
import { rf } from '../utils/fonts';
import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    its_no: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    email_id: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (
      !formData.its_no ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.name ||
      !formData.phone ||
      !formData.email_id
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email_id)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!passwordRegex.test(formData.password)) {
      Alert.alert(
        'Weak Password',
        'Password must contain:\n• 8+ characters\n• Uppercase letter\n• Lowercase letter\n• Number\n• Special character'
      );
      return;
    }

    setLoading(true);

    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          its_no: formData.its_no,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          email_id: formData.email_id,
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Success',
          'Account created successfully! Please login.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      } else {
        const error = await response.json();

        console.log('Signup Error:', error);

        Alert.alert(
          'Signup Failed',
          error.detail || 'Unable to create account'
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert(
        'Error',
        'Failed to create account. Please try again.'
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

        <Text style={styles.title}>Join Vajihi Scout</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        <View style={styles.signupCard}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="card-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="ITS No. *"
              placeholderTextColor="#999"
              value={formData.its_no}
              onChangeText={(text) =>
                setFormData({ ...formData, its_no: text })
              }
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor="#999"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              placeholderTextColor="#999"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email ID *"
              placeholderTextColor="#999"
              value={formData.email_id}
              onChangeText={(text) =>
                setFormData({ ...formData, email_id: text })
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password *"
              placeholderTextColor="#999"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
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

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              placeholderTextColor="#999"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.loginLink}>Login</Text>
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
    padding: wp(5),
    paddingVertical: hp(5),
  },

  logo: {
    width: wp(30),
    height: wp(30),
    maxWidth: 140,
    maxHeight: 140,
    marginBottom: hp(2),
  },

  title: {
    fontSize: rf(26),
    fontWeight: 'bold',
    color: '#F8D57E',
    textAlign: 'center',
    marginBottom: hp(1),
  },

  subtitle: {
    fontSize: rf(14),
    color: '#F8D57E',
    textAlign: 'center',
    marginBottom: hp(3),
  },

  signupCard: {
    backgroundColor: '#ffffff',
    borderRadius: wp(4),
    padding: wp(6),

    width: '100%',
    maxWidth: 450,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#ddd',

    borderRadius: wp(3),

    marginBottom: hp(2),

    paddingHorizontal: wp(3),

    backgroundColor: '#f9f9f9',
  },

  inputIcon: {
    marginRight: wp(2),
  },

  input: {
    flex: 1,

    paddingVertical: hp(1.8),

    fontSize: rf(14),

    color: '#1a1a2e',
  },

  eyeIcon: {
    padding: wp(1),
  },

  signupButton: {
    backgroundColor: '#5B4FCE',

    paddingVertical: hp(1.8),
    paddingHorizontal: wp(6),

    borderRadius: wp(3),

    alignItems: 'center',

    marginTop: hp(1),
  },

  signupButtonText: {
    color: '#ffffff',
    fontSize: rf(15),
    fontWeight: '600',
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',

    marginTop: hp(2.5),

    flexWrap: 'wrap',
  },

  loginText: {
    fontSize: rf(13),
    color: '#666',
  },

  loginLink: {
    fontSize: rf(13),
    color: '#5B4FCE',
    fontWeight: '600',
  },
});