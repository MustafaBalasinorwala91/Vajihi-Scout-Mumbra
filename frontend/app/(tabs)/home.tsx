import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import HeaderSection from '../../components/home/HeaderSection';
import WelcomeCard from '../../components/home/WelcomeCard';
import SummaryCard from '../../components/home/SummaryCard';
import QuickActionCard from '../../components/home/QuickActionCard';
import NotificationBell from '../../components/common/NotificationBell';

type ActionItem = {
  id: number;
  title: string;
  description: string;
  icon: string;
  colors: [string, string];
};

export default function HomeScreen() {
  const router = useRouter();
  const summaryData = [
    {
      id: 1,
      icon: 'people',
      value: '128',
      title: 'Members',
      subtitle: 'Total Members',
      color: '#7B61FF',
    },
    {
      id: 2,
      icon: 'checkmark-done',
      value: '96%',
      title: 'Attendance',
      subtitle: 'This Month',
      color: '#37C978',
    },
    {
      id: 3,
      icon: 'cash',
      value: '₹45K',
      title: 'Fees',
      subtitle: 'Collected',
      color: '#FFB547',
    },
    {
      id: 4,
      icon: 'clipboard',
      value: '24',
      title: 'Pending',
      subtitle: 'Tasks',
      color: '#55B6FF',
    },
  ];

  const quickActions = [
    {
      id: 1,
      title: 'Mark Attendance',
      description: 'Mark & manage member attendance',
      icon: 'checkmark-circle',
      colors: ['#5B3DF5', '#2B145A'] as [string, string],
      route: '/attendance',
    },

    {
      id: 2,
      title: 'Manage Fees',
      description: 'Collect & track member fees',
      icon: 'cash',
      colors: ['#6A3DFF', '#2B145A'] as [string, string],
      route: '/fees',
    },

    {
      id: 3,
      title: 'Manage Inventory',
      description: 'Track & manage inventory items',
      icon: 'construct',
      colors: ['#5B3DF5', '#32106E'] as [string, string],
      route: '/inventory',
    },

    {
      id: 4,
      title: 'Manage Uniforms',
      description: 'Add, update & track uniforms',
      icon: 'shirt',
      colors: ['#B13DFF', '#40107A'] as [string, string],
      route: '/uniforms',
    },

    {
      id: 5,
      title: 'Manage Members',
      description: 'Add, update & manage members',
      icon: 'people',
      colors: ['#6A3DFF', '#2B145A'] as [string, string],
      route: '/manage-members',
    },

    {
      id: 6,
      title: 'Assign Tags',
      description: 'Assign & manage member tags',
      icon: 'pricetag',
      colors: ['#8E2BFF', '#2B145A'] as [string, string],
      route: '/manage-tags',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 140,
        }}
      >
        {/* HEADER */}
        {/* HEADER */}
        <View style={styles.headerWrapper}>

          <HeaderSection />

        </View>

        {/* WELCOME CARD */}
        <WelcomeCard />

        {/* SUMMARY SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Overview
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingRight: 20,
            }}
          >
            {summaryData.map((item) => (
              <SummaryCard
                key={item.id}
                icon={item.icon}
                value={item.value}
                title={item.title}
                subtitle={item.subtitle}
                color={item.color}
              />
            ))}
          </ScrollView>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <View style={styles.quickHeader}>
            <Text style={styles.sectionTitle}>
              Quick Actions
            </Text>
          </View>

          <View style={styles.quickGrid}>
            {quickActions.map((item) => (
              <QuickActionCard
                key={item.id}
                icon={item.icon}
                title={item.title}
                description={item.description}
                colors={item.colors}
                onPress={() => {
                  if (item.route) {
                    router.push(item.route as any);
                  }
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerWrapper: {
    position: 'relative',
  },

  section: {
    marginTop: 26,
    paddingHorizontal: 18,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16162E',
    marginBottom: 20,
  },

  quickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  viewAll: {
    color: '#6C4DFF',
    fontWeight: '700',
    fontSize: 16,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});