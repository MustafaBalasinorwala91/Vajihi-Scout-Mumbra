import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationBell from '../../components/common/NotificationBell';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

type UniformStats = {
  total?: number;
  available?: number;
  assigned?: number;
  not_usable?: number;
};

type UniformCatalogItem = {
  catalog_id: string;
  name: string;
  category?: string;
  description?: string;
  guide?: string;
  images?: string[];
  components?: any[];
  price?: number;
  currency?: string;
  is_mandatory?: boolean;
  display_order?: number;
  active?: boolean;
  stats?: UniformStats;
};

type FilterType = 'All' | 'Active' | 'Low Stock' | 'Assigned';

export default function UniformsScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const { user, hasPermission } = useAuth();

  const isAdmin = user?.role === 'admin';

  const hasUniformPermission =
    isAdmin || hasPermission('uniforms');

  const [uniforms, setUniforms] = useState<UniformCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] =
    useState<FilterType>('All');

  /*
   * Your existing environment uses:
   *
   * EXPO_PUBLIC_BACKEND_URL
   *
   * Example:
   * http://192.168.x.x:8001/api
   *
   * So the final endpoint becomes:
   *
   * /uniforms/catalog
   */

  const loadCatalog = useCallback(async () => {
    try {
      setError('');

      const baseUrl =
        process.env.EXPO_PUBLIC_BACKEND_URL;

      if (!baseUrl) {
        throw new Error(
          'EXPO_PUBLIC_BACKEND_URL is not configured.'
        );
      }

      const sessionToken = await AsyncStorage.getItem('session_token');

      if (!sessionToken) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await fetch(
        `${baseUrl}/api/uniforms/catalog`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const message =
          await response.text();

        throw new Error(
          message || 'Failed to load uniform catalogue.'
        );
      }

      const data =
        await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          'Invalid uniform catalogue response.'
        );
      }

      setUniforms(data);
    } catch (err: any) {
      console.log(
        'Uniform catalogue error:',
        err
      );

      setError(
        err?.message ||
        'Unable to load uniform catalogue.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCatalog();
  };

  /*
   * FILTER + SEARCH
   */

  const filteredUniforms = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return uniforms.filter((item) => {
      const name =
        item.name?.toLowerCase() || '';

      const category =
        item.category?.toLowerCase() || '';

      const description =
        item.description?.toLowerCase() || '';

      const matchesSearch =
        !searchText ||
        name.includes(searchText) ||
        category.includes(searchText) ||
        description.includes(searchText);

      const stats = item.stats || {};

      const total =
        Number(stats.total || 0);

      const available =
        Number(stats.available || 0);

      const assigned =
        Number(stats.assigned || 0);

      let matchesFilter = true;

      if (activeFilter === 'Active') {
        matchesFilter =
          item.active !== false;
      }

      if (activeFilter === 'Low Stock') {
        matchesFilter =
          available <= 5;
      }

      if (activeFilter === 'Assigned') {
        matchesFilter =
          assigned > 0;
      }

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [
    uniforms,
    search,
    activeFilter,
  ]);

  /*
   * OPEN UNIFORM DETAILS
   *
   * The next screen will be:
   *
   * Uniform Details
   *
   * with image gallery,
   * components,
   * stock,
   * sizes and assignment.
   */

  const openUniformDetails = (
    catalogId: string
  ) => {
    router.push({
      pathname: '/uniform-details',
      params: {
        catalog_id: catalogId,
      },
    } as any);
  };

  /*
   * IMAGE HELPER
   */

  const getUniformImage = (
    item: UniformCatalogItem
  ) => {
    if (
      item.images &&
      item.images.length > 0 &&
      item.images[0]
    ) {
      return item.images[0];
    }

    return null;
  };

  /*
   * STATUS
   */

  const getStatus = (
    item: UniformCatalogItem
  ) => {
    const available =
      Number(
        item.stats?.available || 0
      );

    if (available <= 5) {
      return {
        label: 'LOW STOCK',
        background: '#FFF3E2',
        text: '#F59E0B',
      };
    }

    return {
      label: 'ACTIVE',
      background: '#E8FFF0',
      text: '#22B866',
    };
  };

  /*
   * LOADING
   */

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <Ionicons
            name="shirt-outline"
            size={34}
            color="#6C4DFF"
          />
        </View>

        <ActivityIndicator
          size="small"
          color="#6C4DFF"
          style={{ marginTop: 18 }}
        />

        <Text style={styles.loadingText}>
          Loading uniforms...
        </Text>
      </View>
    );
  }

  /*
   * ERROR
   */

  if (error && uniforms.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>

          <View style={styles.errorIcon}>
            <Ionicons
              name="alert-circle-outline"
              size={38}
              color="#FF4D4F"
            />
          </View>

          <Text style={styles.errorTitle}>
            Unable to load uniforms
          </Text>

          <Text style={styles.errorMessage}>
            {error}
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.retryButton}
            onPress={loadCatalog}
          >
            <Text style={styles.retryText}>
              Try Again
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5B3DF5']}
            tintColor="#5B3DF5"
          />
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* =================================================
            HEADER
        ================================================== */}

        <LinearGradient
          colors={[
            '#2B145A',
            '#5B3DF5',
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={styles.header}
        >

          <View style={styles.headerTop}>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                router.back()
              }
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={27}
                color="#fff"
              />
            </TouchableOpacity>

            <View
              style={
                styles.headerTextContainer
              }
            >
              <Text
                style={styles.headerTitle}
                numberOfLines={1}
              >
                Uniforms
              </Text>

              <Text
                style={styles.headerSubtitle}
                numberOfLines={1}
              >
                Manage uniforms & assignments
              </Text>
            </View>

            <NotificationBell />

          </View>

        </LinearGradient>

        {/* ADD UNIFORM */}

        {hasUniformPermission && (
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.addUniformButton}
            onPress={() => router.push('/uniform-add' as any)}
          >
            <View style={styles.addUniformIcon}>
              <Ionicons name="add" size={22} color="#fff" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.addUniformTitle}>
                Add Uniform
              </Text>

              <Text style={styles.addUniformSubtitle}>
                Create a uniform catalogue and manage its stock
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color="#6C4DFF"
            />
          </TouchableOpacity>
        )}

        {/* =================================================
            SEARCH
        ================================================== */}

        <View style={styles.searchRow}>

          <View style={styles.searchBox}>

            <Ionicons
              name="search"
              size={22}
              color="#999"
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search uniforms..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              returnKeyType="search"
            />

            {search.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  setSearch('')
                }
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="#AAA"
                />
              </TouchableOpacity>
            )}

          </View>
        </View>


        {/* =================================================
            FILTER TABS
        ================================================== */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.filterContainer
          }
        >

          {(
            [
              'All',
              'Active',
              'Low Stock',
              'Assigned',
            ] as FilterType[]
          ).map((filter) => {

            const active =
              activeFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.85}
                onPress={() =>
                  setActiveFilter(filter)
                }
                style={[
                  styles.filterChip,
                  active &&
                  styles.filterChipActive,
                ]}
              >

                <Text
                  style={[
                    styles.filterChipText,
                    active &&
                    styles.filterChipTextActive,
                  ]}
                >
                  {filter}
                </Text>

              </TouchableOpacity>
            );
          })}

        </ScrollView>


        {/* STATS */}

        <View style={styles.statsContainer}>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EEE7FF' }]}>
              <Ionicons name="shirt-outline" size={22} color="#6C4DFF" />
            </View>
            <Text style={styles.statValue}>{uniforms.length}</Text>
            <Text style={styles.statLabel}>Catalogue</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E9FFF2' }]}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#22B866" />
            </View>
            <Text style={styles.statValue}>
              {uniforms.filter((item) => item.active !== false).length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EAF3FF' }]}>
              <Ionicons name="cube-outline" size={22} color="#2878D8" />
            </View>
            <Text style={styles.statValue}>
              {uniforms.reduce((sum, item) => sum + Number(item.stats?.available || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF4E4' }]}>
              <Ionicons name="person-outline" size={22} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>
              {uniforms.reduce((sum, item) => sum + Number(item.stats?.assigned || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>

        </View>


        {/* =================================================
            RESULT HEADER
        ================================================== */}

        <View style={styles.resultHeader}>

          <View>
            <Text style={styles.resultTitle}>
              Uniform Catalogue
            </Text>

            <Text style={styles.resultSubtitle}>
              {filteredUniforms.length}{' '}
              {filteredUniforms.length === 1
                ? 'uniform'
                : 'uniforms'}
            </Text>
          </View>

          {search.length > 0 && (
            <Text style={styles.searchResultText}>
              Search results
            </Text>
          )}

        </View>


        {/* =================================================
            EMPTY
        ================================================== */}

        {filteredUniforms.length === 0 && (
          <View style={styles.emptyCard}>

            <View style={styles.emptyIcon}>
              <Ionicons
                name="shirt-outline"
                size={38}
                color="#6C4DFF"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No uniforms found
            </Text>

            <Text style={styles.emptyMessage}>
              Try changing your search or filter.
            </Text>

          </View>
        )}


        {/* =================================================
            UNIFORM CARDS
        ================================================== */}

        {filteredUniforms.map((item) => {

          const stats =
            item.stats || {};

          const total =
            Number(stats.total || 0);

          const available =
            Number(
              stats.available || 0
            );

          const assigned =
            Number(
              stats.assigned || 0
            );

          const notUsable =
            Number(
              stats.not_usable || 0
            );

          const status =
            getStatus(item);

          const image =
            getUniformImage(item);

          return (
            <TouchableOpacity
              key={item.catalog_id}
              activeOpacity={0.92}
              style={styles.uniformCard}
              onPress={() =>
                openUniformDetails(
                  item.catalog_id
                )
              }
            >

              {/* IMAGE */}

              <View style={styles.imageContainer}>

                {image ? (
                  <Image
                    source={{
                      uri: image,
                    }}
                    style={styles.uniformImage}
                  />
                ) : (
                  <View
                    style={
                      styles.imagePlaceholder
                    }
                  >
                    <Ionicons
                      name="shirt-outline"
                      size={42}
                      color="#6C4DFF"
                    />
                  </View>
                )}

              </View>


              {/* DETAILS */}

              <View style={styles.uniformDetails}>

                <View
                  style={
                    styles.uniformTitleRow
                  }
                >

                  <Text
                    style={styles.uniformName}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          status.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            status.text,
                        },
                      ]}
                    >
                      {status.label}
                    </Text>
                  </View>

                </View>


                <Text
                  style={styles.uniformDescription}
                  numberOfLines={2}
                >
                  {item.description ||
                    'Uniform package and components'}
                </Text>


                {/* STAT ROW */}

                <View style={styles.statRow}>

                  <View
                    style={[
                      styles.smallStat,
                      styles.totalStat,
                    ]}
                  >
                    <Text
                      style={[
                        styles.smallStatValue,
                        {
                          color:
                            '#2878D8',
                        },
                      ]}
                    >
                      {total}
                    </Text>

                    <Text
                      style={styles.smallStatLabel}
                    >
                      Total
                    </Text>
                  </View>


                  <View
                    style={[
                      styles.smallStat,
                      styles.stockStat,
                    ]}
                  >
                    <Text
                      style={[
                        styles.smallStatValue,
                        {
                          color:
                            '#22B866',
                        },
                      ]}
                    >
                      {available}
                    </Text>

                    <Text
                      style={styles.smallStatLabel}
                    >
                      In Stock
                    </Text>
                  </View>


                  <View
                    style={[
                      styles.smallStat,
                      styles.assignedStat,
                    ]}
                  >
                    <Text
                      style={[
                        styles.smallStatValue,
                        {
                          color:
                            '#F59E0B',
                        },
                      ]}
                    >
                      {assigned}
                    </Text>

                    <Text
                      style={styles.smallStatLabel}
                    >
                      Assigned
                    </Text>
                  </View>


                  <View
                    style={[
                      styles.smallStat,
                      styles.notUsableStat,
                    ]}
                  >
                    <Text
                      style={[
                        styles.smallStatValue,
                        {
                          color:
                            '#FF4D4F',
                        },
                      ]}
                    >
                      {notUsable}
                    </Text>

                    <Text
                      style={styles.smallStatLabel}
                    >
                      Not Usable
                    </Text>
                  </View>

                </View>

              </View>


              {/* ARROW */}

              <View style={styles.arrowContainer}>

                <Ionicons
                  name="chevron-forward"
                  size={25}
                  color="#6C4DFF"
                />

              </View>

            </TouchableOpacity>
          );
        })}


        {/* =================================================
            BOTTOM SPACE
        ================================================== */}

        <View style={styles.bottomSpace} />

      </ScrollView>
    </View>
  );
}


/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F6F4FF',
  },

  scrollContent: {
    paddingBottom: 120,
  },


  /* HEADER */

  header: {
    paddingTop: 66,
    paddingHorizontal: 18,
    paddingBottom: 25,

    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,

    overflow: 'hidden',
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },

  headerTextContainer: {
    flex: 1,
    marginHorizontal: 7,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: '#E9DDFF',
    fontSize: 13.5,
    marginTop: 3,
  },


  /* ADD UNIFORM */

  addUniformButton: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  addUniformIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#6C4DFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  addUniformTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16162E',
  },

  addUniformSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },


  /* STATS */

  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 14,
    gap: 8,
  },

  statCard: {
    flex: 1,
    minHeight: 104,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statValue: {
    marginTop: 5,
    fontSize: 18,
    fontWeight: '800',
    color: '#16162E',
  },

  statLabel: {
    marginTop: 1,
    fontSize: 9.5,
    color: '#666',
    fontWeight: '600',
  },


  /* SEARCH */

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginHorizontal: 20,
    marginTop: 18,
  },

  searchBox: {
    flex: 1,

    height: 58,

    backgroundColor: '#fff',

    borderRadius: 20,

    paddingHorizontal: 17,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.07,
    shadowRadius: 8,

    elevation: 4,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,

    color: '#16162E',
    fontSize: 15,
  },

  /* FILTERS */

  filterContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },

  filterChip: {
    height: 42,

    paddingHorizontal: 21,

    borderRadius: 22,

    backgroundColor: '#fff',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 10,

    borderWidth: 1,
    borderColor: '#ECE8F7',
  },

  filterChipActive: {
    backgroundColor: '#5B3DF5',
    borderColor: '#5B3DF5',
  },

  filterChipText: {
    color: '#30304A',
    fontSize: 13.5,
    fontWeight: '600',
  },

  filterChipTextActive: {
    color: '#fff',
  },


  /* RESULT HEADER */

  resultHeader: {
    marginHorizontal: 20,
    marginTop: 21,
    marginBottom: 10,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16162E',
  },

  resultSubtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 3,
  },

  searchResultText: {
    color: '#6C4DFF',
    fontSize: 12,
    fontWeight: '700',
  },


  /* CARD */

  uniformCard: {
    marginHorizontal: 20,
    marginTop: 12,

    backgroundColor: '#fff',

    borderRadius: 23,

    padding: 11,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,

    elevation: 3,
  },

  imageContainer: {
    width: 78,
    height: 94,

    borderRadius: 17,

    backgroundColor: '#F1EDFF',

    justifyContent: 'center',
    alignItems: 'center',

    overflow: 'hidden',
  },

  uniformImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  imagePlaceholder: {
    width: '100%',
    height: '100%',

    justifyContent: 'center',
    alignItems: 'center',
  },


  /* DETAILS */

  uniformDetails: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  uniformTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  uniformName: {
    flex: 1,

    fontSize: 17,
    fontWeight: '800',

    color: '#16162E',

    marginRight: 7,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,

    borderRadius: 11,
  },

  statusText: {
    fontSize: 9.5,
    fontWeight: '800',
  },

  uniformDescription: {
    color: '#777',

    fontSize: 12.5,

    lineHeight: 17,

    marginTop: 5,

    marginRight: 4,
  },


  /* STAT ROW */

  statRow: {
    flexDirection: 'row',

    marginTop: 9,

    gap: 5,
  },

  smallStat: {
    flex: 1,

    minHeight: 43,

    borderRadius: 10,

    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 2,
  },

  totalStat: {
    backgroundColor: '#EAF3FF',
  },

  stockStat: {
    backgroundColor: '#E9FFF2',
  },

  assignedStat: {
    backgroundColor: '#FFF4E4',
  },

  notUsableStat: {
    backgroundColor: '#FFEAEA',
  },

  smallStatValue: {
    fontSize: 15,
    fontWeight: '800',
  },

  smallStatLabel: {
    fontSize: 8.5,
    color: '#666',
    marginTop: 1,
  },


  /* ARROW */

  arrowContainer: {
    width: 25,

    justifyContent: 'center',
    alignItems: 'center',

    marginLeft: 4,
  },


  /* EMPTY */

  emptyCard: {
    marginHorizontal: 20,
    marginTop: 25,

    backgroundColor: '#fff',

    borderRadius: 24,

    paddingVertical: 45,
    paddingHorizontal: 25,

    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,

    elevation: 3,
  },

  emptyIcon: {
    width: 72,
    height: 72,

    borderRadius: 24,

    backgroundColor: '#EEE7FF',

    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#16162E',

    marginTop: 15,
  },

  emptyMessage: {
    color: '#777',
    fontSize: 13,

    marginTop: 6,

    textAlign: 'center',
  },


  /* LOADING */

  loadingContainer: {
    flex: 1,

    backgroundColor: '#F6F4FF',

    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingIcon: {
    width: 76,
    height: 76,

    borderRadius: 25,

    backgroundColor: '#EEE7FF',

    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,

    color: '#6C4DFF',

    fontSize: 15,

    fontWeight: '600',
  },


  /* ERROR */

  errorContainer: {
    flex: 1,

    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 35,
  },

  errorIcon: {
    width: 76,
    height: 76,

    borderRadius: 25,

    backgroundColor: '#FFEAEA',

    justifyContent: 'center',
    alignItems: 'center',
  },

  errorTitle: {
    marginTop: 17,

    fontSize: 20,

    fontWeight: '800',

    color: '#16162E',
  },

  errorMessage: {
    marginTop: 8,

    fontSize: 13,

    color: '#777',

    textAlign: 'center',

    lineHeight: 19,
  },

  retryButton: {
    marginTop: 20,

    backgroundColor: '#5B3DF5',

    paddingHorizontal: 28,
    paddingVertical: 12,

    borderRadius: 15,
  },

  retryText: {
    color: '#fff',

    fontWeight: '700',

    fontSize: 14,
  },


  bottomSpace: {
    height: 40,
  },

});