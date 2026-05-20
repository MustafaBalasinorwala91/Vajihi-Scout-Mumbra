import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';

export default function InventoryScreen() {
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

          {/* Background Overlay */}
          <View style={styles.overlayCircle1} />
          <View style={styles.overlayCircle2} />

          <MaterialCommunityIcons
            name="music-clef-treble"
            size={120}
            color="rgba(255,255,255,0.04)"
            style={styles.musicIcon1}
          />

          <Ionicons
            name="musical-notes"
            size={90}
            color="rgba(255,255,255,0.05)"
            style={styles.musicIcon2}
          />

          <View style={styles.headerTop}>

            <View>
              <Text style={styles.headerTitle}>
                Inventory
              </Text>

              <Text style={styles.headerSubtitle}>
                Manage instruments and band items
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

          {/* MANAGE INVENTORY CARD */}
          <TouchableOpacity activeOpacity={0.9}>

            <LinearGradient
              colors={['#7B4DFF', '#4B1DFF']}
              style={styles.manageCard}
            >

              <View style={styles.manageLeft}>

                <View style={styles.manageIcon}>
                  <Ionicons
                    name="add"
                    size={30}
                    color="#5B3DF5"
                  />
                </View>

                <View>
                  <Text style={styles.manageTitle}>
                    Manage Inventory
                  </Text>

                  <Text style={styles.manageSubtitle}>
                    Add new instrument or item
                  </Text>
                </View>

              </View>

              <Ionicons
                name="chevron-forward"
                size={30}
                color="#fff"
              />

            </LinearGradient>

          </TouchableOpacity>

          <View style={styles.wave} />

        </LinearGradient>

        {/* SUMMARY STATS */}
        <View style={styles.statsContainer}>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: '#EFE8FF' },
              ]}
            >
              <MaterialCommunityIcons
                name="cube-outline"
                size={24}
                color="#6C4DFF"
              />
            </View>

            <Text style={styles.statValue}>
              12
            </Text>

            <Text style={styles.statLabel}>
              Total Items
            </Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: '#E8FFF0' },
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color="#35C76F"
              />
            </View>

            <Text style={styles.statValue}>
              8
            </Text>

            <Text style={styles.statLabel}>
              Good Condition
            </Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: '#FFF3E2' },
              ]}
            >
              <Ionicons
                name="build-outline"
                size={24}
                color="#FF9800"
              />
            </View>

            <Text style={styles.statValue}>
              2
            </Text>

            <Text style={styles.statLabel}>
              Under Repair
            </Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: '#FFEAEA' },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={24}
                color="#FF4D4F"
              />
            </View>

            <Text style={styles.statValue}>
              2
            </Text>

            <Text style={styles.statLabel}>
              Needs Attention
            </Text>
          </View>

        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>

          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={22}
              color="#999"
            />

            <TextInput
              placeholder="Search instruments or items..."
              placeholderTextColor="#999"
              style={styles.searchInput}
            />
          </View>

          <TouchableOpacity style={styles.filterButton}>
            <Ionicons
              name="filter"
              size={22}
              color="#6C4DFF"
            />

            <Text style={styles.filterText}>
              Filter
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sortButton}>
            <Ionicons
              name="swap-vertical"
              size={22}
              color="#6C4DFF"
            />
          </TouchableOpacity>

        </View>

        {/* CATEGORY CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >

          <TouchableOpacity style={styles.activeChip}>
            <Ionicons
              name="grid"
              size={16}
              color="#fff"
            />

            <Text style={styles.activeChipText}>
              All Items
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chip}>
            <Ionicons
              name="musical-notes"
              size={16}
              color="#222"
            />

            <Text style={styles.chipText}>
              Instruments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chip}>
            <Ionicons
              name="headset"
              size={16}
              color="#222"
            />

            <Text style={styles.chipText}>
              Accessories
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chip}>
            <FontAwesome5
              name="tshirt"
              size={14}
              color="#222"
            />

            <Text style={styles.chipText}>
              Uniform Items
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chip}>
            <Ionicons
              name="briefcase-outline"
              size={16}
              color="#222"
            />

            <Text style={styles.chipText}>
              Others
            </Text>
          </TouchableOpacity>

        </ScrollView>

        {/* INVENTORY ITEMS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Inventory Items
          </Text>

          <TouchableOpacity>
            <Text style={styles.viewAll}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {/* ITEM CARD */}
        <TouchableOpacity
          style={styles.itemCard}
          activeOpacity={0.9}
        >

          <View style={styles.itemImageContainer}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/3659/3659898.png',
              }}
              style={styles.itemImage}
            />
          </View>

          <View style={styles.itemDetails}>

            <Text style={styles.itemTitle}>
              Drum
            </Text>

            <Text style={styles.itemCategory}>
              Percussion Instrument
            </Text>

            <View style={styles.holderRow}>
              <Ionicons
                name="person-outline"
                size={16}
                color="#6C4DFF"
              />

              <Text style={styles.holderText}>
                Holder: Mustu
              </Text>
            </View>

            <View style={styles.bottomRow}>

              <View style={styles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color="#888"
                />

                <Text style={styles.dateText}>
                  Added: 12 Apr 2025
                </Text>
              </View>

            </View>

          </View>

          <View style={styles.rightSection}>

            <View style={styles.goodBadge}>
              <Text style={styles.goodText}>
                GOOD
              </Text>
            </View>

            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>
                x2
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color="#6C4DFF"
              style={{ marginTop: 18 }}
            />

          </View>

        </TouchableOpacity>

        {/* SECOND ITEM */}
        <TouchableOpacity
          style={styles.itemCard}
          activeOpacity={0.9}
        >

          <View style={styles.itemImageContainer}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
              }}
              style={styles.itemImage}
            />
          </View>

          <View style={styles.itemDetails}>

            <Text style={styles.itemTitle}>
              Trumpet
            </Text>

            <Text style={styles.itemCategory}>
              Brass Instrument
            </Text>

            <View style={styles.holderRow}>
              <Ionicons
                name="person-outline"
                size={16}
                color="#6C4DFF"
              />

              <Text style={styles.holderText}>
                Holder: Rehan
              </Text>
            </View>

            <View style={styles.dateRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color="#888"
              />

              <Text style={styles.dateText}>
                Added: 10 Apr 2025
              </Text>
            </View>

          </View>

          <View style={styles.rightSection}>

            <View style={styles.goodBadge}>
              <Text style={styles.goodText}>
                GOOD
              </Text>
            </View>

            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>
                x1
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color="#6C4DFF"
              style={{ marginTop: 18 }}
            />

          </View>

        </TouchableOpacity>

        {/* THIRD ITEM */}
        <TouchableOpacity
          style={styles.itemCard}
          activeOpacity={0.9}
        >

          <View style={styles.itemImageContainer}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/5234/5234421.png',
              }}
              style={styles.itemImage}
            />
          </View>

          <View style={styles.itemDetails}>

            <Text style={styles.itemTitle}>
              Drum Sticks
            </Text>

            <Text style={styles.itemCategory}>
              Accessory
            </Text>

            <View style={styles.holderRow}>
              <Ionicons
                name="person-outline"
                size={16}
                color="#6C4DFF"
              />

              <Text style={styles.holderText}>
                Holder: N/A
              </Text>
            </View>

            <View style={styles.dateRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color="#888"
              />

              <Text style={styles.dateText}>
                Added: 08 Apr 2025
              </Text>
            </View>

          </View>

          <View style={styles.rightSection}>

            <View style={styles.repairBadge}>
              <Text style={styles.repairText}>
                UNDER REPAIR
              </Text>
            </View>

            <View style={styles.orangeQtyBadge}>
              <Text style={styles.orangeQtyText}>
                x3
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color="#6C4DFF"
              style={{ marginTop: 18 }}
            />

          </View>

        </TouchableOpacity>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },

  header: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 140,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    position: 'relative',
  },

  overlayCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -80,
    right: -120,
  },

  overlayCircle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -50,
    left: -80,
  },

  musicIcon1: {
    position: 'absolute',
    top: 20,
    right: 40,
  },

  musicIcon2: {
    position: 'absolute',
    top: 80,
    right: 120,
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
    color: '#E9DDFF',
    fontSize: 17,
    marginTop: 10,
  },

  bellButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
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
    backgroundColor: '#FF4D4F',
  },

  manageCard: {
    marginTop: 28,
    borderRadius: 30,
    padding: 24,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    shadowColor: '#6C4DFF',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },

  manageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  manageIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },

  manageTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },

  manageSubtitle: {
    color: '#E9DDFF',
    marginTop: 6,
    fontSize: 15,
  },

  wave: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    right: -20,
    height: 80,
    backgroundColor: '#F6F7FB',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },

  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -80,
  },

  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 16,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },

  statIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  statValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#16162E',
  },

  statLabel: {
    marginTop: 6,
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },

  searchBar: {
    flex: 1,
    height: 58,
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
    flex: 1,
    marginLeft: 10,
    color: '#111',
  },

  filterButton: {
    height: 58,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#F5EDFF',
    marginLeft: 10,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterText: {
    marginLeft: 6,
    color: '#6C4DFF',
    fontWeight: '700',
  },

  sortButton: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#F5EDFF',
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  categoryContainer: {
    paddingHorizontal: 20,
    marginTop: 18,
    paddingBottom: 8,
  },

  activeChip: {
    backgroundColor: '#5B3DF5',
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },

  activeChipText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },

  chip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ECECEC',
    paddingHorizontal: 18,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },

  chipText: {
    marginLeft: 8,
    color: '#222',
    fontWeight: '600',
  },

  sectionHeader: {
    marginTop: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16162E',
  },

  viewAll: {
    color: '#5B3DF5',
    fontWeight: '700',
    fontSize: 16,
  },

  itemCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 28,
    padding: 16,

    flexDirection: 'row',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },

  itemImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 22,
    backgroundColor: '#F5EDFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  itemImage: {
    width: 58,
    height: 58,
    resizeMode: 'contain',
  },

  itemDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },

  itemTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16162E',
  },

  itemCategory: {
    color: '#777',
    marginTop: 4,
    fontSize: 15,
  },

  holderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  bottomRow: {
    marginTop: 6,
  },

  holderText: {
    marginLeft: 6,
    color: '#555',
    fontSize: 15,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  dateText: {
    marginLeft: 6,
    color: '#777',
    fontSize: 14,
  },

  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  goodBadge: {
    backgroundColor: '#E8FFF0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },

  goodText: {
    color: '#35C76F',
    fontWeight: '800',
    fontSize: 13,
  },

  repairBadge: {
    backgroundColor: '#FFF3E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },

  repairText: {
    color: '#FF9800',
    fontWeight: '800',
    fontSize: 12,
  },

  qtyBadge: {
    borderWidth: 1.5,
    borderColor: '#35C76F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },

  qtyText: {
    color: '#35C76F',
    fontWeight: '800',
  },

  orangeQtyBadge: {
    borderWidth: 1.5,
    borderColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },

  orangeQtyText: {
    color: '#FF9800',
    fontWeight: '800',
  },

});