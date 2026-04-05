import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { user, logout, checkAuth } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    picture: user?.picture || '',
  });
  const [uniformSize, setUniformSize] = useState(user?.uniform_size || '');
  const [editingUniform, setEditingUniform] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const uniformSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to change profile picture');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setFormData({ ...formData, picture: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await checkAuth();
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUniform = async () => {
    setLoading(true);
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/profile/uniform`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ uniform_size: uniformSize }),
      });

      if (response.ok) {
        await checkAuth();
        setEditingUniform(false);
        Alert.alert('Success', 'Uniform size updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update uniform size');
      }
    } catch (error) {
      console.error('Failed to update uniform:', error);
      Alert.alert('Error', 'Failed to update uniform size');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? '#FF6B6B' : '#4ECDC4';
  };

  const getTagBadgeColor = (tag: string) => {
    const colors: any = {
      captain: '#FFD700',
      vice_captain: '#C0C0C0',
      band_in_charge: '#5B4FCE',
      instrument_in_charge: '#FF8C00',
      trainer: '#32CD32',
    };
    return colors[tag] || '#999';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={editing ? handlePickImage : undefined} style={styles.imageContainer}>
          {formData.picture ? (
            <Image source={{ uri: formData.picture }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person" size={60} color="#ccc" />
            </View>
          )}
          {editing && (
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { backgroundColor: getRoleBadgeColor(user?.role || 'member') }]}>
            <Text style={styles.badgeText}>{user?.role?.toUpperCase()}</Text>
          </View>
          {user?.tag && (
            <View style={[styles.badge, { backgroundColor: getTagBadgeColor(user.tag) }]}>
              <Text style={styles.badgeText}>{user.tag.replace('_', ' ').toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Ionicons name="create-outline" size={24} color="#5B4FCE" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter your name"
              />
            ) : (
              <Text style={styles.value}>{user?.name}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value}>{user?.phone || 'Not provided'}</Text>
            )}
          </View>
        </View>

        {editing && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setEditing(false);
                setFormData({
                  name: user?.name || '',
                  phone: user?.phone || '',
                  picture: user?.picture || '',
                });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSaveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Uniform Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Uniform Size</Text>
          {!editingUniform && (
            <TouchableOpacity onPress={() => setEditingUniform(true)}>
              <Ionicons name="create-outline" size={24} color="#5B4FCE" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoCard}>
          {editingUniform ? (
            <View>
              <View style={styles.sizeContainer}>
                {uniformSizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeButton,
                      uniformSize === size && styles.sizeButtonSelected,
                    ]}
                    onPress={() => setUniformSize(size)}
                  >
                    <Text
                      style={[
                        styles.sizeText,
                        uniformSize === size && styles.sizeTextSelected,
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setEditingUniform(false);
                    setUniformSize(user?.uniform_size || '');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSaveUniform}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.uniformSize}>
              {user?.uniform_size || 'Not set'}
            </Text>
          )}
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#F44336" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#5B4FCE',
    padding: 32,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5B4FCE',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#1a1a2e',
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#5B4FCE',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uniformSize: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5B4FCE',
    textAlign: 'center',
    paddingVertical: 20,
  },
  sizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  sizeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeButtonSelected: {
    backgroundColor: '#5B4FCE',
    borderColor: '#5B4FCE',
  },
  sizeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  sizeTextSelected: {
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 8,
  },
});
