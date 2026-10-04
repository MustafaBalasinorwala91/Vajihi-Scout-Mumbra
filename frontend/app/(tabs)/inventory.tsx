import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import NotificationBell from '../../components/common/NotificationBell';

export default function InventoryScreen() {
  const router = useRouter();

  const categories = [
    {
      id: 'uniforms',
      title: 'Uniforms',
      subtitle: 'View and manage uniform catalog',
      icon: 'shirt-outline' as const,
      iconLibrary: 'ionicons' as const,
      iconBackground: '#EEE7FF',
      iconColor: '#6C4DFF',
      accent: '#6C4DFF',
    },
    {
      id: 'instruments',
      title: 'Instruments',
      subtitle: 'View and manage instruments',
      icon: 'musical-notes-outline' as const,
      iconLibrary: 'ionicons' as const,
      iconBackground: '#FFE8F0',
      iconColor: '#D9467A',
      accent: '#D9467A',
    },
    {
      id: 'others',
      title: 'Others',
      subtitle: 'View and manage other inventory items',
      icon: 'cube-outline' as const,
      iconLibrary: 'material' as const,
      iconBackground: '#E7F1FF',
      iconColor: '#2878D8',
      accent: '#2878D8',
    },
  ];

  const handleCategoryPress = (category: string) => {
    if (category === 'uniforms') {
      router.push('/inventory/uniforms');
      return;
    }

    if (category === 'instruments') {
      router.push('/inventory/instruments');
      return;
    }

    if (category === 'others') {
      router.push('/inventory/others');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <LinearGradient
          colors={['#2B145A', '#5B3DF5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Inventory</Text>
              <Text style={styles.headerSubtitle}>
                Organisational items & assignments
              </Text>
            </View>

            <NotificationBell />
          </View>
        </LinearGradient>

        {/* CATEGORIES */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a category to manage its catalogue, stock and assignments.
          </Text>

          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              activeOpacity={0.9}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category.id)}
            >
              <View style={styles.categoryTop}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: category.iconBackground },
                  ]}
                >
                  {category.iconLibrary === 'material' ? (
                    <MaterialCommunityIcons
                      name={category.icon as any}
                      size={34}
                      color={category.iconColor}
                    />
                  ) : (
                    <Ionicons
                      name={category.icon as any}
                      size={34}
                      color={category.iconColor}
                    />
                  )}
                </View>

                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categorySubtitle}>
                    {category.subtitle}
                  </Text>
                </View>

                <View
                  style={[
                    styles.arrowContainer,
                    { backgroundColor: category.iconBackground },
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color={category.accent}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.categoryFooter,
                  { borderTopColor: `${category.accent}18` },
                ]}
              >
                <Text
                  style={[
                    styles.categoryFooterText,
                    { color: category.accent },
                  ]}
                >
                  Manage {category.title}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={17}
                  color={category.accent}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FF',
  },

  scrollContent: {
    paddingBottom: 120,
  },

  header: {
    paddingTop: 68,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    overflow: 'hidden',
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 14,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    color: '#E9DDFF',
    fontSize: 16,
    marginTop: 7,
    lineHeight: 22,
  },

  categoriesSection: {
    marginTop: 28,
    paddingHorizontal: 20,
  },

  sectionTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#16162E',
  },

  sectionSubtitle: {
    fontSize: 13.5,
    color: '#777',
    lineHeight: 20,
    marginTop: 5,
    marginBottom: 16,
  },

  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  categoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 82,
  },

  categoryIcon: {
    width: 70,
    height: 70,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  categoryInfo: {
    flex: 1,
    paddingRight: 10,
  },

  categoryTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#16162E',
  },

  categorySubtitle: {
    fontSize: 13.5,
    color: '#777',
    marginTop: 5,
    lineHeight: 19,
  },

  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  categoryFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  categoryFooterText: {
    fontSize: 13,
    fontWeight: '800',
  },

  bottomSpace: {
    height: 40,
  },
});
