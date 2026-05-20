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

export default function UniformsScreen() {

  const uniforms = [
    {
      id: 1,
      name: 'Shirt',
      category: 'Upper Body',
      sizes: 'L, M, S, XL',
      qty: 15,
      status: 'IN STOCK',
      image: require('../../assets/uniforms/shirt.webp'),
    },
    {
      id: 2,
      name: 'Cap',
      category: 'Head',
      sizes: 'Free',
      qty: 3,
      status: 'LOW STOCK',
      image: require('../../assets/uniforms/shirt.webp'),
    },
  ];

  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}

        <LinearGradient
          colors={['#2B145A', '#5B3DF5']}
          style={styles.header}
        >

          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>
                Uniforms
              </Text>

              <Text style={styles.headerSubtitle}>
                Manage uniform catalog and assignments
              </Text>
            </View>

            <TouchableOpacity style={styles.bellButton}>
              <Ionicons
                name="notifications-outline"
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          <MaterialCommunityIcons
            name="tshirt-crew"
            size={140}
            color="rgba(255,255,255,0.05)"
            style={styles.headerBgIcon}
          />

        </LinearGradient>

        {/* MANAGE CARD */}

        <TouchableOpacity activeOpacity={0.9}>
          <LinearGradient
            colors={['#7B4DFF', '#4B1DFF']}
            style={styles.manageCard}
          >

            <View style={styles.manageLeft}>
              <View style={styles.manageIcon}>
                <Ionicons
                  name="shirt"
                  size={30}
                  color="#6C4DFF"
                />
              </View>

              <View>
                <Text style={styles.manageTitle}>
                  Manage Uniforms
                </Text>

                <Text style={styles.manageSubtitle}>
                  Add, update and manage uniform items
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

        {/* STATS */}

        <View style={styles.statsContainer}>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EEE7FF' }]}>
              <Ionicons
                name="grid"
                size={22}
                color="#6C4DFF"
              />
            </View>

            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E7FFF0' }]}>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color="#22C55E"
              />
            </View>

            <Text style={styles.statNumber}>9</Text>
            <Text style={styles.statLabel}>In Stock</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF5E7' }]}>
              <Ionicons
                name="warning"
                size={22}
                color="#F59E0B"
              />
            </View>

            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F2FF' }]}>
              <Ionicons
                name="person"
                size={22}
                color="#3B82F6"
              />
            </View>

            <Text style={styles.statNumber}>6</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>

        </View>

        {/* SEARCH */}

        <View style={styles.searchRow}>

          <View style={styles.searchBox}>
            <Ionicons
              name="search"
              size={22}
              color="#999"
            />

            <TextInput
              placeholder="Search uniform items..."
              placeholderTextColor="#999"
              style={styles.searchInput}
            />
          </View>

          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons
              name="filter"
              size={24}
              color="#6C4DFF"
            />
          </TouchableOpacity>

        </View>

        {/* CATEGORY */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >

          {[
            'All Items',
            'Head',
            'Upper Body',
            'Lower Body',
            'Footwear',
            'Accessories',
          ].map((item, index) => (

            <TouchableOpacity
              key={index}
              style={[
                styles.categoryChip,
                index === 0 && styles.activeChip,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  index === 0 && styles.activeChipText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>

          ))}

        </ScrollView>

        {/* GUIDE */}

        <View style={styles.guideCard}>

          <View style={styles.guideLeft}>
            <View style={styles.guideIcon}>
              <Ionicons
                name="star"
                size={22}
                color="#6C4DFF"
              />
            </View>

            <View>
              <Text style={styles.guideTitle}>
                Mandatory Uniform Guide
              </Text>

              <Text style={styles.guideSubtitle}>
                Complete list of mandatory items
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.guideBtn}>
            <Text style={styles.guideBtnText}>
              View Guide
            </Text>
          </TouchableOpacity>

        </View>

        {/* LIST */}

        <Text style={styles.sectionTitle}>
          Uniforms Catalog
        </Text>

        {
          uniforms.map((item) => (

            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              activeOpacity={0.9}
            >

              <Image
                source={item.image}
                style={styles.itemImage}
              />

              <View style={{ flex: 1 }}>

                <Text style={styles.itemName}>
                  {item.name}
                </Text>

                <Text style={styles.itemCategory}>
                  {item.category}
                </Text>

                <Text style={styles.itemSize}>
                  Size: {item.sizes}
                </Text>

              </View>

              <View style={{ alignItems: 'flex-end' }}>

                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'IN STOCK'
                      ? styles.greenBadge
                      : styles.orangeBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'IN STOCK'
                        ? styles.greenText
                        : styles.orangeText,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>

                <Text style={styles.qtyText}>
                  Qty: {item.qty}
                </Text>

              </View>

            </TouchableOpacity>

          ))
        }

        <View style={{ height: 120 }} />

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F6F4FF',
  },

  header: {
    paddingTop: 72,
    paddingHorizontal: 24,
    paddingBottom: 135,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    overflow: 'hidden',
    position: 'relative',
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    marginTop: 14,
  },

  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 17,
    marginTop: 8,
    lineHeight: 24,
  },

  bellButton: {
    marginTop: 10,
  },

  headerBgIcon: {
    position: 'absolute',
    right: -10,
    top: 20,
  },

  manageCard: {
    marginTop: -78,
    marginHorizontal: 20,
    borderRadius: 30,
    paddingVertical: 22,
    paddingHorizontal: 22,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#5B3DF5',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },

  manageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  manageIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },

  manageTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },

  manageSubtitle: {
    color: '#E9DDFF',
    fontSize: 14,
    marginTop: 4,
  },

  statsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    elevation: 4,
  },

  statCard: {
    alignItems: 'center',
    flex: 1,
  },

  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#16162E',
    marginTop: 12,
  },

  statLabel: {
    color: '#666',
    marginTop: 4,
    fontSize: 13,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 24,
  },

  searchBox: {
    flex: 1,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    elevation: 2,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 22,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },

  filterBtn: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    elevation: 2,
  },

  categoryContainer: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 10,
  },

  categoryChip: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: '#fff',
    marginLeft: 12,
  },

  activeChip: {
    backgroundColor: '#6C4DFF',
  },

  categoryText: {
    color: '#555',
    fontWeight: '600',
  },

  activeChipText: {
    color: '#fff',
  },

  guideCard: {
    marginHorizontal: 22,
    marginTop: 18,
    borderRadius: 28,
    padding: 22,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: '#F3ECFF',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  guideLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  guideIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  guideTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5B3DF5',
  },

  guideSubtitle: {
    color: '#666',
    marginTop: 4,
  },

  guideBtn: {
    borderWidth: 1.5,
    borderColor: '#6C4DFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginLeft: 10,
  },

  guideBtnText: {
    color: '#6C4DFF',
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#16162E',
    marginTop: 26,
    marginBottom: 16,
    paddingHorizontal: 22,
  },

  itemCard: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 18,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },

  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginRight: 18,
  },

  itemName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#16162E',
  },

  itemCategory: {
    color: '#6C4DFF',
    marginTop: 4,
    fontSize: 16,
  },

  itemSize: {
    color: '#666',
    marginTop: 8,
  },

  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },

  greenBadge: {
    backgroundColor: '#E8FFF1',
  },

  orangeBadge: {
    backgroundColor: '#FFF4E5',
  },

  statusText: {
    fontWeight: '700',
    fontSize: 12,
  },

  greenText: {
    color: '#22C55E',
  },

  orangeText: {
    color: '#F59E0B',
  },

  qtyText: {
    marginTop: 12,
    fontWeight: '700',
    color: '#444',
  },

});