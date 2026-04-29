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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';

interface AttendanceRecord {
  attendance_id: string;
  user_id: string;
  attendance_type: string;
  date: string;
  status: string;
  marked_by: string;
}

export default function AttendanceHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userId, userName, type } = params;
  
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  const fetchAttendanceHistory = async () => {
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(
        `${BACKEND_URL}/api/attendance/user/${userId}/${type}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (record: AttendanceRecord) => {
    Alert.alert(
      'Delete Attendance',
      `Delete ${record.status} record for ${record.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
              const response = await fetch(
                `${BACKEND_URL}/api/attendance/${record.attendance_id}`,
                {
                  method: 'DELETE',
                  credentials: 'include',
                }
              );

              if (response.ok) {
                Alert.alert('Success', 'Attendance deleted');
                fetchAttendanceHistory();
              } else {
                Alert.alert('Error', 'Failed to delete');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete');
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{userName as string}</Text>
          <Text style={styles.headerSubtitle}>{type} Attendance History</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {records.length > 0 ? (
          records.map((record) => (
            <View key={record.attendance_id} style={styles.recordCard}>
              <View style={styles.recordInfo}>
                <Text style={styles.recordDate}>{record.date}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    record.status === 'present' ? styles.presentBadge : styles.absentBadge,
                  ]}
                >
                  <Text style={styles.statusText}>{record.status.toUpperCase()}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(record)}
              >
                <Ionicons name="trash-outline" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No attendance records</Text>
          </View>
        )}
      </ScrollView>
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
    backgroundColor: '#5B4FCE',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#F8D57E',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  recordCard: {
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
  recordInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 12,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a2e',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  presentBadge: {
    backgroundColor: '#E8F5E9',
  },
  absentBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
