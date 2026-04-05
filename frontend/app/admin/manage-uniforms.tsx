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

interface UniformItem {
  uniform_id: string;
  name: string;
  size: string;
  quantity: number;
  added_by: string;
}

export default function ManageUniformsScreen() {
  const [uniforms, setUniforms] = useState<UniformItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUniform, setSelectedUniform] = useState<UniformItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    size: 'M',
    quantity: '',
  });
  const [saving, setSaving] = useState(false);

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    fetchUniforms();
  }, []);

  const fetchUniforms = async () => {
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/uniforms`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUniforms(data);
      }
    } catch (error) {
      console.error('Failed to fetch uniforms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUniform = async () => {
    if (!formData.name || !formData.quantity) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/uniforms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          size: formData.size,
          quantity: parseInt(formData.quantity),
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Uniform added successfully');
        setModalVisible(false);
        resetForm();
        fetchUniforms();
      } else {
        Alert.alert('Error', 'Failed to add uniform');
      }
    } catch (error) {
      console.error('Failed to add uniform:', error);
      Alert.alert('Error', 'Failed to add uniform');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUniform = async () => {
    if (!selectedUniform || !formData.name || !formData.quantity) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/uniforms/${selectedUniform.uniform_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          size: formData.size,
          quantity: parseInt(formData.quantity),
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Uniform updated successfully');
        setModalVisible(false);
        resetForm();
        fetchUniforms();
      } else {
        Alert.alert('Error', 'Failed to update uniform');
      }
    } catch (error) {
      console.error('Failed to update uniform:', error);
      Alert.alert('Error', 'Failed to update uniform');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUniform = (uniform: UniformItem) => {
    Alert.alert('Delete Uniform', `Are you sure you want to delete "${uniform.name} - ${uniform.size}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
            const response = await fetch(`${BACKEND_URL}/api/uniforms/${uniform.uniform_id}`, {
              method: 'DELETE',
              credentials: 'include',
            });

            if (response.ok) {
              Alert.alert('Success', 'Uniform deleted successfully');
              fetchUniforms();
            } else {
              Alert.alert('Error', 'Failed to delete uniform');
            }
          } catch (error) {
            console.error('Failed to delete uniform:', error);
            Alert.alert('Error', 'Failed to delete uniform');
          }
        },
      },
    ]);
  };

  const openAddModal = () => {
    setEditMode(false);
    setSelectedUniform(null);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (uniform: UniformItem) => {
    setEditMode(true);
    setSelectedUniform(uniform);
    setFormData({
      name: uniform.name,
      size: uniform.size,
      quantity: uniform.quantity.toString(),
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      size: 'M',
      quantity: '',
    });
    setEditMode(false);
    setSelectedUniform(null);
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
        <Text style={styles.addButtonText}>Add New Uniform</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView}>
        {uniforms.length > 0 ? (
          uniforms.map((uniform) => (
            <View key={uniform.uniform_id} style={styles.uniformCard}>
              <View style={styles.uniformInfo}>
                <Ionicons name="shirt" size={24} color="#5B4FCE" />
                <View style={styles.uniformDetails}>
                  <Text style={styles.uniformName}>{uniform.name}</Text>
                  <Text style={styles.uniformSize}>Size: {uniform.size}</Text>
                  <Text style={styles.uniformQuantity}>Quantity: {uniform.quantity}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEditModal(uniform)} style={styles.actionButton}>
                  <Ionicons name="create-outline" size={20} color="#5B4FCE" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteUniform(uniform)} style={styles.actionButton}>
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="shirt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No uniforms available</Text>
            <Text style={styles.emptySubtext}>Tap the button above to add uniforms</Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Edit Uniform' : 'Add New Uniform'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Uniform Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., Scout Shirt, Band Jacket"
              />

              <Text style={styles.label}>Size</Text>
              <View style={styles.sizeButtons}>
                {sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeButton,
                      formData.size === size && styles.sizeButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, size })}
                  >
                    <Text
                      style={[
                        styles.sizeButtonText,
                        formData.size === size && styles.sizeButtonTextActive,
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                placeholder="0"
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={editMode ? handleUpdateUniform : handleAddUniform}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>{editMode ? 'Update' : 'Add'} Uniform</Text>
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
  uniformCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
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
  uniformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  uniformDetails: {
    marginLeft: 12,
    flex: 1,
  },
  uniformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  uniformSize: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  uniformQuantity: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
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
  sizeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  sizeButtonActive: {
    backgroundColor: '#5B4FCE',
    borderColor: '#5B4FCE',
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sizeButtonTextActive: {
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
