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
import { Ionicons } from '@expo/vector-icons';

interface User {
  user_id: string;
  email: string;
  name: string;
  role: string;
  tag?: string;
}

const TAGS = [
  { value: 'captain', label: 'Captain', color: '#FFD700' },
  { value: 'vice_captain', label: 'Vice Captain', color: '#C0C0C0' },
  { value: 'band_in_charge', label: 'Band In Charge', color: '#5B4FCE' },
  { value: 'instrument_in_charge', label: 'Instrument In Charge', color: '#FF8C00' },
  { value: 'trainer', label: 'Trainer', color: '#32CD32' },
];

export default function AssignTagsScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
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
        const members = data.filter((u: User) => u.role !== 'admin');
        setUsers(members);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTag = async () => {
    if (!selectedUser || !selectedTag) {
      Alert.alert('Error', 'Please select a tag');
      return;
    }

    setSaving(true);
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/admin/assign-tag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          tag: selectedTag,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Tag assigned successfully');
        setModalVisible(false);
        setSelectedUser(null);
        setSelectedTag('');
        fetchUsers();
      } else {
        Alert.alert('Error', 'Failed to assign tag');
      }
    } catch (error) {
      console.error('Failed to assign tag:', error);
      Alert.alert('Error', 'Failed to assign tag');
    } finally {
      setSaving(false);
    }
  };

  const openTagModal = (user: User) => {
    setSelectedUser(user);
    setSelectedTag(user.tag || '');
    setModalVisible(true);
  };

  const getTagColor = (tag?: string) => {
    const tagObj = TAGS.find((t) => t.value === tag);
    return tagObj?.color || '#999';
  };

  const getTagLabel = (tag?: string) => {
    const tagObj = TAGS.find((t) => t.value === tag);
    return tagObj?.label || 'No Tag';
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
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#5B4FCE" />
        <Text style={styles.infoText}>
          Assign roles/tags to members to recognize their responsibilities
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {users.map((user) => (
          <TouchableOpacity key={user.user_id} style={styles.userCard} onPress={() => openTagModal(user)}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <View style={styles.tagContainer}>
              {user.tag ? (
                <View style={[styles.tagBadge, { backgroundColor: getTagColor(user.tag) }]}>
                  <Text style={styles.tagText}>{getTagLabel(user.tag)}</Text>
                </View>
              ) : (
                <Text style={styles.noTag}>No Tag</Text>
              )}
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tag Assignment Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Tag</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.memberName}>{selectedUser?.name}</Text>
              <Text style={styles.memberEmail}>{selectedUser?.email}</Text>

              <View style={styles.tagsContainer}>
                {TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag.value}
                    style={[
                      styles.tagOption,
                      selectedTag === tag.value && styles.tagOptionSelected,
                      { borderColor: tag.color },
                    ]}
                    onPress={() => setSelectedTag(tag.value)}
                  >
                    <View style={[styles.tagColorIndicator, { backgroundColor: tag.color }]} />
                    <Text
                      style={[
                        styles.tagOptionText,
                        selectedTag === tag.value && styles.tagOptionTextSelected,
                      ]}
                    >
                      {tag.label}
                    </Text>
                    {selectedTag === tag.value && (
                      <Ionicons name="checkmark-circle" size={24} color={tag.color} />
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[
                    styles.tagOption,
                    selectedTag === '' && styles.tagOptionSelected,
                    { borderColor: '#999' },
                  ]}
                  onPress={() => setSelectedTag('')}
                >
                  <View style={[styles.tagColorIndicator, { backgroundColor: '#999' }]} />
                  <Text
                    style={[
                      styles.tagOptionText,
                      selectedTag === '' && styles.tagOptionTextSelected,
                    ]}
                  >
                    Remove Tag
                  </Text>
                  {selectedTag === '' && <Ionicons name="checkmark-circle" size={24} color="#999" />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAssignTag}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Assign Tag</Text>
                )}
              </TouchableOpacity>
            </View>
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
    shadowOffset: { width: 0, height: 1 },
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
  modalBody: {
    padding: 16,
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
  saveButton: {
    backgroundColor: '#5B4FCE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
