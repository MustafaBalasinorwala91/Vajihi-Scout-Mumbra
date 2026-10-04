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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationBell from '../../components/common/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';

type InventoryItem = {
    item_id: string;
    name: string;
    category: 'instrument' | 'other';
    description?: string;
    images?: string[];
    total_quantity?: number;
    available_quantity?: number;
    assigned_quantity?: number;
    repair_quantity?: number;
    not_usable_quantity?: number;
    condition?: string;
    active?: boolean;
};

type FilterType = 'All' | 'Available' | 'Assigned' | 'Under Repair';

const getImageUri = (value?: string | null) => {
    if (!value) return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    // Supports normal URLs, data URLs, and raw Base64 values.
    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:image/')
    ) {
        return trimmed;
    }

    return `data:image/jpeg;base64,${trimmed}`;
};

export default function InstrumentsScreen() {
    const router = useRouter();

    const { user, hasPermission } = useAuth();

    const isAdmin = user?.role === 'admin';

    const hasInventoryPermission =
        isAdmin || hasPermission('inventory');

    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] =
        useState<FilterType>('All');

    const loadInstruments = useCallback(async () => {
        try {
            setError('');

            const BACKEND_URL =
                process.env.EXPO_PUBLIC_BACKEND_URL;

            if (!BACKEND_URL) {
                throw new Error(
                    'EXPO_PUBLIC_BACKEND_URL is not configured.'
                );
            }

            const sessionToken = await AsyncStorage.getItem('session_token');

            if (!sessionToken) {
                throw new Error('Session expired. Please login again.');
            }

            const response = await fetch(
                `${BACKEND_URL}/api/inventory`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${sessionToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (!response.ok) {
                const message = await response.text();

                throw new Error(
                    message ||
                    `Failed to load instruments (${response.status}).`
                );
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error(
                    'Invalid inventory response.'
                );
            }

            const instruments = data.filter(
                (item: InventoryItem) =>
                    item?.category === 'instrument'
            );

            setItems(instruments);
        } catch (err: any) {
            console.log(
                'Instrument inventory error:',
                err
            );

            setError(
                err?.message ||
                'Unable to load instruments.'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadInstruments();
    }, [loadInstruments]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadInstruments();
    };

    const filteredItems = useMemo(() => {
        const searchText =
            search.trim().toLowerCase();

        return items.filter((item) => {
            const name =
                item.name?.toLowerCase() || '';

            const description =
                item.description?.toLowerCase() || '';

            const condition =
                item.condition?.toLowerCase() || '';

            const matchesSearch =
                !searchText ||
                name.includes(searchText) ||
                description.includes(searchText) ||
                condition.includes(searchText);

            const available =
                Number(item.available_quantity || 0);

            const assigned =
                Number(item.assigned_quantity || 0);

            const repair =
                Number(item.repair_quantity || 0);

            let matchesFilter = true;

            if (activeFilter === 'Available') {
                matchesFilter = available > 0;
            }

            if (activeFilter === 'Assigned') {
                matchesFilter = assigned > 0;
            }

            if (activeFilter === 'Under Repair') {
                matchesFilter = repair > 0;
            }

            return (
                matchesSearch &&
                matchesFilter
            );
        });
    }, [items, search, activeFilter]);

    const stats = useMemo(() => {
        return items.reduce(
            (acc, item) => {
                acc.total += Number(
                    item.total_quantity || 0
                );

                acc.available += Number(
                    item.available_quantity || 0
                );

                acc.assigned += Number(
                    item.assigned_quantity || 0
                );

                acc.repair += Number(
                    item.repair_quantity || 0
                );

                acc.notUsable += Number(
                    item.not_usable_quantity || 0
                );

                return acc;
            },
            {
                total: 0,
                available: 0,
                assigned: 0,
                repair: 0,
                notUsable: 0,
            }
        );
    }, [items]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingIcon}>
                    <MaterialCommunityIcons
                        name="music"
                        size={36}
                        color="#D9467A"
                    />
                </View>

                <ActivityIndicator
                    size="small"
                    color="#D9467A"
                    style={{ marginTop: 18 }}
                />

                <Text style={styles.loadingText}>
                    Loading instruments...
                </Text>
            </View>
        );
    }

    if (error && items.length === 0) {
        return (
            <View style={styles.errorContainer}>
                <View style={styles.errorIcon}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={40}
                        color="#FF4D4F"
                    />
                </View>

                <Text style={styles.errorTitle}>
                    Unable to load instruments
                </Text>

                <Text style={styles.errorMessage}>
                    {error}
                </Text>

                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadInstruments}
                    activeOpacity={0.85}
                >
                    <Text style={styles.retryText}>
                        Try Again
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#D9467A']}
                        tintColor="#D9467A"
                    />
                }
                contentContainerStyle={
                    styles.scrollContent
                }
            >

                {/* HEADER */}

                <LinearGradient
                    colors={[
                        '#57152F',
                        '#D9467A',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={27}
                                color="#fff"
                            />
                        </TouchableOpacity>

                        <View
                            style={styles.headerTextContainer}
                        >
                            <Text
                                style={styles.headerTitle}
                                numberOfLines={1}
                            >
                                Instruments
                            </Text>

                            <Text
                                style={styles.headerSubtitle}
                                numberOfLines={1}
                            >
                                Manage instruments & assignments
                            </Text>
                        </View>

                        <NotificationBell />

                    </View>
                </LinearGradient>

                {/* ADD INSTRUMENT */}

                {hasInventoryPermission && (
                    <TouchableOpacity
                        activeOpacity={0.88}
                        style={styles.addInstrumentButton}
                        onPress={() => {
                            router.push({
                                pathname: '../inventory/add-item',
                                params: {
                                    category: 'instrument',
                                },
                            });
                        }}
                    >
                        <View style={styles.addInstrumentIcon}>
                            <Ionicons
                                name="add"
                                size={22}
                                color="#fff"
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.addInstrumentTitle}>
                                Add Instrument
                            </Text>

                            <Text style={styles.addInstrumentSubtitle}>
                                Add a new instrument to inventory
                            </Text>
                        </View>

                        <Ionicons
                            name="chevron-forward"
                            size={22}
                            color="#D9467A"
                        />
                    </TouchableOpacity>
                )}

                {/* SEARCH */}

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
                            placeholder="Search instruments..."
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

                {/* FILTERS */}

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
                            'Available',
                            'Assigned',
                            'Under Repair',
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
                        <View
                            style={[
                                styles.statIcon,
                                {
                                    backgroundColor:
                                        '#FFE8F0',
                                },
                            ]}
                        >
                            <Ionicons
                                name="grid-outline"
                                size={22}
                                color="#D9467A"
                            />
                        </View>

                        <Text style={styles.statValue}>
                            {stats.total}
                        </Text>

                        <Text style={styles.statLabel}>
                            Total
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <View
                            style={[
                                styles.statIcon,
                                {
                                    backgroundColor:
                                        '#E9FFF2',
                                },
                            ]}
                        >
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={22}
                                color="#22B866"
                            />
                        </View>

                        <Text style={styles.statValue}>
                            {stats.available}
                        </Text>

                        <Text style={styles.statLabel}>
                            Available
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <View
                            style={[
                                styles.statIcon,
                                {
                                    backgroundColor:
                                        '#FFF4E4',
                                },
                            ]}
                        >
                            <Ionicons
                                name="person-outline"
                                size={22}
                                color="#F59E0B"
                            />
                        </View>

                        <Text style={styles.statValue}>
                            {stats.assigned}
                        </Text>

                        <Text style={styles.statLabel}>
                            Assigned
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <View
                            style={[
                                styles.statIcon,
                                {
                                    backgroundColor:
                                        '#FFEAEA',
                                },
                            ]}
                        >
                            <Ionicons
                                name="build-outline"
                                size={22}
                                color="#FF4D4F"
                            />
                        </View>

                        <Text style={styles.statValue}>
                            {stats.repair}
                        </Text>

                        <Text style={styles.statLabel}>
                            Repair
                        </Text>
                    </View>

                </View>

                {/* RESULT HEADER */}

                <View style={styles.resultHeader}>

                    <View>
                        <Text style={styles.resultTitle}>
                            Instrument Catalogue
                        </Text>

                        <Text style={styles.resultSubtitle}>
                            {filteredItems.length}{' '}
                            {filteredItems.length === 1
                                ? 'instrument'
                                : 'instruments'}
                        </Text>
                    </View>

                    {search.length > 0 && (
                        <Text
                            style={styles.searchResultText}
                        >
                            Search results
                        </Text>
                    )}

                </View>

                {/* EMPTY */}

                {filteredItems.length === 0 && (
                    <View style={styles.emptyCard}>

                        <View style={styles.emptyIcon}>
                            <MaterialCommunityIcons
                                name="music-off"
                                size={40}
                                color="#D9467A"
                            />
                        </View>

                        <Text style={styles.emptyTitle}>
                            No instruments found
                        </Text>

                        <Text style={styles.emptyMessage}>
                            Try changing your search or filter.
                        </Text>

                    </View>
                )}

                {/* INSTRUMENT CARDS */}

                {filteredItems.map((item) => {

                    const total =
                        Number(
                            item.total_quantity || 0
                        );

                    const available =
                        Number(
                            item.available_quantity || 0
                        );

                    const assigned =
                        Number(
                            item.assigned_quantity || 0
                        );

                    const repair =
                        Number(
                            item.repair_quantity || 0
                        );

                    const notUsable =
                        Number(
                            item.not_usable_quantity || 0
                        );

                    const lowStock =
                        available <= 5;

                    return (
                        <TouchableOpacity
                            key={item.item_id}
                            activeOpacity={0.92}
                            style={styles.instrumentCard}
                            onPress={() => {
                                router.push({
                                    pathname: '/inventory/item-details/[item_id]',
                                    params: {
                                        item_id: item.item_id,
                                    },
                                });
                            }}
                        >

                            <View style={styles.instrumentIcon}>
                                {getImageUri(item.images?.[0]) ? (
                                    <Image
                                        source={{
                                            uri: getImageUri(item.images?.[0])!,
                                        }}
                                        style={styles.instrumentImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <MaterialCommunityIcons
                                        name="music"
                                        size={38}
                                        color="#D9467A"
                                    />
                                )}
                            </View>

                            <View
                                style={styles.instrumentDetails}
                            >

                                <View
                                    style={
                                        styles.instrumentTitleRow
                                    }
                                >
                                    <Text
                                        style={styles.instrumentName}
                                        numberOfLines={1}
                                    >
                                        {item.name}
                                    </Text>

                                    <View
                                        style={[
                                            styles.statusBadge,
                                            {
                                                backgroundColor:
                                                    lowStock
                                                        ? '#FFF3E2'
                                                        : '#E8FFF0',
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusText,
                                                {
                                                    color:
                                                        lowStock
                                                            ? '#F59E0B'
                                                            : '#22B866',
                                                },
                                            ]}
                                        >
                                            {lowStock
                                                ? 'LOW STOCK'
                                                : 'ACTIVE'}
                                        </Text>
                                    </View>
                                </View>

                                <Text
                                    style={
                                        styles.instrumentDescription
                                    }
                                    numberOfLines={2}
                                >
                                    {item.description ||
                                        'Instrument inventory item'}
                                </Text>

                                <View
                                    style={styles.itemStats}
                                >

                                    <View
                                        style={[
                                            styles.itemStat,
                                            styles.totalStat,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.itemStatValue,
                                                {
                                                    color: '#2878D8',
                                                },
                                            ]}
                                        >
                                            {total}
                                        </Text>

                                        <Text
                                            style={styles.itemStatLabel}
                                        >
                                            Total
                                        </Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.itemStat,
                                            styles.availableStat,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.itemStatValue,
                                                {
                                                    color: '#22B866',
                                                },
                                            ]}
                                        >
                                            {available}
                                        </Text>

                                        <Text
                                            style={styles.itemStatLabel}
                                        >
                                            Available
                                        </Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.itemStat,
                                            styles.assignedStat,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.itemStatValue,
                                                {
                                                    color: '#F59E0B',
                                                },
                                            ]}
                                        >
                                            {assigned}
                                        </Text>

                                        <Text
                                            style={styles.itemStatLabel}
                                        >
                                            Assigned
                                        </Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.itemStat,
                                            styles.repairStat,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.itemStatValue,
                                                {
                                                    color: '#FF4D4F',
                                                },
                                            ]}
                                        >
                                            {repair +
                                                notUsable}
                                        </Text>

                                        <Text
                                            style={styles.itemStatLabel}
                                        >
                                            Issue
                                        </Text>
                                    </View>

                                </View>

                            </View>

                            <Ionicons
                                name="chevron-forward"
                                size={24}
                                color="#D9467A"
                            />

                        </TouchableOpacity>
                    );
                })}

                <View
                    style={styles.bottomSpace}
                />

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
        backgroundColor: '#FFE8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingText: {
        marginTop: 12,
        color: '#D9467A',
        fontSize: 15,
        fontWeight: '600',
    },

    /* ERROR */

    errorContainer: {
        flex: 1,
        backgroundColor: '#F6F4FF',
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
        backgroundColor: '#D9467A',
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 15,
    },

    retryText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    addInstrumentButton: {
        marginHorizontal: 20,
        marginTop: 16,
        backgroundColor: '#fff',
        borderRadius: 19,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.06,
        shadowRadius: 7,
    },

    addInstrumentIcon: {
        width: 43,
        height: 43,
        borderRadius: 14,
        backgroundColor: '#D9467A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    addInstrumentTitle: {
        color: '#16162E',
        fontSize: 15,
        fontWeight: '800',
    },

    addInstrumentSubtitle: {
        color: '#777',
        fontSize: 11.5,
        marginTop: 3,
    },

    /* HEADER */

    header: {
        paddingTop: 66,
        paddingHorizontal: 18,
        paddingBottom: 28,
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
        color: '#F8DCE7',
        fontSize: 13.5,
        marginTop: 3,
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
        backgroundColor: '#D9467A',
        borderColor: '#D9467A',
    },

    filterChipText: {
        color: '#30304A',
        fontSize: 13.5,
        fontWeight: '600',
    },

    filterChipTextActive: {
        color: '#fff',
    },

    /* STATS */

    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        marginTop: 18,
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingVertical: 15,
        paddingHorizontal: 7,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 5,
    },

    statCard: {
        flex: 1,
        alignItems: 'center',
        minWidth: 0,
    },

    statIcon: {
        width: 43,
        height: 43,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },

    statValue: {
        fontSize: 19,
        fontWeight: '800',
        color: '#16162E',
    },

    statLabel: {
        marginTop: 3,
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
    },

    /* RESULTS */

    resultHeader: {
        marginHorizontal: 20,
        marginTop: 25,
        marginBottom: 8,
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
        color: '#D9467A',
        fontSize: 12,
        fontWeight: '700',
    },

    /* CARD */

    instrumentCard: {
        marginHorizontal: 20,
        marginTop: 12,
        backgroundColor: '#fff',
        borderRadius: 23,
        padding: 12,
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

    instrumentIcon: {
        width: 68,
        height: 68,
        borderRadius: 19,
        backgroundColor: '#FFE8F0',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    instrumentImage: {
        width: '100%',
        height: '100%',
    },

    instrumentDetails: {
        flex: 1,
        marginLeft: 12,
        minWidth: 0,
    },

    instrumentTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    instrumentName: {
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

    instrumentDescription: {
        color: '#777',
        fontSize: 12.5,
        lineHeight: 17,
        marginTop: 5,
        marginRight: 4,
    },

    itemStats: {
        flexDirection: 'row',
        marginTop: 9,
        gap: 5,
    },

    itemStat: {
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

    availableStat: {
        backgroundColor: '#E9FFF2',
    },

    assignedStat: {
        backgroundColor: '#FFF4E4',
    },

    repairStat: {
        backgroundColor: '#FFEAEA',
    },

    itemStatValue: {
        fontSize: 15,
        fontWeight: '800',
    },

    itemStatLabel: {
        fontSize: 8.5,
        color: '#666',
        marginTop: 1,
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
        backgroundColor: '#FFE8F0',
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

    bottomSpace: {
        height: 40,
    },
});