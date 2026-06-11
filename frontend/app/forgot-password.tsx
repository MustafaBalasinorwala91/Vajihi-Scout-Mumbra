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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [its_no, setITS_no] = useState('');
  const [otp, setOtp] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!its_no) {
      Alert.alert('Error', 'Enter ITS Number');
      return;
    }

    try {
      setLoading(true);

      const BACKEND_URL =
        process.env.EXPO_PUBLIC_BACKEND_URL;

      const response = await fetch(
        `${BACKEND_URL}/api/auth/send-reset-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: its_no,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);

        Alert.alert(
          'OTP Sent',
          'Please check your registered email.'
        );
      } else {
        Alert.alert(
          'Error',
          data.detail || 'Failed to send OTP'
        );
      }
    } catch {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert('Error', 'Enter OTP');
      return;
    }

    try {
      setLoading(true);

      const BACKEND_URL =
        process.env.EXPO_PUBLIC_BACKEND_URL;

      const response = await fetch(
        `${BACKEND_URL}/api/auth/verify-reset-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: its_no,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true);

        Alert.alert(
          'Success',
          'OTP verified successfully'
        );
      } else {
        Alert.alert(
          'Error',
          data.detail || 'Invalid OTP'
        );
      }
    } catch {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Error',
        'Passwords do not match'
      );
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(
        'Error',
        'Password must be at least 6 characters'
      );
      return;
    }

    try {
      setLoading(true);

      const BACKEND_URL =
        process.env.EXPO_PUBLIC_BACKEND_URL;

      const response = await fetch(
        `${BACKEND_URL}/api/auth/reset-password-with-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: its_no,
            otp,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Password reset successfully',
          [
            {
              text: 'Login',
              onPress: () =>
                router.replace('/login'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          data.detail ||
          'Failed to reset password'
        );
      }
    } catch {
      Alert.alert('Error', 'Network error');
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

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Reset your password using OTP verification
        </Text>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="ITS Number"
              placeholderTextColor="#999"
              value={its_no}
              keyboardType="numeric"
              maxLength={8}
              editable={!otpSent}
              onChangeText={setITS_no}
            />
          </View>

          {!otpSent && (
            <TouchableOpacity
              style={styles.button}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  Send OTP
                </Text>
              )}
            </TouchableOpacity>
          )}

          {otpSent && !otpVerified && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  placeholderTextColor="#999"
                  value={otp}
                  keyboardType="numeric"
                  maxLength={6}
                  onChangeText={setOtp}
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    Verify OTP
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {otpVerified && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowNewPassword(!showNewPassword)
                  }
                >
                  <Ionicons
                    name={
                      showNewPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  <Ionicons
                    name={
                      showConfirmPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    Reset Password
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.back()}
          >
            <Text style={styles.loginLinkText}>
              Back to Login
            </Text>
          </TouchableOpacity>
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
    width: wp(32),
    height: wp(32),
    maxWidth: 140,
    maxHeight: 140,
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
    fontSize: rf(14),
    color: '#F8D57E',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
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
    fontSize: rf(16),
    color: '#1a1a2e',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: '#5B4FCE',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: rf(16),
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    fontSize: rf(14),
    color: '#5B4FCE',
    fontWeight: '600',
  },
});
