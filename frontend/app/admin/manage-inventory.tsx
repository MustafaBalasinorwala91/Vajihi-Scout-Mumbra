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

interface InventoryItem {
  item_id: string;
  name: string;
  category: string;
  quantity: number;
  condition: string;
  added_by: string;
  created_at: string;
}

export default function ManageInventoryScreen() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    condition: 'good',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/inventory`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!formData.name || !formData.quantity) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          quantity: parseInt(formData.quantity),
          condition: formData.condition,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Item added successfully');
        setModalVisible(false);
        resetForm();
        fetchInventory();
      } else {
        Alert.alert('Error', 'Failed to add item');
      }
    } catch (error) {
      console.error('Failed to add item:', error);
      Alert.alert('Error', 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItem || !formData.name || !formData.quantity) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/inventory/${selectedItem.item_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          quantity: parseInt(formData.quantity),
          condition: formData.condition,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Item updated successfully');
        setModalVisible(false);
        resetForm();
        fetchInventory();
      } else {
        Alert.alert('Error', 'Failed to update item');
      }
    } catch (error) {
      console.error('Failed to update item:', error);
      Alert.alert('Error', 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = (item: InventoryItem) => {
    Alert.alert('Delete Item', `Are you sure you want to delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
            const response = await fetch(`${BACKEND_URL}/api/inventory/${item.item_id}`, {
              method: 'DELETE',
              credentials: 'include',
            });

            if (response.ok) {
              Alert.alert('Success', 'Item deleted successfully');
              fetchInventory();
            } else {
              Alert.alert('Error', 'Failed to delete item');
            }
          } catch (error) {
            console.error('Failed to delete item:', error);
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const openAddModal = () => {
    setEditMode(false);
    setSelectedItem(null);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditMode(true);
    setSelectedItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      condition: item.condition,
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: '',
      condition: 'good',
    });
    setEditMode(false);
    setSelectedItem(null);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good':
        return '#4CAF50';
      case 'needs_repair':
        return '#FF9800';
      case 'damaged':
        return '#F44336';
      default:
        return '#999';
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
      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add New Item</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView}>
        {inventory.length > 0 ? (
          inventory.map((item) => (
            <View key={item.item_id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Ionicons name="musical-notes" size={24} color="#5B4FCE" />
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
                    <Ionicons name="create-outline" size={20} color="#5B4FCE" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteItem(item)} style={styles.actionButton}>
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.itemDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity:</Text>
                  <Text style={styles.detailValue}>{item.quantity}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Condition:</Text>
                  <Text style={[styles.detailValue, { color: getConditionColor(item.condition) }]}>
                    {item.condition.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No items in inventory</Text>
            <Text style={styles.emptySubtext}>Tap the button above to add items</Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Edit Item' : 'Add New Item'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Item Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., Drum, Trumpet"
              />

              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                placeholder="0"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Condition</Text>
              <View style={styles.conditionButtons}>
                {['good', 'needs_repair', 'damaged'].map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    style={[
                      styles.conditionButton,
                      formData.condition === condition && styles.conditionButtonActive,
                      { borderColor: getConditionColor(condition) },
                    ]}
                    onPress={() => setFormData({ ...formData, condition })}
                  >
                    <Text
                      style={[
                        styles.conditionButtonText,
                        formData.condition === condition && { color: getConditionColor(condition) },
                      ]}
                    >
                      {condition.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={editMode ? handleUpdateItem : handleAddItem}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>{editMode ? 'Update' : 'Add'} Item</Text>
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
  addButton: {
    backgroundColor: '#5B4FCE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  itemCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    marginLeft: 12,
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  itemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
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
  conditionButtons: {
    gap: 8,
  },
  conditionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  conditionButtonActive: {
    backgroundColor: '#f5f5f5',
  },
  conditionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
