import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface FeeRecord {
  fee_id: string;
  user_id: string;
  month: string;
  amount: number;
  status: string;
  paid_date?: string;
}

interface FeesData {
  fees: FeeRecord[];
  total_due: number;
  total_paid: number;
}

export default function FeesScreen() {
  const { user } = useAuth();
  const [feesData, setFeesData] = useState<FeesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/fees/my`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setFeesData(data);
      }
    } catch (error) {
      console.error('Failed to fetch fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={styles.summaryValue}>₹{feesData?.total_paid || 0}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#F44336' }]}>
          <Text style={styles.summaryLabel}>Total Due</Text>
          <Text style={styles.summaryValue}>₹{feesData?.total_due || 0}</Text>
        </View>
      </View>

      {/* Fee Records */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fee History</Text>
        {feesData?.fees && feesData.fees.length > 0 ? (
          feesData.fees.map((fee) => (
            <View
              key={fee.fee_id}
              style={[
                styles.feeCard,
                fee.status === 'paid' ? styles.feeCardPaid : styles.feeCardDue,
              ]}
            >
              <View style={styles.feeHeader}>
                <Text style={styles.feeMonth}>{formatMonth(fee.month)}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    fee.status === 'paid'
                      ? styles.statusBadgePaid
                      : styles.statusBadgeDue,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {fee.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.feeDetails}>
                <Text style={styles.feeAmount}>₹{fee.amount}</Text>
                {fee.paid_date && (
                  <Text style={styles.paidDate}>Paid on: {fee.paid_date}</Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No fee records found</Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  feeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feeCardPaid: {
    borderLeftColor: '#4CAF50',
  },
  feeCardDue: {
    borderLeftColor: '#F44336',
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feeMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePaid: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeDue: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  feeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5B4FCE',
  },
  paidDate: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
