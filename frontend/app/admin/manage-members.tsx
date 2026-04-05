import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface User {
  user_id: string;
  username: string;
  name: string;
  phone?: string;
  picture?: string;
  role: string;
  tag?: string;
}

export default function ManageMembersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/users`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const members = data.filter((u: User) => u.role !== 'admin');
        setUsers(members);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewProfile = async (user: User) => {
    setSelectedUser(user);
    setLoadingProfile(true);
    setProfileModalVisible(true);

    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/admin/user-profile/${user.user_id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const deleteUser = (user: User) => {
    Alert.alert(
      'Delete Member',
      `Are you sure you want to delete ${user.name}? This will remove all their data including attendance, fees, and uniform assignments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
              const response = await fetch(`${BACKEND_URL}/api/admin/delete-user/${user.user_id}`, {
                method: 'DELETE',
                credentials: 'include',
              });

              if (response.ok) {
                Alert.alert('Success', 'Member deleted successfully');
                fetchUsers();
              } else {
                const error = await response.json();
                Alert.alert('Error', error.detail || 'Failed to delete member');
              }
            } catch (error) {
              console.error('Failed to delete user:', error);
              Alert.alert('Error', 'Failed to delete member');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B4FCE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Total Members: {users.length}</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {users.map((user) => (
          <View key={user.user_id} style={styles.userCard}>
            <View style={styles.userInfo}>
              {user.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color="#999" />
                </View>
              )}
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userUsername}>@{user.username}</Text>
                {user.tag && (
                  <Text style={styles.userTag}>{user.tag.replace('_', ' ').toUpperCase()}</Text>
                )}
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => viewProfile(user)}
              >
                <Ionicons name="eye" size={20} color="#5B4FCE" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => deleteUser(user)}
              >
                <Ionicons name="trash" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Profile Modal */}
      <Modal visible={profileModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Member Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            {loadingProfile ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#5B4FCE" />
              </View>
            ) : profileData ? (
              <ScrollView style={styles.modalBody}>
                {/* User Info */}
                <View style={styles.profileSection}>
                  {profileData.user.picture && (
                    <Image source={{ uri: profileData.user.picture }} style={styles.profileImage} />
                  )}
                  <Text style={styles.profileName}>{profileData.user.name}</Text>
                  <Text style={styles.profileUsername}>@{profileData.user.username}</Text>
                  {profileData.user.phone && (
                    <Text style={styles.profilePhone}>{profileData.user.phone}</Text>
                  )}
                </View>

                {/* Attendance Stats */}
                <View style={styles.statsSection}>
                  <Text style={styles.statsTitle}>Attendance</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Practice</Text>
                      <Text style={styles.statValue}>
                        {profileData.attendance.practice.percentage.toFixed(1)}%
                      </Text>
                      <Text style={styles.statDetail}>
                        {profileData.attendance.practice.present}/{profileData.attendance.practice.total}
                      </Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Khidmat</Text>
                      <Text style={styles.statValue}>
                        {profileData.attendance.khidmat.percentage.toFixed(1)}%
                      </Text>
                      <Text style={styles.statDetail}>
                        {profileData.attendance.khidmat.present}/{profileData.attendance.khidmat.total}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Fees Stats */}
                <View style={styles.statsSection}>
                  <Text style={styles.statsTitle}>Fees</Text>
                  <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
                      <Text style={styles.statLabel}>Paid</Text>
                      <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                        ₹{profileData.fees.total_paid}
                      </Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
                      <Text style={styles.statLabel}>Due</Text>
                      <Text style={[styles.statValue, { color: '#F44336' }]}>
                        ₹{profileData.fees.total_due}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Uniforms */}
                {profileData.uniforms.length > 0 && (
                  <View style={styles.statsSection}>
                    <Text style={styles.statsTitle}>Assigned Uniforms</Text>
                    {profileData.uniforms.map((item: any) => (
                      <View key={item.user_uniform_id} style={styles.uniformItem}>
                        <Text style={styles.uniformName}>{item.uniform.name}</Text>
                        <Text style={styles.uniformSize}>Size: {item.uniform.size}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  userUsername: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  userTag: {
    fontSize: 10,
    color: '#5B4FCE',
    marginTop: 4,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  modalBody: {
    padding: 16,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  profileUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsSection: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5B4FCE',
    marginTop: 8,
  },
  statDetail: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  uniformItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  uniformName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  uniformSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
