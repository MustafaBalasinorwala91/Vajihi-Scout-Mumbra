import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';

import { feeService, FeeRecord } from '../../services/FeeService';

export default function FeesScreen() {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [stats, setStats] = useState({
    totalPaid: 0,
    totalDue: 0,
    paidMembers: 0,
    dueMembers: 0,
    totalMembers: 0,
    collectionRate: 0,
    thisMonthDue: 0,
  });

  useEffect(() => {

    loadFees();

  }, [fees.length]);

  const loadFees = async () => {
    try {

      const data = await feeService.getAllFees();

      setFees(data);

      const calculatedStats =
        feeService.calculateStats(data);

      setStats(calculatedStats);

    } catch (error) {

      console.log('Failed to load fees:', error);

    } finally {

      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        {/* HEADER */}
        <LinearGradient
          colors={['#2B145A', '#5B3DF5']}
          style={styles.header}
        >

          <View style={styles.headerOverlay} />

          <View style={styles.headerTop}>

            <View>
              <Text style={styles.headerTitle}>
                Fees
              </Text>

              <Text style={styles.headerSubtitle}>
                Manage member fees and payments
              </Text>
            </View>

            <TouchableOpacity style={styles.bellButton}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#fff"
              />

              <View style={styles.notificationDot} />
            </TouchableOpacity>

          </View>

          <View style={styles.wave} />

        </LinearGradient>

        {/* SUMMARY CARDS */}
        <View style={styles.summaryContainer}>

          <LinearGradient
            colors={['#11998E', '#38EF7D']}
            style={styles.summaryCard}
          >

            <View style={styles.summaryIcon}>
              <Ionicons
                name="wallet-outline"
                size={26}
                color="#fff"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}
                numberOfLines={1}
                adjustsFontSizeToFit>
                Total Paid
              </Text>

              <Text style={styles.summaryAmount}
                numberOfLines={1}
                adjustsFontSizeToFit>
                ₹{stats.totalPaid}
              </Text>

              <Text style={styles.summarySubtitle}>
                {stats.paidMembers} Members
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={24}
              color="#fff"
            />

          </LinearGradient>

          <LinearGradient
            colors={['#FF416C', '#FF4B2B']}
            style={styles.summaryCard}
          >

            <View style={styles.summaryIcon}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={26}
                color="#fff"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>
                Total Due
              </Text>

              <Text style={styles.summaryAmount}
                numberOfLines={1}
                adjustsFontSizeToFit>
                ₹{stats.totalDue}
              </Text>

              <Text style={styles.summarySubtitle}>
                {stats.dueMembers} Members
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={24}
              color="#fff"
            />

          </LinearGradient>

        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.quickActions}>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('../admin/manage-fees')}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: '#6C4DFF' },
              ]}
            >
              <Ionicons
                name="person-add"
                size={22}
                color="#fff"
              />
            </View>

            <Text style={styles.actionText}>
              Add Payment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: '#2DA8FF' },
              ]}
            >
              <Ionicons
                name="document-text"
                size={22}
                color="#fff"
              />
            </View>

            <Text style={styles.actionText}>
              Fee Structure
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: '#FFB020' },
              ]}
            >
              <Ionicons
                name="notifications"
                size={22}
                color="#fff"
              />
            </View>

            <Text style={styles.actionText}>
              Reminders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: '#7A5AF8' },
              ]}
            >
              <Ionicons
                name="download"
                size={22}
                color="#fff"
              />
            </View>

            <Text style={styles.actionText}>
              Export
            </Text>
          </TouchableOpacity>

        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>

          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={20}
              color="#999"
            />

            <TextInput
              placeholder="Search member..."
              placeholderTextColor="#999"
              style={styles.searchInput}
            />
          </View>

          <TouchableOpacity style={styles.filterButton}>
            <Ionicons
              name="filter-outline"
              size={20}
              color="#6C4DFF"
            />

            <Text style={styles.filterText}>
              Filter
            </Text>
          </TouchableOpacity>

        </View>

        {/* REMINDER CARD */}
        <LinearGradient
          colors={['#F5EDFF', '#FFFFFF']}
          style={styles.reminderCard}
        >

          <View style={styles.reminderLeft}>

            <LinearGradient
              colors={['#7A5AF8', '#5B3DF5']}
              style={styles.reminderIcon}
            >
              <Ionicons
                name="notifications"
                size={24}
                color="#fff"
              />
            </LinearGradient>

            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.reminderTitle}>
                Send Fee Reminder
              </Text>

              <Text style={styles.reminderSubtitle}>
                Remind members who have pending dues
              </Text>
            </View>

          </View>

          <LinearGradient
            colors={['#7A5AF8', '#5B3DF5']}
            style={styles.sendButton}
          >

            <Ionicons
              name="paper-plane"
              size={16}
              color="#fff"
            />

            <Text style={styles.sendButtonText}>
              Send Now
            </Text>

          </LinearGradient>

        </LinearGradient>

        {/* HISTORY */}
        <View style={styles.historyCard}>

          <View style={styles.historyHeader}>

            <Text style={styles.historyTitle}>
              Fee History
            </Text>

            <TouchableOpacity>
              <Text style={styles.viewAll}>
                View All
              </Text>
            </TouchableOpacity>

          </View>

          {
            fees.length === 0 ? (

              <View style={styles.emptyContainer}>

                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={40}
                    color="#8B5CF6"
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  No fee records found
                </Text>

                <Text style={styles.emptySubtitle}>
                  Start by adding a payment or check back later.
                </Text>

              </View>

            ) : (

              fees.map((fee) => (

                <View
                  key={fee.fee_id}
                  style={{
                    backgroundColor: '#F8F7FF',
                    borderRadius: 20,
                    paddingVertical: 20, paddingHorizontal: 18,
                    marginTop: 16,
                  }}
                >

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >

                    <View>

                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: '#16162E',
                        }}
                      >
                        {fee.month}
                      </Text>

                      <Text
                        style={{
                          color: '#777',
                          marginTop: 4,
                        }}
                      >
                        Amount: ₹{fee.amount}
                      </Text>

                    </View>

                    <View
                      style={{
                        backgroundColor:
                          fee.status === 'paid'
                            ? '#D1FAE5'
                            : '#FFE4E6',

                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                      }}
                    >

                      <Text
                        style={{
                          color:
                            fee.status === 'paid'
                              ? '#059669'
                              : '#DC2626',

                          fontWeight: '700',
                        }}
                      >
                        {fee.status.toUpperCase()}
                      </Text>

                    </View>

                  </View>

                </View>

              ))

            )
          }
        </View>

        {/* BOTTOM STATS */}
        <View style={styles.statsContainer}>

          <View style={styles.statCard}>
            <Ionicons
              name="people"
              size={22}
              color="#6C4DFF"
            />

            <Text style={styles.statValue}>
              {stats.totalMembers}
            </Text>

            <Text style={styles.statLabel}>
              Total Members
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color="#38D39F"
            />

            <Text style={styles.statValue}>
              {stats.paidMembers}
            </Text>

            <Text style={styles.statLabel}>
              Paid Members
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="time"
              size={22}
              color="#FFB020"
            />

            <Text style={styles.statValue}>
              {stats.collectionRate.toFixed(0)}%
            </Text>

            <Text style={styles.statLabel}>
              Collection Rate
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="calendar"
              size={22}
              color="#FF5A5F"
            />

            <Text style={styles.statValue}>
              ₹{stats.thisMonthDue}
            </Text>

            <Text style={styles.statLabel}>
              This Month Due
            </Text>
          </View>

        </View>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },

  header: {
    paddingTop: 70,
    paddingHorizontal: 24,
    paddingBottom: 140,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },

  headerOverlay: {
    position: 'absolute',
    width: 350,
    height: 350,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 200,
    top: -120,
    right: -100,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: '#E5D9FF',
    fontSize: 17,
    marginTop: 10,
  },

  bellButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4B4B',
  },

  wave: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    right: -20,
    height: 80,
    backgroundColor: '#F5F6FA',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },

  summaryContainer: {
    marginTop: -90,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  summaryCard: {
    width: '48.5%',
    borderRadius: 28,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },

  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  summaryTitle: {
    color: '#fff',
    fontSize: 15,
  },

  summaryAmount: {
    color: '#fff',
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    marginTop: 4,
  },

  summarySubtitle: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    fontSize: 12,
  },

  quickActions: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 28,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },

  actionButton: {
    alignItems: 'center',
  },

  actionIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
  },

  searchContainer: {
    flexDirection: 'row',
    marginTop: 22,
    paddingHorizontal: 20,
  },

  searchBar: {
    flex: 1,
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },

  searchInput: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
    color: '#111',
  },

  filterButton: {
    width: 110,
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginLeft: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },

  filterText: {
    color: '#6C4DFF',
    fontWeight: '700',
    marginLeft: 8,
  },

  reminderCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '62%',
  },

  reminderIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  reminderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5B3DF5',
  },

  reminderSubtitle: {
    color: '#666',
    marginTop: 2,
    fontSize: 13,
  },

  sendButton: {
    height: 42,
    borderRadius: 16,
    paddingHorizontal: 14,
    width: 125,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },

  historyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 30,
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 24,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },

  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  historyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16162E',
  },

  viewAll: {
    color: '#6C4DFF',
    fontWeight: '700',
    fontSize: 16,
  },

  emptyContainer: {
    marginTop: 28,
    alignItems: 'center',
    paddingVertical: 30,
  },

  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F5EDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#555',
  },

  emptySubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
    lineHeight: 24,
  },

  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 10,
  },

  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    marginTop: 16,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },

  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#16162E',
    marginTop: 10,
  },

  statLabel: {
    marginTop: 6,
    color: '#666',
    fontSize: 15,
  },

});