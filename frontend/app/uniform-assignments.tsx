import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Image,
} from 'react-native';

import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import NotificationBell from '../components/common/NotificationBell';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');
const API_BASE = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;

type Member = {
    user_id?: string;
    name?: string;
    its_no?: string;
    picture?: string;
};

type AssignmentComponent = {
    component_id?: string;
    component_name?: string;
    size?: string;
    quantity?: number;
    assigned?: boolean;
    paid?: boolean;
    status?: string;
};

type UniformAssignment = {
    assignment_id: string;
    user_id?: string;
    catalog_id?: string;
    uniform_name?: string;
    assignment_status?: string;
    payment_status?: string;
    assigned_date?: string;
    assigned_by?: string;
    member_notes?: string;
    remarks?: string;
    member?: Member | null;
    components?: AssignmentComponent[];
};

type FilterType =
    | 'all'
    | 'active'
    | 'partial'
    | 'returned';

export default function UniformAssignmentsScreen() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        catalog_id?: string | string[];
        uniform_name?: string | string[];
    }>();

    const { user, hasPermission } = useAuth();

    const isAdmin = user?.role === 'admin';

    const catalogId = Array.isArray(params.catalog_id)
        ? params.catalog_id[0]
        : params.catalog_id;

    const uniformNameFromParams = Array.isArray(
        params.uniform_name
    )
        ? params.uniform_name[0]
        : params.uniform_name;

    const hasUniformPermission =
        isAdmin || hasPermission('uniforms');
    const [assignments, setAssignments] =
        useState<UniformAssignment[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState('');

    const [search, setSearch] =
        useState('');

    const [filter, setFilter] =
        useState<FilterType>('all');

    const loadAssignments = useCallback(
        async () => {
            try {
                setError('');

                const baseUrl =
                    process.env.EXPO_PUBLIC_BACKEND_URL;

                if (!baseUrl) {
                    throw new Error(
                        'EXPO_PUBLIC_BACKEND_URL is not configured.'
                    );
                }

                const token =
                    await AsyncStorage.getItem('session_token');

                if (!token) {
                    throw new Error(
                        'Session expired. Please login again.'
                    );
                }

                const response =
                    await fetch(
                        `${API_BASE}/uniforms/assigned`,
                        {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );

                if (!response.ok) {
                    const message =
                        await response.text();

                    throw new Error(
                        message ||
                        'Failed to load uniform assignments.'
                    );
                }

                const data =
                    await response.json();

                setAssignments(
                    Array.isArray(data)
                        ? data
                        : []
                );
            } catch (err: any) {
                console.log(
                    'Uniform assignments error:',
                    err
                );

                setError(
                    err?.message ||
                    'Unable to load assignments.'
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        if (!hasUniformPermission) {
            setLoading(false);
            return;
        }

        loadAssignments();
    }, [
        hasUniformPermission,
        loadAssignments,
    ]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAssignments();
    };

    const catalogAssignments =
        useMemo(() => {
            if (!catalogId) {
                return assignments;
            }

            return assignments.filter(
                (assignment) =>
                    assignment.catalog_id ===
                    catalogId
            );
        }, [
            assignments,
            catalogId,
        ]);

    const filteredAssignments =
        useMemo(() => {
            let result =
                catalogAssignments;

            if (filter === 'active') {
                result = result.filter(
                    (assignment) =>
                        ![
                            'returned',
                        ].includes(
                            String(
                                assignment.assignment_status ||
                                ''
                            ).toLowerCase()
                        )
                );
            }

            if (filter === 'partial') {
                result = result.filter(
                    (assignment) =>
                        String(
                            assignment.assignment_status ||
                            ''
                        ).toLowerCase() ===
                        'partial'
                );
            }

            if (filter === 'returned') {
                result = result.filter(
                    (assignment) =>
                        String(
                            assignment.assignment_status ||
                            ''
                        ).toLowerCase() ===
                        'returned'
                );
            }

            const query =
                search.trim().toLowerCase();

            if (!query) {
                return result;
            }

            return result.filter(
                (assignment) => {
                    const member =
                        assignment.member;

                    const text = [
                        assignment.uniform_name,
                        assignment.assignment_status,
                        assignment.payment_status,
                        assignment.assigned_date,
                        member?.name,
                        member?.its_no,
                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase();

                    return text.includes(
                        query
                    );
                }
            );
        }, [
            catalogAssignments,
            filter,
            search,
        ]);

    const activeCount =
        catalogAssignments.filter(
            (assignment) =>
                String(
                    assignment.assignment_status ||
                    ''
                ).toLowerCase() !==
                'returned'
        ).length;

    const partialCount =
        catalogAssignments.filter(
            (assignment) =>
                String(
                    assignment.assignment_status ||
                    ''
                ).toLowerCase() ===
                'partial'
        ).length;

    const returnedCount =
        catalogAssignments.filter(
            (assignment) =>
                String(
                    assignment.assignment_status ||
                    ''
                ).toLowerCase() ===
                'returned'
        ).length;

    const openAssignment = (
        assignment: UniformAssignment
    ) => {
        router.push({
            pathname:
                '/uniform-assignment-details',
            params: {
                assignment_id:
                    assignment.assignment_id,
            },
        } as any);
    };

    const getStatusStyle = (
        status?: string
    ) => {
        const normalized =
            String(
                status || ''
            ).toLowerCase();

        if (normalized === 'returned') {
            return {
                background: '#F0F0F0',
                color: '#777',
                label: 'RETURNED',
            };
        }

        if (normalized === 'partial') {
            return {
                background: '#FFF4E2',
                color: '#C27A00',
                label: 'PARTIAL',
            };
        }

        if (normalized === 'pending') {
            return {
                background: '#FFF4E2',
                color: '#C27A00',
                label: 'PENDING',
            };
        }

        return {
            background: '#E8FFF0',
            color: '#22B866',
            label:
                normalized
                    ? normalized
                        .replace(
                            /_/g,
                            ' '
                        )
                        .toUpperCase()
                    : 'ACTIVE',
        };
    };

    if (!hasUniformPermission) {
        return (
            <View
                style={
                    styles.centerContainer
                }
            >
                <Ionicons
                    name="lock-closed-outline"
                    size={54}
                    color="#6C4DFF"
                />

                <Text
                    style={styles.errorTitle}
                >
                    Permission Required
                </Text>

                <Text
                    style={
                        styles.errorMessage
                    }
                >
                    You do not have permission to view all uniform assignments.
                </Text>

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={
                        styles.backButton
                    }
                    onPress={() =>
                        router.back()
                    }
                >
                    <Text
                        style={
                            styles.backButtonText
                        }
                    >
                        Go Back
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (loading) {
        return (
            <View
                style={
                    styles.centerContainer
                }
            >
                <View
                    style={
                        styles.loadingIcon
                    }
                >
                    <Ionicons
                        name="people-outline"
                        size={35}
                        color="#6C4DFF"
                    />
                </View>

                <ActivityIndicator
                    size="small"
                    color="#6C4DFF"
                    style={{
                        marginTop: 18,
                    }}
                />

                <Text
                    style={
                        styles.loadingText
                    }
                >
                    Loading assignments...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View
                style={
                    styles.centerContainer
                }
            >
                <View
                    style={styles.errorIcon}
                >
                    <Ionicons
                        name="alert-circle-outline"
                        size={40}
                        color="#FF4D4F"
                    />
                </View>

                <Text
                    style={styles.errorTitle}
                >
                    Unable to load assignments
                </Text>

                <Text
                    style={
                        styles.errorMessage
                    }
                >
                    {error}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={
                        styles.retryButton
                    }
                    onPress={
                        loadAssignments
                    }
                >
                    <Text
                        style={
                            styles.retryText
                        }
                    >
                        Try Again
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={
                    false
                }
                refreshControl={
                    <RefreshControl
                        refreshing={
                            refreshing
                        }
                        onRefresh={
                            onRefresh
                        }
                        colors={[
                            '#5B3DF5',
                        ]}
                        tintColor="#5B3DF5"
                    />
                }
                contentContainerStyle={
                    styles.scrollContent
                }
            >
                {/* HEADER */}

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
                    <View
                        style={
                            styles.headerTop
                        }
                    >
                        <TouchableOpacity
                            activeOpacity={
                                0.7
                            }
                            onPress={() =>
                                router.back()
                            }
                            style={
                                styles.headerBackButton
                            }
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
                                style={
                                    styles.headerTitle
                                }
                                numberOfLines={
                                    1
                                }
                            >
                                Assignments
                            </Text>

                            <Text
                                style={
                                    styles.headerSubtitle
                                }
                                numberOfLines={
                                    1
                                }
                            >
                                {uniformNameFromParams ||
                                    'Uniform assignment history'}
                            </Text>
                        </View>

                        <NotificationBell />
                    </View>
                </LinearGradient>

                {/* SUMMARY */}

                <View
                    style={styles.section}
                >
                    <View
                        style={
                            styles.summaryCard
                        }
                    >
                        <View
                            style={
                                styles.summaryIcon
                            }
                        >
                            <Ionicons
                                name="people-outline"
                                size={26}
                                color="#6C4DFF"
                            />
                        </View>

                        <View
                            style={{
                                flex: 1,
                            }}
                        >
                            <Text
                                style={
                                    styles.summaryTitle
                                }
                            >
                                {catalogAssignments.length}{' '}
                                Assignment
                                {catalogAssignments.length ===
                                    1
                                    ? ''
                                    : 's'}
                            </Text>

                            <Text
                                style={
                                    styles.summarySubtitle
                                }
                            >
                                {activeCount}{' '}
                                active •{' '}
                                {returnedCount}{' '}
                                returned
                            </Text>
                        </View>
                    </View>
                </View>

                {/* SEARCH */}

                <View
                    style={styles.section}
                >
                    <View
                        style={
                            styles.searchContainer
                        }
                    >
                        <Ionicons
                            name="search-outline"
                            size={20}
                            color="#888"
                        />

                        <TextInput
                            value={search}
                            onChangeText={
                                setSearch
                            }
                            placeholder="Search member or assignment..."
                            placeholderTextColor="#999"
                            style={
                                styles.searchInput
                            }
                        />

                        {search.length >
                            0 && (
                                <TouchableOpacity
                                    onPress={() =>
                                        setSearch(
                                            ''
                                        )
                                    }
                                >
                                    <Ionicons
                                        name="close-circle"
                                        size={21}
                                        color="#999"
                                    />
                                </TouchableOpacity>
                            )}
                    </View>
                </View>

                {/* FILTERS */}

                <View
                    style={styles.filterSection}
                >
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={
                            false
                        }
                        contentContainerStyle={
                            styles.filterRow
                        }
                    >
                        {[
                            {
                                key: 'all' as FilterType,
                                label: 'All',
                                count:
                                    catalogAssignments.length,
                            },
                            {
                                key: 'active' as FilterType,
                                label: 'Active',
                                count: activeCount,
                            },
                            {
                                key: 'partial' as FilterType,
                                label: 'Partial',
                                count: partialCount,
                            },
                            {
                                key: 'returned' as FilterType,
                                label: 'Returned',
                                count: returnedCount,
                            },
                        ].map(
                            (item) => (
                                <TouchableOpacity
                                    key={
                                        item.key
                                    }
                                    activeOpacity={
                                        0.8
                                    }
                                    onPress={() =>
                                        setFilter(
                                            item.key
                                        )
                                    }
                                    style={[
                                        styles.filterChip,
                                        filter ===
                                        item.key &&
                                        styles.filterChipActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            filter ===
                                            item.key &&
                                            styles.filterChipTextActive,
                                        ]}
                                    >
                                        {
                                            item.label
                                        }
                                    </Text>

                                    <View
                                        style={[
                                            styles.filterCount,
                                            filter ===
                                            item.key &&
                                            styles.filterCountActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.filterCountText,
                                                filter ===
                                                item.key &&
                                                styles.filterCountTextActive,
                                            ]}
                                        >
                                            {
                                                item.count
                                            }
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        )}
                    </ScrollView>
                </View>

                {/* ASSIGNMENTS */}

                <View
                    style={styles.section}
                >
                    <View
                        style={
                            styles.listHeader
                        }
                    >
                        <View>
                            <Text
                                style={
                                    styles.sectionTitle
                                }
                            >
                                Members
                            </Text>

                            <Text
                                style={
                                    styles.sectionSubtitle
                                }
                            >
                                {filteredAssignments.length}{' '}
                                result
                                {filteredAssignments.length ===
                                    1
                                    ? ''
                                    : 's'}
                            </Text>
                        </View>
                    </View>

                    {filteredAssignments.length ===
                        0 ? (
                        <View
                            style={
                                styles.emptyCard
                            }
                        >
                            <View
                                style={
                                    styles.emptyIcon
                                }
                            >
                                <Ionicons
                                    name="people-outline"
                                    size={35}
                                    color="#8A75E8"
                                />
                            </View>

                            <Text
                                style={
                                    styles.emptyTitle
                                }
                            >
                                No assignments found
                            </Text>

                            <Text
                                style={
                                    styles.emptyText
                                }
                            >
                                No members match the current search or filter.
                            </Text>
                        </View>
                    ) : (
                        filteredAssignments.map(
                            (
                                assignment
                            ) => {
                                const member =
                                    assignment.member;

                                const status =
                                    getStatusStyle(
                                        assignment.assignment_status
                                    );

                                const componentCount =
                                    (
                                        assignment.components ||
                                        []
                                    ).length;

                                return (
                                    <TouchableOpacity
                                        key={
                                            assignment.assignment_id
                                        }
                                        activeOpacity={
                                            0.86
                                        }
                                        style={
                                            styles.assignmentCard
                                        }
                                        onPress={() =>
                                            openAssignment(
                                                assignment
                                            )
                                        }
                                    >
                                        <View
                                            style={
                                                styles.assignmentTop
                                            }
                                        >
                                            {member?.picture ? (
                                                <Image
                                                    source={{
                                                        uri: member.picture,
                                                    }}
                                                    style={
                                                        styles.memberImage
                                                    }
                                                />
                                            ) : (
                                                <View
                                                    style={
                                                        styles.memberAvatar
                                                    }
                                                >
                                                    <Ionicons
                                                        name="person"
                                                        size={21}
                                                        color="#6C4DFF"
                                                    />
                                                </View>
                                            )}

                                            <View
                                                style={{
                                                    flex: 1,
                                                }}
                                            >
                                                <Text
                                                    style={
                                                        styles.memberName
                                                    }
                                                    numberOfLines={
                                                        1
                                                    }
                                                >
                                                    {member?.name ||
                                                        'Unknown Member'}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.memberMeta
                                                    }
                                                >
                                                    {member?.its_no
                                                        ? `ITS: ${member.its_no}`
                                                        : 'ITS number unavailable'}
                                                </Text>
                                            </View>

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
                                                                status.color,
                                                        },
                                                    ]}
                                                >
                                                    {
                                                        status.label
                                                    }
                                                </Text>
                                            </View>
                                        </View>

                                        <View
                                            style={
                                                styles.assignmentInfo
                                            }
                                        >
                                            <View
                                                style={
                                                    styles.infoItem
                                                }
                                            >
                                                <Ionicons
                                                    name="calendar-outline"
                                                    size={16}
                                                    color="#6C4DFF"
                                                />

                                                <Text
                                                    style={
                                                        styles.infoText
                                                    }
                                                >
                                                    {assignment.assigned_date ||
                                                        'Date unavailable'}
                                                </Text>
                                            </View>

                                            <View
                                                style={
                                                    styles.infoItem
                                                }
                                            >
                                                <Ionicons
                                                    name="shirt-outline"
                                                    size={16}
                                                    color="#6C4DFF"
                                                />

                                                <Text
                                                    style={
                                                        styles.infoText
                                                    }
                                                >
                                                    {
                                                        componentCount
                                                    }{' '}
                                                    component
                                                    {componentCount ===
                                                        1
                                                        ? ''
                                                        : 's'}
                                                </Text>
                                            </View>

                                            <View
                                                style={
                                                    styles.infoItem
                                                }
                                            >
                                                <Ionicons
                                                    name={
                                                        assignment.payment_status ===
                                                            'paid'
                                                            ? 'checkmark-circle-outline'
                                                            : 'card-outline'
                                                    }
                                                    size={16}
                                                    color={
                                                        assignment.payment_status ===
                                                            'paid'
                                                            ? '#22B866'
                                                            : '#F59E0B'
                                                    }
                                                />

                                                <Text
                                                    style={[
                                                        styles.infoText,
                                                        {
                                                            color:
                                                                assignment.payment_status ===
                                                                    'paid'
                                                                    ? '#22B866'
                                                                    : '#A46A00',
                                                        },
                                                    ]}
                                                >
                                                    {assignment.payment_status ||
                                                        'unpaid'}
                                                </Text>
                                            </View>
                                        </View>

                                        <View
                                            style={
                                                styles.cardFooter
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.viewDetails
                                                }
                                            >
                                                View assignment details
                                            </Text>

                                            <Ionicons
                                                name="chevron-forward"
                                                size={19}
                                                color="#777"
                                            />
                                        </View>
                                    </TouchableOpacity>
                                );
                            }
                        )
                    )}
                </View>

                <View
                    style={
                        styles.bottomSpace
                    }
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
        paddingBottom: 100,
    },

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

    headerBackButton: {
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
        fontSize: 27,
        fontWeight: '800',
    },

    headerSubtitle: {
        color: '#E9DDFF',
        fontSize: 12.5,
        marginTop: 3,
    },

    section: {
        marginHorizontal: 20,
        marginTop: 21,
    },

    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 21,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },

    summaryIcon: {
        width: 52,
        height: 52,
        borderRadius: 17,
        backgroundColor: '#F0EDFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 13,
    },

    summaryTitle: {
        color: '#16162E',
        fontSize: 18,
        fontWeight: '800',
    },

    summarySubtitle: {
        color: '#777',
        fontSize: 11.5,
        marginTop: 4,
    },

    searchContainer: {
        backgroundColor: '#fff',
        borderRadius: 17,
        minHeight: 54,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },

    searchInput: {
        flex: 1,
        marginLeft: 9,
        color: '#222',
        fontSize: 14,
        paddingVertical: 13,
    },

    filterSection: {
        marginTop: 14,
    },

    filterRow: {
        paddingHorizontal: 20,
        gap: 8,
    },

    filterChip: {
        borderRadius: 13,
        paddingHorizontal: 13,
        paddingVertical: 9,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E2EC',
    },

    filterChipActive: {
        backgroundColor: '#6C4DFF',
        borderColor: '#6C4DFF',
    },

    filterChipText: {
        color: '#666',
        fontSize: 11.5,
        fontWeight: '700',
    },

    filterChipTextActive: {
        color: '#fff',
    },

    filterCount: {
        marginLeft: 6,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#F0EDFF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    filterCountActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },

    filterCountText: {
        color: '#6C4DFF',
        fontSize: 9,
        fontWeight: '800',
    },

    filterCountTextActive: {
        color: '#fff',
    },

    listHeader: {
        marginBottom: 2,
    },

    sectionTitle: {
        color: '#16162E',
        fontSize: 20,
        fontWeight: '800',
    },

    sectionSubtitle: {
        color: '#777',
        fontSize: 12,
        marginTop: 3,
    },

    assignmentCard: {
        backgroundColor: '#fff',
        borderRadius: 21,
        padding: 15,
        marginTop: 11,
        elevation: 2,
    },

    assignmentTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    memberAvatar: {
        width: 47,
        height: 47,
        borderRadius: 15,
        backgroundColor: '#F0EDFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 11,
    },

    memberImage: {
        width: 47,
        height: 47,
        borderRadius: 15,
        marginRight: 11,
    },

    memberName: {
        color: '#16162E',
        fontSize: 15,
        fontWeight: '800',
    },

    memberMeta: {
        color: '#888',
        fontSize: 10.5,
        marginTop: 3,
    },

    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 10,
        marginLeft: 8,
    },

    statusText: {
        fontSize: 8.5,
        fontWeight: '800',
    },

    assignmentInfo: {
        marginTop: 14,
        paddingTop: 11,
        borderTopWidth: 1,
        borderTopColor: '#F0EEF5',
        gap: 8,
    },

    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    infoText: {
        color: '#666',
        fontSize: 11.5,
        marginLeft: 7,
        textTransform: 'capitalize',
    },

    cardFooter: {
        marginTop: 12,
        paddingTop: 11,
        borderTopWidth: 1,
        borderTopColor: '#F0EEF5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    viewDetails: {
        color: '#6C4DFF',
        fontSize: 11.5,
        fontWeight: '700',
    },

    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 21,
        paddingVertical: 38,
        paddingHorizontal: 25,
        alignItems: 'center',
        marginTop: 12,
    },

    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 23,
        backgroundColor: '#EEE9FF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    emptyTitle: {
        color: '#16162E',
        fontSize: 17,
        fontWeight: '800',
        marginTop: 12,
    },

    emptyText: {
        color: '#777',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        marginTop: 5,
    },

    centerContainer: {
        flex: 1,
        backgroundColor: '#F6F4FF',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },

    loadingIcon: {
        width: 78,
        height: 78,
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

    errorIcon: {
        width: 78,
        height: 78,
        borderRadius: 25,
        backgroundColor: '#FFEAEA',
        justifyContent: 'center',
        alignItems: 'center',
    },

    errorTitle: {
        marginTop: 17,
        fontSize: 21,
        fontWeight: '800',
        color: '#16162E',
        textAlign: 'center',
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

    backButton: {
        marginTop: 18,
        paddingHorizontal: 25,
        paddingVertical: 10,
    },

    backButtonText: {
        color: '#6C4DFF',
        fontWeight: '700',
        fontSize: 14,
    },

    bottomSpace: {
        height: 35,
    },
});