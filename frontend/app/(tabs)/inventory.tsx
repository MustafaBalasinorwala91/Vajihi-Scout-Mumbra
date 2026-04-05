import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface InventoryItem {
  item_id: string;
  name: string;
  category: string;
  quantity: number;
  condition: string;
  added_by: string;
  created_at: string;
}

export default function InventoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

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

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'good':
        return 'checkmark-circle';
      case 'needs_repair':
        return 'warning';
      case 'damaged':
        return 'close-circle';
      default:
        return 'help-circle';
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
      {isAdmin && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/admin/manage-inventory')}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Manage Inventory</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.scrollView}>
        {inventory.length > 0 ? (
          inventory.map((item) => (
            <View key={item.item_id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Ionicons name="musical-notes" size={24} color="#5B4FCE" />
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <View
                  style={[
                    styles.quantityBadge,
                    { backgroundColor: item.quantity > 0 ? '#4CAF50' : '#F44336' },
                  ]}
                >
                  <Text style={styles.quantityText}>x{item.quantity}</Text>
                </View>
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.conditionContainer}>
                  <Ionicons
                    name={getConditionIcon(item.condition) as any}
                    size={20}
                    color={getConditionColor(item.condition)}
                  />
                  <Text
                    style={[
                      styles.conditionText,
                      { color: getConditionColor(item.condition) },
                    ]}
                  >
                    {item.condition.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No instruments in inventory</Text>
            {isAdmin && (
              <Text style={styles.emptySubtext}>Tap the button above to add items</Text>
            )}
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
  quantityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quantityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
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
});
