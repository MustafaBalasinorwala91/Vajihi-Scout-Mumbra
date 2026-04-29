import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface User {
  user_id: string;
  email: string;
  name: string;
  role: string;
}

interface FeeRecord {
  fee_id: string;
  user_id: string;
  month: string;
  amount: number;
  status: string;
  paid_date?: string;
}

export default function ManageFeesScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [feeData, setFeeData] = useState({
    month: format(new Date(), 'yyyy-MM'),
    amount: '',
    status: 'due',
    paid_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [generatingFees, setGeneratingFees] = useState(false);
  const [monthlyAmount, setMonthlyAmount] = useState('');

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

  const handleUpdateFee = async () => {
    if (!selectedUser || !feeData.amount) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/fees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          month: feeData.month,
          amount: parseFloat(feeData.amount),
          status: feeData.status,
          paid_date: feeData.status === 'paid' ? feeData.paid_date || format(new Date(), 'yyyy-MM-dd') : null,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Fee updated successfully');
        setModalVisible(false);
        setSelectedUser(null);
        setFeeData({
          month: format(new Date(), 'yyyy-MM'),
          amount: '',
          status: 'due',
          paid_date: '',
        });
      } else {
        Alert.alert('Error', 'Failed to update fee');
      }
    } catch (error) {
      console.error('Failed to update fee:', error);
      Alert.alert('Error', 'Failed to update fee');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateMonthlyFees = async () => {
    if (!monthlyAmount) {
      Alert.alert('Error', 'Please enter monthly fee amount');
      return;
    }

    Alert.alert(
      'Confirm',
      `Generate ₹${monthlyAmount} fee for all members for ${format(new Date(), 'MMMM yyyy')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setGeneratingFees(true);
            try {
              const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
              const month = format(new Date(), 'yyyy-MM');
              const response = await fetch(
                `${BACKEND_URL}/api/admin/generate-fees/${month}?amount=${parseFloat(monthlyAmount)}`,
                {
                  method: 'POST',
                  credentials: 'include',
                }
              );

              if (response.ok) {
                const result = await response.json();
                Alert.alert('Success', result.message);
                setMonthlyAmount('');
              } else {
                Alert.alert('Error', 'Failed to generate fees');
              }
            } catch (error) {
              console.error('Failed to generate fees:', error);
              Alert.alert('Error', 'Failed to generate fees');
            } finally {
              setGeneratingFees(false);
            }
          },
        },
      ]
    );
  };

  const openFeeModal = (user: User) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const handleDeleteFee = async (feeId: string) => {
    Alert.alert(
      'Delete Fee',
      'Are you sure you want to delete this fee record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
              const response = await fetch(`${BACKEND_URL}/api/fees/${feeId}`, {
                method: 'DELETE',
                credentials: 'include',
              });

              if (response.ok) {
                Alert.alert('Success', 'Fee record deleted');
                setModalVisible(false);
              } else {
                Alert.alert('Error', 'Failed to delete fee');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete fee');
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
      {/* Bulk Fee Generation */}
      <View style={styles.bulkSection}>
        <Text style={styles.sectionTitle}>Generate Monthly Fees</Text>
        <View style={styles.bulkInputContainer}>
          <TextInput
            style={styles.bulkInput}
            placeholder="Amount (₹)"
            keyboardType="numeric"
            value={monthlyAmount}
            onChangeText={setMonthlyAmount}
          />
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateMonthlyFees}
            disabled={generatingFees}
          >
            {generatingFees ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>Generate for All</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Members List */}
      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>Individual Fee Management</Text>
        {users.map((user) => (
          <TouchableOpacity
            key={user.user_id}
            style={styles.userCard}
            onPress={() => openFeeModal(user)}
          >
            <View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Fee Update Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Fee - {selectedUser?.name}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Month</Text>
              <TextInput
                style={styles.input}
                value={feeData.month}
                onChangeText={(text) => setFeeData({ ...feeData, month: text })}
                placeholder="YYYY-MM"
              />

              <Text style={styles.label}>Amount (₹)</Text>
              <TextInput
                style={styles.input}
                value={feeData.amount}
                onChangeText={(text) => setFeeData({ ...feeData, amount: text })}
                placeholder="0.00"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Status</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    feeData.status === 'due' && styles.statusButtonActive,
                  ]}
                  onPress={() => setFeeData({ ...feeData, status: 'due' })}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      feeData.status === 'due' && styles.statusButtonTextActive,
                    ]}
                  >
                    Due
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    feeData.status === 'paid' && styles.statusButtonActive,
                  ]}
                  onPress={() => setFeeData({ ...feeData, status: 'paid' })}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      feeData.status === 'paid' && styles.statusButtonTextActive,
                    ]}
                  >
                    Paid
                  </Text>
                </TouchableOpacity>
              </View>

              {feeData.status === 'paid' && (
                <>
                  <Text style={styles.label}>Paid Date</Text>
                  <TextInput
                    style={styles.input}
                    value={feeData.paid_date}
                    onChangeText={(text) => setFeeData({ ...feeData, paid_date: text })}
                    placeholder="YYYY-MM-DD (optional)"
                  />
                </>
              )}

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateFee}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
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
  bulkSection: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
    marginLeft: 16,
  },
  bulkInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  generateButton: {
    backgroundColor: '#5B4FCE',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#5B4FCE',
    borderColor: '#5B4FCE',
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  statusButtonTextActive: {
    color: '#fff',
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
