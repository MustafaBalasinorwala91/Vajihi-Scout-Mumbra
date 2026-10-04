import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  user_id: string;
  email_id?: string;
  name: string;
  role: string;
  tag?: string;
}

interface Tag {
  tag_id: string;
  name: string;
  value: string;
  color: string;
  active: boolean;
}

export default function AssignTagsScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [selectedTag, setSelectedTag] = useState<string>('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchTags();
  }, []);

  // ==========================================
  // FETCH MEMBERS
  // ==========================================

  const fetchUsers = async () => {
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

      const token = await AsyncStorage.getItem('session_token');

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${BACKEND_URL}/api/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        const members = data.filter(
          (u: User) => u.role !== 'admin'
        );

        setUsers(members);
      } else {
        console.error(
          'Failed to fetch users:',
          response.status
        );
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH POSITIONS / TAGS
  // ==========================================

  const fetchTags = async () => {
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

      const token = await AsyncStorage.getItem('session_token');

      if (!token) return;

      const response = await fetch(
        `${BACKEND_URL}/api/tags`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        setTags(data);
      } else {
        console.error(
          'Failed to fetch positions:',
          response.status
        );
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  };

  // ==========================================
  // ASSIGN / REMOVE POSITION
  // ==========================================

  const handleAssignTag = async () => {
    if (!selectedUser) {
      Alert.alert(
        'Error',
        'Please select a member'
      );
      return;
    }

    setSaving(true);

    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

      const token = await AsyncStorage.getItem(
        'session_token'
      );

      if (!token) {
        Alert.alert(
          'Error',
          'Session expired. Please login again.'
        );
        return;
      }

      // ======================================
      // REMOVE POSITION
      // ======================================

      if (selectedTag === '') {
        const response = await fetch(
          `${BACKEND_URL}/api/admin/users/${selectedUser.user_id}/tag`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          Alert.alert(
            'Success',
            'Position removed successfully'
          );
        } else {
          const errorData =
            await response.json().catch(() => null);

          Alert.alert(
            'Error',
            errorData?.detail ||
            'Failed to remove position'
          );

          return;
        }
      }

      // ======================================
      // ASSIGN POSITION
      // ======================================

      else {
        const response = await fetch(
          `${BACKEND_URL}/api/admin/assign-tag`,
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              user_id: selectedUser.user_id,
              tag: selectedTag,
            }),
          }
        );

        if (response.ok) {
          Alert.alert(
            'Success',
            'Position assigned successfully'
          );
        } else {
          const errorData =
            await response.json().catch(() => null);

          Alert.alert(
            'Error',
            errorData?.detail ||
            'Failed to assign position'
          );

          return;
        }
      }

      // ======================================
      // REFRESH SCREEN
      // ======================================

      setModalVisible(false);

      setSelectedUser(null);

      setSelectedTag('');

      await fetchUsers();

    } catch (error) {
      console.error(
        'Failed to update position:',
        error
      );

      Alert.alert(
        'Error',
        'Something went wrong while updating the position'
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // OPEN POSITION MODAL
  // ==========================================

  const openTagModal = (user: User) => {
    setSelectedUser(user);

    setSelectedTag(user.tag || '');

    setModalVisible(true);
  };

  // ==========================================
  // GET POSITION COLOR
  // ==========================================

  const getTagColor = (tag?: string) => {
    const tagObj = tags.find(
      (t) => t.value === tag
    );

    return tagObj?.color || '#999';
  };

  // ==========================================
  // GET POSITION NAME
  // ==========================================

  const getTagLabel = (tag?: string) => {
    const tagObj = tags.find(
      (t) => t.value === tag
    );

    return tagObj?.name || 'No Position';
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#5B4FCE"
        />
      </View>
    );
  }

  // ==========================================
  // MAIN SCREEN
  // ==========================================

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#32166F', '#5B3FE8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={28}
              color="#fff"
            />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Assign Positions
            </Text>

            <Text style={styles.headerSubtitle}>
              Manage member positions and responsibilities
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Information Card */}

      <View style={styles.infoCard}>

        <Ionicons
          name="information-circle"
          size={24}
          color="#5B4FCE"
        />

        <Text style={styles.infoText}>
          Assign positions to members based on
          their responsibilities
        </Text>

      </View>


      {/* Members List */}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >

        {users.map((user) => (

          <TouchableOpacity
            key={user.user_id}
            style={styles.userCard}
            onPress={() =>
              openTagModal(user)
            }
            activeOpacity={0.75}
          >

            {/* Member Information */}

            <View style={styles.userInfo}>

              <Text style={styles.userName}>
                {user.name}
              </Text>

              <Text style={styles.userEmail}>
                {user.email_id}
              </Text>

            </View>


            {/* Current Position */}

            <View style={styles.tagContainer}>

              {user.tag ? (

                <View
                  style={[
                    styles.tagBadge,
                    {
                      backgroundColor:
                        getTagColor(user.tag),
                    },
                  ]}
                >

                  <Text style={styles.tagText}>
                    {getTagLabel(user.tag)}
                  </Text>

                </View>

              ) : (

                <Text style={styles.noTag}>
                  No Position
                </Text>

              )}

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#666"
              />

            </View>

          </TouchableOpacity>

        ))}

      </ScrollView>


      {/* Position Management Modal */}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setModalVisible(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.modalContent}>

            {/* Modal Header */}

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>
                Manage Position
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setModalVisible(false)
                }
              >

                <Ionicons
                  name="close"
                  size={28}
                  color="#666"
                />

              </TouchableOpacity>

            </View>


            {/* Modal Body */}

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={
                styles.modalScrollContent
              }
              showsVerticalScrollIndicator={false}
            >

              {/* Selected Member */}

              <Text style={styles.memberName}>
                {selectedUser?.name}
              </Text>

              <Text style={styles.memberEmail}>
                {selectedUser?.email_id}
              </Text>


              {/* Position List */}

              <View style={styles.tagsContainer}>

                {tags.map((tag) => (

                  <TouchableOpacity
                    key={tag.value}
                    style={[
                      styles.tagOption,

                      selectedTag === tag.value &&
                      styles.tagOptionSelected,

                      {
                        borderColor:
                          tag.color,
                      },
                    ]}
                    onPress={() =>
                      setSelectedTag(
                        tag.value
                      )
                    }
                    activeOpacity={0.75}
                  >

                    {/* Color Indicator */}

                    <View
                      style={[
                        styles.tagColorIndicator,
                        {
                          backgroundColor:
                            tag.color,
                        },
                      ]}
                    />


                    {/* Position Name */}

                    <Text
                      style={[
                        styles.tagOptionText,

                        selectedTag ===
                        tag.value &&
                        styles.tagOptionTextSelected,
                      ]}
                    >
                      {tag.name}
                    </Text>


                    {/* Selected Icon */}

                    {selectedTag ===
                      tag.value && (

                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={tag.color}
                        />

                      )}

                  </TouchableOpacity>

                ))}


                {/* Remove Position */}

                <TouchableOpacity
                  style={[
                    styles.tagOption,

                    selectedTag === '' &&
                    styles.tagOptionSelected,

                    {
                      borderColor: '#999',
                    },
                  ]}
                  onPress={() =>
                    setSelectedTag('')
                  }
                  activeOpacity={0.75}
                >

                  <View
                    style={[
                      styles.tagColorIndicator,
                      {
                        backgroundColor:
                          '#999',
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.tagOptionText,

                      selectedTag === '' &&
                      styles.tagOptionTextSelected,
                    ]}
                  >
                    Remove Position
                  </Text>

                  {selectedTag === '' && (

                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#999"
                    />

                  )}

                </TouchableOpacity>

              </View>


              {/* Save Button */}

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  saving &&
                  styles.saveButtonDisabled,
                ]}
                onPress={handleAssignTag}
                disabled={saving}
                activeOpacity={0.8}
              >

                {saving ? (

                  <ActivityIndicator
                    color="#fff"
                  />

                ) : (

                  <Text
                    style={styles.saveButtonText}
                  >
                    {selectedTag
                      ? 'Assign Position'
                      : 'Remove Position'}
                  </Text>

                )}

              </TouchableOpacity>

            </ScrollView>

          </View>

        </View>

      </Modal>

    </View>
  );
}


// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 70,
    paddingBottom: 35,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    marginTop: 5,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },


  // ========================================
  // INFORMATION CARD
  // ========================================

  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  infoText: {
    fontSize: 14,
    color: '#1565C0',
    marginLeft: 12,
    flex: 1,
  },


  // ========================================
  // MEMBERS LIST
  // ========================================

  scrollView: {
    flex: 1,
  },

  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    backgroundColor: '#fff',

    marginHorizontal: 16,
    marginBottom: 8,

    padding: 16,

    borderRadius: 12,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,

    elevation: 1,
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },

  userEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  noTag: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },


  // ========================================
  // MODAL
  // ========================================

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

  modalScroll: {
    flexGrow: 0,
  },

  modalScrollContent: {
    padding: 16,
    paddingBottom: 24,
  },

  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
  },

  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },


  // ========================================
  // POSITION OPTIONS
  // ========================================

  tagsContainer: {
    gap: 12,
  },

  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: 16,

    borderRadius: 12,

    borderWidth: 2,

    backgroundColor: '#fff',
  },

  tagOptionSelected: {
    backgroundColor: '#f5f5f5',
  },

  tagColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },

  tagOptionText: {
    fontSize: 16,
    color: '#1a1a2e',
    flex: 1,
  },

  tagOptionTextSelected: {
    fontWeight: '600',
  },


  // ========================================
  // SAVE BUTTON
  // ========================================

  saveButton: {
    backgroundColor: '#5B4FCE',

    padding: 16,

    borderRadius: 8,

    alignItems: 'center',

    marginTop: 24,
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

});