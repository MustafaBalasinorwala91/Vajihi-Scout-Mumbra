import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface UniformItem {
  uniform_id: string;
  name: string;
  size: string;
  quantity: number;
}

export default function UniformsScreen() {
  const { user } = useAuth();
  const [uniforms, setUniforms] = useState<UniformItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B4FCE" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Uniforms Catalog</Text>
      {uniforms.length > 0 ? (
        uniforms.map((uniform) => (
          <View key={uniform.uniform_id} style={styles.uniformCard}>
            <Ionicons name="shirt" size={24} color="#5B4FCE" />
            <View style={styles.uniformInfo}>
              <Text style={styles.uniformName}>{uniform.name}</Text>
              <Text style={styles.uniformSize}>Size: {uniform.size}</Text>
            </View>
            <Text style={styles.quantity}>Qty: {uniform.quantity}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="shirt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No uniforms available</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  uniformCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uniformInfo: {
    flex: 1,
    marginLeft: 12,
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
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B4FCE',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
});
