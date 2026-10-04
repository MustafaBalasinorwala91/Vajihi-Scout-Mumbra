import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

import NotificationBell from '../../../components/common/NotificationBell';
import { useAuth } from '../../../contexts/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface InventoryItem {
    item_id: string;
    name: string;
    category: 'instrument' | 'other';
    total_quantity: number;
    available_quantity: number;
    assigned_quantity: number;
}

interface Assignment {
    assignment_id: string;
    item_id: string;
    user_id: string;
    user_name?: string;
    member_name?: string;
    quantity: number;
    status: string;
    assigned_by?: string;
    assigned_date?: string;
    returned_date?: string;
    remarks?: string;
    created_at?: string;
    updated_at?: string;
}

interface Member {
    user_id: string;
    name?: string;
    role?: string;
}

type FilterType = 'all' | 'active' | 'returned';

export default function AssignmentHistoryScreen() {
    const router = useRouter();
    const { user, hasPermission } = useAuth();

    const isAdmin = user?.role === 'admin';
    const canManageInventory =
        isAdmin || hasPermission('inventory');

    const { item_id } = useLocalSearchParams<{
        item_id: string;
    }>();

    const [item, setItem] =
        useState<InventoryItem | null>(null);

    const [assignments, setAssignments] =
        useState<Assignment[]>([]);

    const [members, setMembers] =
        useState<Member[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState('');

    const [filter, setFilter] =
        useState<FilterType>('all');

    const [search, setSearch] =
        useState('');

    const getAuthHeaders = useCallback(async (includeJson = false) => {
        const token = await AsyncStorage.getItem('session_token');

        if (!token) {
            throw new Error('Session expired. Please login again.');
        }

        return {
            Authorization: `Bearer ${token}`,
            ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
        };
    }, []);

    const loadData = useCallback(async () => {
        try {
            setError('');

            if (!BACKEND_URL) {
                throw new Error(
                    'EXPO_PUBLIC_BACKEND_URL is not configured.'
                );
            }

            if (!item_id) {
                throw new Error(
                    'Inventory item ID is missing.'
                );
            }

            /*
             * Load the item first.
             */
            const itemResponse = await fetch(
                `${BACKEND_URL}/api/inventory/${item_id}`,
                {
                    method: 'GET',
                    headers: await getAuthHeaders(),
                }
            );

            if (!itemResponse.ok) {
                const message =
                    await itemResponse.text();

                throw new Error(
                    message ||
                    `Failed to load item (${itemResponse.status}).`
                );
            }

            const itemData =
                await itemResponse.json();

            setItem(itemData);

            /*
             * The backend assignment endpoint is not exposed
             * as a separate history GET in the current API.
             *
             * We therefore try the assigned inventory endpoint.
             */
            const assignmentResponse =
                await fetch(
                    `${BACKEND_URL}/api/inventory/assigned`,
                    {
                        method: 'GET',
                        headers: await getAuthHeaders(),
                    }
                );

            if (!assignmentResponse.ok) {
                const message =
                    await assignmentResponse.text();

                throw new Error(
                    message ||
                    `Failed to load assignments (${assignmentResponse.status}).`
                );
            }

            const assignmentData =
                await assignmentResponse.json();

            const assignmentList =
                Array.isArray(assignmentData)
                    ? assignmentData
                    : Array.isArray(
                        assignmentData?.items
                    )
                        ? assignmentData.items
                        : [];

            /*
             * Keep only assignments belonging
             * to this inventory item.
             */
            const itemAssignments =
                assignmentList.filter(
                    (assignment: Assignment) =>
                        assignment.item_id ===
                        item_id
                );

            setAssignments(
                itemAssignments
            );

            /*
             * Members are optional here.
             * They are used only to improve the
             * displayed member name if the assignment
             * response contains only user_id.
             */
            try {
                const membersResponse =
                    await fetch(
                        `${BACKEND_URL}/api/attendance/members`,
                        {
                            method: 'GET',
                            headers: await getAuthHeaders(),
                        }
                    );

                if (membersResponse.ok) {
                    const membersData =
                        await membersResponse.json();

                    const memberList =
                        Array.isArray(
                            membersData
                        )
                            ? membersData
                            : [];

                    setMembers(
                        memberList
                    );
                }
            } catch {
                /*
                 * Member lookup is optional.
                 * Assignment history can still
                 * work without it.
                 */
            }
        } catch (err: any) {
            console.error(
                'Assignment history error:',
                err
            );

            setError(
                err?.message ||
                'Unable to load assignment history.'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [item_id, getAuthHeaders]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getMemberName = (
        assignment: Assignment
    ) => {
        if (
            assignment.member_name
        ) {
            return assignment.member_name;
        }

        if (
            assignment.user_name
        ) {
            return assignment.user_name;
        }

        const member =
            members.find(
                (entry) =>
                    entry.user_id ===
                    assignment.user_id
            );

        if (member?.name) {
            return member.name;
        }

        return `Member ${assignment.user_id}`;
    };

    const filteredAssignments =
        useMemo(() => {
            const searchText =
                search
                    .trim()
                    .toLowerCase();

            return assignments.filter(
                (assignment) => {
                    const memberName =
                        getMemberName(
                            assignment
                        ).toLowerCase();

                    const matchesSearch =
                        !searchText ||
                        memberName.includes(
                            searchText
                        ) ||
                        assignment.user_id
                            .toLowerCase()
                            .includes(
                                searchText
                            );

                    if (!matchesSearch) {
                        return false;
                    }

                    const status =
                        assignment.status
                            ?.toLowerCase();

                    if (
                        filter ===
                        'active'
                    ) {
                        return (
                            status ===
                            'active' ||
                            status ===
                            'assigned'
                        );
                    }

                    if (
                        filter ===
                        'returned'
                    ) {
                        return (
                            status ===
                            'returned'
                        );
                    }

                    return true;
                }
            );
        }, [
            assignments,
            filter,
            search,
            members,
        ]);

    const activeAssignments =
        assignments.filter(
            (assignment) => {
                const status =
                    assignment.status
                        ?.toLowerCase();

                return (
                    status ===
                    'active' ||
                    status ===
                    'assigned'
                );
            }
        );

    const returnedAssignments =
        assignments.filter(
            (assignment) =>
                assignment.status
                    ?.toLowerCase() ===
                'returned'
        );

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
    };

    const handleReturn = (
        assignment: Assignment
    ) => {
        const memberName =
            getMemberName(
                assignment
            );

        Alert.alert(
            'Return Item',
            `Return ${assignment.quantity} ${item?.name || 'item'
            } from ${memberName}?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Return',
                    onPress: () =>
                        returnAssignment(
                            assignment
                        ),
                },
            ]
        );
    };

    const returnAssignment =
        async (
            assignment: Assignment
        ) => {
            if (!canManageInventory) {
                Alert.alert(
                    'Permission Required',
                    'You do not have permission to return inventory items.'
                );
                return;
            }

            try {
                setSubmittingId(
                    assignment.assignment_id
                );

                const response =
                    await fetch(
                        `${BACKEND_URL}/api/inventory/assignment/${assignment.assignment_id}/return`,
                        {
                            method: 'PUT',
                            headers: await getAuthHeaders(true),
                            body: JSON.stringify({}),
                        }
                    );

                const responseText =
                    await response.text();

                let responseData:
                    any = null;

                try {
                    responseData =
                        responseText
                            ? JSON.parse(
                                responseText
                            )
                            : null;
                } catch {
                    responseData =
                        null;
                }

                if (!response.ok) {
                    throw new Error(
                        responseData?.detail ||
                        responseText ||
                        `Return failed (${response.status}).`
                    );
                }

                Alert.alert(
                    'Item Returned',
                    `${item?.name || 'Item'} has been returned successfully.`
                );

                await loadData();
            } catch (err: any) {
                console.error(
                    'Return inventory error:',
                    err
                );

                Alert.alert(
                    'Unable to Return',
                    err?.message ||
                    'Failed to return item.'
                );
            } finally {
                setSubmittingId(
                    null
                );
            }
        };

    const [
        submittingId,
        setSubmittingId,
    ] = useState<string | null>(
        null
    );

    if (!canManageInventory) {
        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons
                    name="lock-outline"
                    size={54}
                    color="#777"
                />

                <Text style={styles.errorTitle}>
                    Permission Required
                </Text>

                <Text style={styles.errorText}>
                    You do not have permission to view inventory assignment history.
                </Text>

                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.retryButtonText}>
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
                <ActivityIndicator
                    size="large"
                    color="#6C4DFF"
                />

                <Text
                    style={
                        styles.loadingText
                    }
                >
                    Loading assignment history...
                </Text>
            </View>
        );
    }

    if (error || !item) {
        return (
            <View
                style={
                    styles.centerContainer
                }
            >
                <MaterialCommunityIcons
                    name="history"
                    size={54}
                    color="#E05A5A"
                />

                <Text
                    style={
                        styles.errorTitle
                    }
                >
                    Unable to load history
                </Text>

                <Text
                    style={
                        styles.errorText
                    }
                >
                    {error ||
                        'Inventory item not found.'}
                </Text>

                <TouchableOpacity
                    style={
                        styles.retryButton
                    }
                    onPress={
                        loadData
                    }
                >
                    <Text
                        style={
                            styles.retryButtonText
                        }
                    >
                        Retry
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View
            style={
                styles.container
            }
        >
            {/* Header */}
            <LinearGradient
                colors={[
                    '#6C4DFF',
                    '#8B6FFF',
                ]}
                style={
                    styles.header
                }
            >
                <View
                    style={
                        styles.headerRow
                    }
                >
                    <TouchableOpacity
                        style={
                            styles.backButton
                        }
                        onPress={() =>
                            router.back()
                        }
                    >
                        <Ionicons
                            name="arrow-back"
                            size={23}
                            color="#fff"
                        />
                    </TouchableOpacity>

                    <View
                        style={
                            styles.headerTitleContainer
                        }
                    >
                        <Text
                            style={
                                styles.headerTitle
                            }
                        >
                            Assignment History
                        </Text>

                        <Text
                            style={
                                styles.headerSubtitle
                            }
                            numberOfLines={
                                1
                            }
                        >
                            {item.name}
                        </Text>
                    </View>

                    <NotificationBell />
                </View>
            </LinearGradient>

            <ScrollView
                style={
                    styles.scrollView
                }
                contentContainerStyle={
                    styles.content
                }
                refreshControl={
                    <RefreshControl
                        refreshing={
                            refreshing
                        }
                        onRefresh={
                            handleRefresh
                        }
                    />
                }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={
                    false
                }
            >
                {/* Summary */}
                <View
                    style={
                        styles.summaryCard
                    }
                >
                    <View
                        style={
                            styles.summaryItem
                        }
                    >
                        <Text
                            style={
                                styles.summaryValue
                            }
                        >
                            {
                                activeAssignments.length
                            }
                        </Text>

                        <Text
                            style={
                                styles.summaryLabel
                            }
                        >
                            Active
                        </Text>
                    </View>

                    <View
                        style={
                            styles.summaryDivider
                        }
                    />

                    <View
                        style={
                            styles.summaryItem
                        }
                    >
                        <Text
                            style={
                                styles.summaryValue
                            }
                        >
                            {
                                returnedAssignments.length
                            }
                        </Text>

                        <Text
                            style={
                                styles.summaryLabel
                            }
                        >
                            Returned
                        </Text>
                    </View>

                    <View
                        style={
                            styles.summaryDivider
                        }
                    />

                    <View
                        style={
                            styles.summaryItem
                        }
                    >
                        <Text
                            style={
                                styles.summaryValue
                            }
                        >
                            {
                                item.assigned_quantity
                            }
                        </Text>

                        <Text
                            style={
                                styles.summaryLabel
                            }
                        >
                            Assigned
                        </Text>
                    </View>
                </View>

                {/* Search */}
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
                        placeholder="Search member..."
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
                                    size={19}
                                    color="#aaa"
                                />
                            </TouchableOpacity>
                        )}
                </View>

                {/* Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                        false
                    }
                    style={
                        styles.filterScroll
                    }
                    contentContainerStyle={
                        styles.filterContainer
                    }
                >
                    {(
                        [
                            [
                                'all',
                                'All',
                            ],
                            [
                                'active',
                                'Active',
                            ],
                            [
                                'returned',
                                'Returned',
                            ],
                        ] as [
                            FilterType,
                            string
                        ][]
                    ).map(
                        ([
                            value,
                            label,
                        ]) => (
                            <TouchableOpacity
                                key={
                                    value
                                }
                                activeOpacity={
                                    0.8
                                }
                                style={[
                                    styles.filterButton,
                                    filter ===
                                    value &&
                                    styles.filterButtonActive,
                                ]}
                                onPress={() =>
                                    setFilter(
                                        value
                                    )
                                }
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        filter ===
                                        value &&
                                        styles.filterTextActive,
                                    ]}
                                >
                                    {
                                        label
                                    }
                                </Text>
                            </TouchableOpacity>
                        )
                    )}
                </ScrollView>

                {/* Assignment List */}
                <View
                    style={
                        styles.sectionHeader
                    }
                >
                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Assignments
                    </Text>

                    <Text
                        style={
                            styles.resultCount
                        }
                    >
                        {
                            filteredAssignments.length
                        }{' '}
                        record
                        {filteredAssignments.length !==
                            1
                            ? 's'
                            : ''}
                    </Text>
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
                                size={34}
                                color="#999"
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
                            No assignment records match the current filter.
                        </Text>
                    </View>
                ) : (
                    filteredAssignments.map(
                        (
                            assignment
                        ) => {
                            const status =
                                assignment.status?.toLowerCase();

                            const active =
                                status ===
                                'active' ||
                                status ===
                                'assigned';

                            const memberName =
                                getMemberName(
                                    assignment
                                );

                            const returning =
                                submittingId ===
                                assignment.assignment_id;

                            return (
                                <View
                                    key={
                                        assignment.assignment_id
                                    }
                                    style={
                                        styles.assignmentCard
                                    }
                                >
                                    <View
                                        style={
                                            styles.assignmentTop
                                        }
                                    >
                                        <View
                                            style={
                                                styles.avatar
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.avatarText
                                                }
                                            >
                                                {memberName
                                                    .trim()
                                                    .charAt(
                                                        0
                                                    )
                                                    .toUpperCase()}
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.memberInfo
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.memberName
                                                }
                                                numberOfLines={
                                                    1
                                                }
                                            >
                                                {
                                                    memberName
                                                }
                                            </Text>

                                            <Text
                                                style={
                                                    styles.memberId
                                                }
                                                numberOfLines={
                                                    1
                                                }
                                            >
                                                {
                                                    assignment.user_id
                                                }
                                            </Text>
                                        </View>

                                        <View
                                            style={[
                                                styles.statusBadge,
                                                {
                                                    backgroundColor:
                                                        active
                                                            ? '#EAF9F0'
                                                            : '#F1F1F4',
                                                },
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.statusDot,
                                                    {
                                                        backgroundColor:
                                                            active
                                                                ? '#22A06B'
                                                                : '#888',
                                                    },
                                                ]}
                                            />

                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    {
                                                        color:
                                                            active
                                                                ? '#18864B'
                                                                : '#777',
                                                    },
                                                ]}
                                            >
                                                {active
                                                    ? 'Active'
                                                    : 'Returned'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View
                                        style={
                                            styles.assignmentDetails
                                        }
                                    >
                                        <View
                                            style={
                                                styles.detailBox
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.detailLabel
                                                }
                                            >
                                                Quantity
                                            </Text>

                                            <Text
                                                style={
                                                    styles.detailValue
                                                }
                                            >
                                                {
                                                    assignment.quantity
                                                }
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.detailBox
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.detailLabel
                                                }
                                            >
                                                Assigned
                                            </Text>

                                            <Text
                                                style={
                                                    styles.detailValue
                                                }
                                            >
                                                {formatDate(
                                                    assignment.assigned_date ||
                                                    assignment.created_at
                                                )}
                                            </Text>
                                        </View>

                                        {assignment.returned_date && (
                                            <View
                                                style={
                                                    styles.detailBox
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.detailLabel
                                                    }
                                                >
                                                    Returned
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.detailValue
                                                    }
                                                >
                                                    {formatDate(
                                                        assignment.returned_date
                                                    )}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {assignment.remarks ? (
                                        <View
                                            style={
                                                styles.remarksBox
                                            }
                                        >
                                            <Ionicons
                                                name="chatbubble-outline"
                                                size={15}
                                                color="#777"
                                            />

                                            <Text
                                                style={
                                                    styles.remarksText
                                                }
                                            >
                                                {
                                                    assignment.remarks
                                                }
                                            </Text>
                                        </View>
                                    ) : null}

                                    {active && (
                                        <TouchableOpacity
                                            activeOpacity={
                                                0.85
                                            }
                                            disabled={
                                                returning
                                            }
                                            style={[
                                                styles.returnButton,
                                                returning &&
                                                styles.returnButtonDisabled,
                                            ]}
                                            onPress={() =>
                                                handleReturn(
                                                    assignment
                                                )
                                            }
                                        >
                                            {returning ? (
                                                <ActivityIndicator
                                                    size="small"
                                                    color="#D64545"
                                                />
                                            ) : (
                                                <>
                                                    <Ionicons
                                                        name="return-down-back-outline"
                                                        size={19}
                                                        color="#D64545"
                                                    />

                                                    <Text
                                                        style={
                                                            styles.returnButtonText
                                                        }
                                                    >
                                                        Return Item
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        }
                    )
                )}

                <View
                    style={
                        styles.bottomSpacing
                    }
                />
            </ScrollView>
        </View>
    );
}

function formatDate(
    value?: string
) {
    if (!value) {
        return '—';
    }

    try {
        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }

        return date.toLocaleDateString(
            'en-IN',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }
        );
    } catch {
        return value;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7FB',
    },

    header: {
        paddingTop: 52,
        paddingBottom: 18,
        paddingHorizontal: 18,
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor:
            'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTitleContainer: {
        flex: 1,
        marginHorizontal: 12,
    },

    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
    },

    headerSubtitle: {
        color: 'rgba(255,255,255,0.78)',
        fontSize: 12,
        marginTop: 2,
    },

    scrollView: {
        flex: 1,
    },

    content: {
        padding: 16,
    },

    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 17,
        paddingVertical: 17,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 13,
        elevation: 1,
    },

    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },

    summaryValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#6C4DFF',
    },

    summaryLabel: {
        fontSize: 11,
        color: '#888',
        marginTop: 3,
    },

    summaryDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#E5E5EA',
    },

    searchContainer: {
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },

    searchInput: {
        flex: 1,
        marginHorizontal: 9,
        fontSize: 14,
        color: '#222',
    },

    filterScroll: {
        marginBottom: 17,
    },

    filterContainer: {
        gap: 8,
    },

    filterButton: {
        paddingHorizontal: 17,
        height: 37,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },

    filterButtonActive: {
        backgroundColor: '#6C4DFF',
    },

    filterText: {
        fontSize: 12,
        color: '#777',
        fontWeight: '700',
    },

    filterTextActive: {
        color: '#fff',
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 9,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#222',
    },

    resultCount: {
        fontSize: 11,
        color: '#888',
    },

    assignmentCard: {
        backgroundColor: '#fff',
        borderRadius: 17,
        padding: 15,
        marginBottom: 11,
        elevation: 1,
    },

    assignmentTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    avatar: {
        width: 45,
        height: 45,
        borderRadius: 23,
        backgroundColor: '#EAE5FF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatarText: {
        color: '#6C4DFF',
        fontSize: 17,
        fontWeight: '900',
    },

    memberInfo: {
        flex: 1,
        marginLeft: 11,
        marginRight: 8,
    },

    memberName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#222',
    },

    memberId: {
        fontSize: 10,
        color: '#999',
        marginTop: 3,
    },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 20,
    },

    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 5,
    },

    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },

    assignmentDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 14,
        gap: 8,
    },

    detailBox: {
        flex: 1,
        minWidth: 90,
        backgroundColor: '#F7F7FA',
        borderRadius: 11,
        padding: 10,
    },

    detailLabel: {
        fontSize: 10,
        color: '#999',
        marginBottom: 3,
    },

    detailValue: {
        fontSize: 12,
        color: '#333',
        fontWeight: '700',
    },

    remarksBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F7F7FA',
        borderRadius: 11,
        padding: 10,
        marginTop: 9,
    },

    remarksText: {
        flex: 1,
        fontSize: 11,
        color: '#666',
        lineHeight: 16,
        marginLeft: 7,
    },

    returnButton: {
        height: 43,
        borderRadius: 12,
        backgroundColor: '#FFF0F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 11,
    },

    returnButtonDisabled: {
        opacity: 0.65,
    },

    returnButtonText: {
        color: '#D64545',
        fontSize: 13,
        fontWeight: '800',
        marginLeft: 7,
    },

    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 17,
        padding: 35,
        alignItems: 'center',
    },

    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F1F1F4',
        alignItems: 'center',
        justifyContent: 'center',
    },

    emptyTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#333',
        marginTop: 12,
    },

    emptyText: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        marginTop: 5,
        lineHeight: 18,
    },

    centerContainer: {
        flex: 1,
        backgroundColor: '#F7F7FB',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },

    loadingText: {
        marginTop: 12,
        color: '#777',
        fontSize: 14,
    },

    errorTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#222',
        marginTop: 14,
    },

    errorText: {
        color: '#777',
        textAlign: 'center',
        textAlignVertical: 'center',
        marginTop: 7,
        lineHeight: 19,
    },

    retryButton: {
        marginTop: 18,
        backgroundColor: '#6C4DFF',
        paddingHorizontal: 24,
        paddingVertical: 11,
        borderRadius: 12,
    },

    retryButtonText: {
        color: '#fff',
        fontWeight: '700',
    },

    bottomSpacing: {
        height: 30,
    },
});