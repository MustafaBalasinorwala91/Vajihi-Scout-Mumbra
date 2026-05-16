import React, { useState } from 'react';
import BadgeCard from '../../components/BadgeCard';
import FavouriteItem from '../../components/FavouriteItem';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { user, logout, checkAuth } = useAuth();
  const router = useRouter();

  const profileImage = user?.picture || null;
  const bio = "Music is not what I do, it’s who I am. 🎵";

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    its_no: user?.its_no || '',
    name: user?.name || '',
    phone: user?.phone || '',
    email_id: user?.email_id || '',
    picture: user?.picture || '',
    age: user?.age || '',
    birth_date: user?.birth_date || '',
    parent_contact: user?.parent_contact || '',
    instrument: user?.instrument || '',
    joining_year: user?.joining_year || '',
  });

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant gallery permission');
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
      setFormData({
        ...formData,
        picture: `data:image/jpeg;base64,${result.assets[0].base64}`,
      });
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
      console.log(error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
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

  const badges = [
    {
      id: '1',
      title: 'Active Member',
      icon: 'shield-checkmark',
      type: 'ionicons',
      color: '#6C4DFF',
      locked: false,
    },

    {
      id: '2',
      title: 'Rhythm Master',
      icon: 'music',
      type: 'fontawesome',
      color: '#FF6B6B',
      locked: false,
    },

    {
      id: '3',
      title: 'Team Player',
      icon: 'account-group',
      type: 'material',
      color: '#31C7B7',
      locked: false,
    },

    {
      id: '4',
      title: 'Rising Star',
      icon: 'star',
      type: 'ionicons',
      color: '#FFB020',
      locked: true,
    },

    {
      id: '5',
      title: 'Stage Performer',
      icon: 'microphone',
      type: 'fontawesome',
      color: '#FF5DA2',
      locked: false,
    },

    {
      id: '6',
      title: 'Dedicated Member',
      icon: 'trophy',
      type: 'ionicons',
      color: '#5B4FCE',
      locked: false,
    },

    {
      id: '7',
      title: 'Band Leader',
      icon: 'crown',
      type: 'material',
      color: '#FFA726',
      locked: true,
    },

    {
      id: '8',
      title: 'Music Enthusiast',
      icon: 'musical-notes',
      type: 'ionicons',
      color: '#7B61FF',
      locked: false,
    },
  ];

  const favourites = [
    {
      id: '1',
      title: 'Songs',
      icon: 'musical-notes',
      type: 'ionicons',
      color: '#6C4DFF',
    },

    {
      id: '2',
      title: 'Bands',
      icon: 'account-group',
      type: 'material',
      color: '#31C7B7',
    },

    {
      id: '3',
      title: 'Artists',
      icon: 'microphone',
      type: 'fontawesome',
      color: '#FF5DA2',
    },

    {
      id: '4',
      title: 'Albums',
      icon: 'disc',
      type: 'ionicons',
      color: '#FFA726',
    },

    {
      id: '5',
      title: 'Playlists',
      icon: 'list',
      type: 'ionicons',
      color: '#5B4FCE',
    },

    {
      id: '6',
      title: 'Events',
      icon: 'calendar',
      type: 'ionicons',
      color: '#FF6B6B',
    },
  ];

  const InfoField = ({
    icon,
    label,
    value,
    keyName,
    keyboard = 'default',
    placeholder,
  }: any) => (
    <View style={styles.infoItem}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={20} color="#5B4FCE" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>

        {editing ? (
          <TextInput
            style={styles.input}
            value={value}
            keyboardType={keyboard}
            placeholder={placeholder}
            placeholderTextColor="#999"
            onChangeText={(text) =>
              setFormData({
                ...formData,
                [keyName]: text,
              })
            }
          />
        ) : (
          <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 150 }}
    >
      <LinearGradient
        colors={['#4B2CCF', '#6C4DFF']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profile</Text>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={editing ? handlePickImage : undefined}
            style={styles.imageContainer}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="person" size={70} color="#bbb" />
              </View>
            )}

            {editing && (
              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.userInfoWrap}>
            <Text style={styles.userName}>{user?.name || 'Member'}</Text>

            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>MEMBER</Text>
            </View>

            <Text style={styles.bioText}>
              {bio}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
        >
          <View style={styles.statCard}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#fff" />
            <Text style={styles.statLabel}>Performance</Text>
            <Text style={styles.statValue}>Intermediate</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={24} color="#fff" />
            <Text style={styles.statLabel}>Member Since</Text>
            <Text style={styles.statValue}>{user?.joining_year || '2024'}</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="person-outline" size={24} color="#fff" />
            <Text style={styles.statLabel}>Role</Text>
            <Text style={styles.statValue}>{user?.instrument || 'Member'}</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="happy-outline" size={24} color="#fff" />
            <Text style={styles.statLabel}>Age</Text>
            <Text style={styles.statValue}>{user?.age || '--'}</Text>
          </View>
        </ScrollView>
      </LinearGradient>

      <View style={styles.mainContent}>
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Ionicons name="create-outline" size={24} color="#5B4FCE" />
              </TouchableOpacity>
            )}
          </View>

          <InfoField
            icon="card-outline"
            label="ITS Number"
            value={formData.its_no}
            keyName="its_no"
            keyboard="numeric"
            placeholder="Enter ITS Number"
          />

          <InfoField
            icon="person-outline"
            label="Name"
            value={formData.name}
            keyName="name"
            placeholder="Enter Name"
          />

          <InfoField
            icon="mail-outline"
            label="Email"
            value={formData.email_id}
            keyName="email_id"
            keyboard="email-address"
            placeholder="Enter Email"
          />

          <InfoField
            icon="call-outline"
            label="Phone"
            value={formData.phone}
            keyName="phone"
            keyboard="phone-pad"
            placeholder="Enter Phone"
          />

          <InfoField
            icon="calendar-outline"
            label="Age"
            value={formData.age}
            keyName="age"
            keyboard="numeric"
            placeholder="Enter Age"
          />

          <InfoField
            icon="gift-outline"
            label="Birth Date"
            value={formData.birth_date}
            keyName="birth_date"
            placeholder="DD/MM/YYYY"
          />

          <InfoField
            icon="people-outline"
            label="Parent Contact"
            value={formData.parent_contact}
            keyName="parent_contact"
            keyboard="phone-pad"
            placeholder="Enter Parent Contact"
          />

          <InfoField
            icon="musical-notes-outline"
            label="Instrument"
            value={formData.instrument}
            keyName="instrument"
            placeholder="Enter Instrument"
          />

          <InfoField
            icon="time-outline"
            label="Joining Year"
            value={formData.joining_year}
            keyName="joining_year"
            keyboard="numeric"
            placeholder="Enter Joining Year"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Attendance</Text>
            <Text style={styles.monthText}>This Month</Text>
          </View>

          <View style={styles.attendanceRow}>
            <View style={styles.attendanceCirclePurple}>
              <Text style={styles.attendancePercent}>92%</Text>
            </View>

            <View>
              <Text style={styles.attendanceTitle}>Duties</Text>
              <Text style={styles.attendanceSub}>12 / 13</Text>
            </View>
          </View>

          <View style={styles.attendanceRow}>
            <View style={styles.attendanceCircleGreen}>
              <Text style={styles.attendancePercent}>88%</Text>
            </View>

            <View>
              <Text style={styles.attendanceTitle}>Practices</Text>
              <Text style={styles.attendanceSub}>7 / 8</Text>
            </View>
          </View>

          <View style={styles.attendanceRow}>
            <View style={styles.attendanceCircleOrange}>
              <Text style={styles.attendancePercent}>85%</Text>
            </View>

            <View>
              <Text style={styles.attendanceTitle}>Khidmat</Text>
              <Text style={styles.attendanceSub}>17 / 20</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Badges</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {badges.map((badge) => (
              <BadgeCard
                key={badge.id}
                title={badge.title}
                icon={badge.icon}
                type={badge.type}
                color={badge.color}
                locked={badge.locked}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorites</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {favourites.map((item) => (
              <FavouriteItem
                key={item.id}
                title={item.title}
                icon={item.icon}
                type={item.type}
                color={item.color}
              />
            ))}
          </ScrollView>
        </View>

        {editing && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditing(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ff4d67" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },

  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  profileSection: {
    alignItems: 'center',
  },

  settingsButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 10,
  },

  imageContainer: {
    position: 'relative',
  },

  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#fff',
  },

  placeholderImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#5B4FCE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },

  userInfoWrap: {
    alignItems: 'center',
    marginTop: 18,
  },

  userName: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
  },

  memberBadge: {
    marginTop: 10,
    backgroundColor: '#45d0c1',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
  },

  memberBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  bioText: {
    marginTop: 14,
    color: '#eee',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 30,
  },

  statsContainer: {
    marginTop: 28,
    paddingRight: 20,
  },

  statCard: {
    width: 120,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 22,
    padding: 18,
    marginRight: 14,
    alignItems: 'center',
  },

  statLabel: {
    color: '#ddd',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },

  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },

  mainContent: {
    marginTop: -20,
    paddingHorizontal: 16,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  infoItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  infoIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#f1edff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  infoLabel: {
    color: '#777',
    fontSize: 13,
    marginBottom: 5,
  },

  infoValue: {
    color: '#1a1a2e',
    fontSize: 17,
    fontWeight: '600',
  },

  input: {
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    color: '#1a1a2e',
  },

  monthText: {
    color: '#5B4FCE',
    fontWeight: '700',
  },

  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  attendanceCirclePurple: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 6,
    borderColor: '#5B4FCE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },

  attendanceCircleGreen: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 6,
    borderColor: '#31c7b7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },

  attendanceCircleOrange: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 6,
    borderColor: '#ff8a34',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },

  attendancePercent: {
    fontWeight: '700',
    fontSize: 18,
    color: '#1a1a2e',
  },

  attendanceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  attendanceSub: {
    color: '#777',
    marginTop: 5,
  },

  badgeCard: {
    width: 110,
    alignItems: 'center',
    marginRight: 16,
  },

  badgeCardText: {
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
    color: '#1a1a2e',
    fontSize: 13,
  },

  favoriteItem: {
    alignItems: 'center',
    marginRight: 20,
  },

  favoriteCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f1edff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  favoriteText: {
    fontSize: 13,
    color: '#1a1a2e',
    fontWeight: '600',
  },

  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 18,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: '#eee',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginRight: 10,
  },

  saveButton: {
    flex: 1,
    backgroundColor: '#5B4FCE',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },

  cancelText: {
    color: '#666',
    fontWeight: '700',
    fontSize: 16,
  },

  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 50,
  },

  logoutText: {
    color: '#ff4d67',
    fontWeight: '700',
    fontSize: 17,
    marginLeft: 8,
  },
});