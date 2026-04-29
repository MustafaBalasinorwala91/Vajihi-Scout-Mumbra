import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface User {
  user_id: string;
  email: string;
  name: string;
  role: string;
}

type AttendanceType = 'practice' | 'khidmat';

export default function MarkAttendanceScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AttendanceType>('practice');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceMap, setAttendanceMap] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

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
        // Filter out admin users
        const members = data.filter((u: User) => u.role !== 'admin');
        setUsers(members);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (userId: string, status: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [userId]: prev[userId] === status ? '' : status,
    }));
  };

  const markAllPresent = () => {
    const newMap: { [key: string]: string } = {};
    users.forEach((user) => {
      newMap[user.user_id] = 'present';
    });
    setAttendanceMap(newMap);
  };

  const markAllAbsent = () => {
    const newMap: { [key: string]: string } = {};
    users.forEach((user) => {
      newMap[user.user_id] = 'absent';
    });
    setAttendanceMap(newMap);
  };

  const clearAll = () => {
    setAttendanceMap({});
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      
      // Save attendance for each user
      const promises = Object.entries(attendanceMap).map(([userId, status]) => {
        if (!status) return Promise.resolve();
        
        return fetch(`${BACKEND_URL}/api/attendance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            user_id: userId,
            attendance_type: activeTab,
            date: selectedDate,
            status: status,
          }),
        });
      });

      await Promise.all(promises);
      Alert.alert('Success', 'Attendance marked successfully');
      setAttendanceMap({});
    } catch (error) {
      console.error('Failed to save attendance:', error);
      Alert.alert('Error', 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
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
      {/* Type Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'practice' && styles.activeTab]}
          onPress={() => setActiveTab('practice')}
        >
          <Text style={[styles.tabText, activeTab === 'practice' && styles.activeTabText]}>
            Practice
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'khidmat' && styles.activeTab]}
          onPress={() => setActiveTab('khidmat')}
        >
          <Text style={[styles.tabText, activeTab === 'khidmat' && styles.activeTabText]}>
            Khidmat
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Display */}
      <View style={styles.dateCard}>
        <Ionicons name="calendar" size={24} color="#5B4FCE" />
        <Text style={styles.dateText}>{format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickButton} onPress={markAllPresent}>
          <Ionicons name="checkmark-done" size={20} color="#4CAF50" />
          <Text style={[styles.quickButtonText, { color: '#4CAF50' }]}>All Present</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={markAllAbsent}>
          <Ionicons name="close-circle" size={20} color="#F44336" />
          <Text style={[styles.quickButtonText, { color: '#F44336' }]}>All Absent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={clearAll}>
          <Ionicons name="refresh" size={20} color="#666" />
          <Text style={[styles.quickButtonText, { color: '#666' }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Member List */}
      <ScrollView style={styles.scrollView}>
        {users.map((user) => (
          <View key={user.user_id} style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{user.name}</Text>
              <View style={styles.attendanceButtons}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    styles.presentButton,
                    attendanceMap[user.user_id] === 'present' && styles.statusButtonActive,
                  ]}
                  onPress={() => toggleAttendance(user.user_id, 'present')}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={attendanceMap[user.user_id] === 'present' ? '#fff' : '#4CAF50'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    styles.absentButton,
                    attendanceMap[user.user_id] === 'absent' && styles.statusButtonActive,
                  ]}
                  onPress={() => toggleAttendance(user.user_id, 'absent')}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={attendanceMap[user.user_id] === 'absent' ? '#fff' : '#F44336'}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => {
                Alert.alert(
                  'View History',
                  'View and manage attendance history for ' + user.name,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'View',
                      onPress: () => {
                        // Navigate to user attendance history
                        router.push({
                          pathname: '/admin/attendance-history',
                          params: { userId: user.user_id, userName: user.name, type: activeTab }
                        });
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="time-outline" size={20} color="#5B4FCE" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={saveAttendance}
        disabled={saving || Object.keys(attendanceMap).length === 0}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="save" size={24} color="#fff" />
            <Text style={styles.saveButtonText}>Save Attendance</Text>
          </>
        )}
      </TouchableOpacity>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#5B4FCE',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginLeft: 12,
  },
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a2e',
    flex: 1,
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
  },
  presentButton: {
    borderColor: '#4CAF50',
  },
  absentButton: {
    borderColor: '#F44336',
  },
  statusButtonActive: {
    backgroundColor: '#5B4FCE',
    borderColor: '#5B4FCE',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B4FCE',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
});
