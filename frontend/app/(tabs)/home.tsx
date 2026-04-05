import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalMembers: 0,
    presentToday: 0,
    pendingFees: 0,
    inventoryItems: 0,
  });

  const isAdmin = user?.role === 'admin';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? '#FF6B6B' : '#4ECDC4';
  };

  const getTagBadgeColor = (tag: string) => {
    const colors: any = {
      'captain': '#FFD700',
      'vice_captain': '#C0C0C0',
      'band_in_charge': '#5B4FCE',
      'instrument_in_charge': '#FF8C00',
      'trainer': '#32CD32',
    };
    return colors[tag] || '#999';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo/vajihi-scout-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appTitle}>Vajihi Scout Mumbra</Text>
        <Text style={styles.appSubtitle}>BGMM - Long Live His Holiness</Text>
      </View>

      {/* Welcome Card */}
      <View style={styles.welcomeCard}>
        <Text style={styles.greeting}>{getGreeting()}!</Text>
        <Text style={styles.userName}>{user?.name}</Text>
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

      {/* Quick Actions */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/admin/mark-attendance')}
            >
              <Ionicons name="checkmark-circle" size={32} color="#5B4FCE" />
              <Text style={styles.actionText}>Mark Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/admin/manage-fees')}
            >
              <Ionicons name="cash-outline" size={32} color="#5B4FCE" />
              <Text style={styles.actionText}>Manage Fees</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/admin/manage-inventory')}
            >
              <Ionicons name="construct" size={32} color="#5B4FCE" />
              <Text style={styles.actionText}>Manage Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/admin/assign-tags')}
            >
              <Ionicons name="pricetag" size={32} color="#5B4FCE" />
              <Text style={styles.actionText}>Assign Tags</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Member Quick Links */}
      {!isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/attendance')}
            >
              <Ionicons name="calendar" size={32} color="#5B4FCE" />
              <Text style={styles.actionText}>My Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/fees')}
            >
              <Ionicons name="cash" size={32} color="#5B4FCE" />
              <Text style={styles.actionText}>My Fees</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/inventory')}
            >
              <Ionicons name="musical-notes" size={32} color="#5B4FCE" />
              <Text style={styles.actionText}>Instruments</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="person" size={32} color="#5B4FCE" />
              <Text style={styles.actionText}>My Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8D57E',
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#F8D57E',
    textAlign: 'center',
    marginTop: 4,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});
