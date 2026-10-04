import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import NotificationBell from '../../../components/common/NotificationBell';
import { useAuth } from '../../../contexts/AuthContext';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface InventoryItem {
    item_id: string;
    name: string;
    category: 'instrument' | 'other';
    available_quantity: number;
    total_quantity: number;
}

interface Member {
    user_id: string;
    name?: string;
    role?: string;
    picture?: string;
}

export default function AssignInventoryItemScreen() {
    const router = useRouter();

    const { user, hasPermission } = useAuth();

    const isAdmin = user?.role === 'admin';

    const canManageInventory =
        isAdmin || hasPermission('inventory');

    const { id } = useLocalSearchParams<{
        id: string;
    }>();

    const [item, setItem] = useState<InventoryItem | null>(null);
    const [members, setMembers] = useState<Member[]>([]);

    const [selectedMember, setSelectedMember] =
        useState<Member | null>(null);

    const [quantity, setQuantity] = useState('1');
    const [remarks, setRemarks] = useState('');

    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const getAuthHeaders = async (includeJson = false) => {
        const token = await AsyncStorage.getItem('session_token');

        if (!token) {
            throw new Error('Session expired. Please login again.');
        }

        return {
            ...(includeJson
                ? { 'Content-Type': 'application/json' }
                : {}),
            Authorization: `Bearer ${token}`,
        };
    };

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            if (!BACKEND_URL) {
                throw new Error(
                    'EXPO_PUBLIC_BACKEND_URL is not configured.'
                );
            }

            if (!id) {
                throw new Error(
                    'Inventory item ID is missing.'
                );
            }

            const authHeaders = await getAuthHeaders();

            const [itemResponse, membersResponse] =
                await Promise.all([
                    fetch(
                        `${BACKEND_URL}/api/inventory/${id}`,
                        {
                            method: 'GET',
                            headers: authHeaders,
                        }
                    ),

                    fetch(
                        `${BACKEND_URL}/api/attendance/members`,
                        {
                            method: 'GET',
                            headers: authHeaders,
                        }
                    ),
                ]);

            if (!itemResponse.ok) {
                const message =
                    await itemResponse.text();

                throw new Error(
                    message ||
                    `Failed to load item (${itemResponse.status}).`
                );
            }

            if (!membersResponse.ok) {
                const message =
                    await membersResponse.text();

                throw new Error(
                    message ||
                    `Failed to load members (${membersResponse.status}).`
                );
            }

            const itemData =
                await itemResponse.json();

            const membersData =
                await membersResponse.json();

            setItem(itemData);

            const memberList = Array.isArray(
                membersData
            )
                ? membersData
                : [];

            setMembers(memberList);
        } catch (err: any) {
            console.error(
                'Assign inventory load error:',
                err
            );

            setError(
                err?.message ||
                'Unable to load assignment data.'
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredMembers = useMemo(() => {
        const text = search
            .trim()
            .toLowerCase();

        if (!text) {
            return members;
        }

        return members.filter((member) =>
            (member.name || '')
                .toLowerCase()
                .includes(text)
        );
    }, [members, search]);

    const numericQuantity = Math.max(
        0,
        Number.parseInt(quantity, 10) || 0
    );

    const handleAssign = async () => {
        if (!canManageInventory) {
            Alert.alert(
                'Permission Required',
                'You do not have permission to assign inventory items.'
            );
            return;
        }

        if (!item) {
            return;
        }

        if (!selectedMember) {
            Alert.alert(
                'Select Member',
                'Please select a member before assigning this item.'
            );
            return;
        }

        if (numericQuantity < 1) {
            Alert.alert(
                'Invalid Quantity',
                'Quantity must be at least 1.'
            );
            return;
        }

        if (
            numericQuantity >
            item.available_quantity
        ) {
            Alert.alert(
                'Insufficient Stock',
                `Only ${item.available_quantity} item${item.available_quantity !== 1
                    ? 's'
                    : ''
                } available.`
            );
            return;
        }

        try {
            setSubmitting(true);

            if (!BACKEND_URL) {
                throw new Error(
                    'EXPO_PUBLIC_BACKEND_URL is not configured.'
                );
            }

            const authHeaders = await getAuthHeaders(true);

            const response = await fetch(
                `${BACKEND_URL}/api/inventory/${item.item_id}/assign`,
                {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({
                        user_id:
                            selectedMember.user_id,
                        quantity:
                            numericQuantity,
                        assigned_date:
                            new Date()
                                .toISOString()
                                .split('T')[0],
                        remarks:
                            remarks.trim() || null,
                    }),
                }
            );

            const responseText =
                await response.text();

            let responseData: any = null;

            try {
                responseData =
                    responseText
                        ? JSON.parse(
                            responseText
                        )
                        : null;
            } catch {
                responseData = null;
            }

            if (!response.ok) {
                throw new Error(
                    responseData?.detail ||
                    responseText ||
                    `Assignment failed (${response.status}).`
                );
            }

            Alert.alert(
                'Assignment Successful',
                `${item.name} has been assigned to ${selectedMember.name ||
                'the selected member'
                }.`,
                [
                    {
                        text: 'OK',
                        onPress: () =>
                            router.back(),
                    },
                ]
            );
        } catch (err: any) {
            console.error(
                'Assign inventory error:',
                err
            );

            Alert.alert(
                'Unable to Assign',
                err?.message ||
                'Failed to assign inventory item.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (!canManageInventory) {
        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons
                    name="lock-outline"
                    size={54}
                    color="#6C4DFF"
                />

                <Text style={styles.errorTitle}>
                    Permission Required
                </Text>

                <Text style={styles.errorText}>
                    You do not have permission to assign inventory items.
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
            <View style={styles.centerContainer}>
                <ActivityIndicator
                    size="large"
                    color="#6C4DFF"
                />

                <Text style={styles.loadingText}>
                    Loading assignment...
                </Text>
            </View>
        );
    }

    if (error || !item) {
        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={52}
                    color="#E05A5A"
                />

                <Text style={styles.errorTitle}>
                    Unable to load
                </Text>

                <Text style={styles.errorText}>
                    {error ||
                        'Inventory item not found.'}
                </Text>

                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadData}
                >
                    <Text style={styles.retryButtonText}>
                        Retry
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[
                    '#6C4DFF',
                    '#8B6FFF',
                ]}
                style={styles.header}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        style={styles.backButton}
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
                            Assign Item
                        </Text>

                        <Text
                            style={
                                styles.headerSubtitle
                            }
                        >
                            Assign inventory to a member
                        </Text>
                    </View>

                    <NotificationBell />
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={
                    styles.content
                }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Item */}
                <View style={styles.itemCard}>
                    <View
                        style={
                            styles.itemIconContainer
                        }
                    >
                        <MaterialCommunityIcons
                            name={
                                item.category ===
                                    'instrument'
                                    ? 'music-box-multiple'
                                    : 'package-variant-closed'
                            }
                            size={30}
                            color="#6C4DFF"
                        />
                    </View>

                    <View
                        style={
                            styles.itemInfo
                        }
                    >
                        <Text
                            style={
                                styles.itemName
                            }
                            numberOfLines={2}
                        >
                            {item.name}
                        </Text>

                        <Text
                            style={
                                styles.itemCategory
                            }
                        >
                            {item.category ===
                                'instrument'
                                ? 'Instrument'
                                : 'Other'}
                        </Text>
                    </View>
                </View>

                {/* Stock */}
                <View
                    style={
                        styles.stockCard
                    }
                >
                    <View>
                        <Text
                            style={
                                styles.stockLabel
                            }
                        >
                            Available Stock
                        </Text>

                        <Text
                            style={
                                styles.stockValue
                            }
                        >
                            {
                                item.available_quantity
                            }
                        </Text>
                    </View>

                    <View
                        style={
                            styles.stockIcon
                        }
                    >
                        <Ionicons
                            name="cube-outline"
                            size={24}
                            color="#22A06B"
                        />
                    </View>
                </View>

                {/* Member */}
                <View
                    style={
                        styles.section
                    }
                >
                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Select Member
                    </Text>

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
                                        setSearch('')
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

                    <View
                        style={
                            styles.membersCard
                        }
                    >
                        {filteredMembers.length ===
                            0 ? (
                            <View
                                style={
                                    styles.emptyMembers
                                }
                            >
                                <Ionicons
                                    name="people-outline"
                                    size={34}
                                    color="#aaa"
                                />

                                <Text
                                    style={
                                        styles.emptyText
                                    }
                                >
                                    No members found
                                </Text>
                            </View>
                        ) : (
                            filteredMembers.map(
                                (member) => {
                                    const selected =
                                        selectedMember?.user_id ===
                                        member.user_id;

                                    return (
                                        <TouchableOpacity
                                            key={
                                                member.user_id
                                            }
                                            activeOpacity={
                                                0.8
                                            }
                                            style={[
                                                styles.memberRow,
                                                selected &&
                                                styles.memberRowSelected,
                                            ]}
                                            onPress={() =>
                                                setSelectedMember(
                                                    member
                                                )
                                            }
                                        >
                                            <View
                                                style={
                                                    styles.memberAvatar
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.memberAvatarText
                                                    }
                                                >
                                                    {(
                                                        member.name ||
                                                        '?'
                                                    )
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
                                                >
                                                    {member.name ||
                                                        'Unnamed Member'}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.memberRole
                                                    }
                                                >
                                                    {member.role ||
                                                        'Member'}
                                                </Text>
                                            </View>

                                            <View
                                                style={[
                                                    styles.radio,
                                                    selected &&
                                                    styles.radioSelected,
                                                ]}
                                            >
                                                {selected && (
                                                    <View
                                                        style={
                                                            styles.radioInner
                                                        }
                                                    />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }
                            )
                        )}
                    </View>
                </View>

                {/* Quantity */}
                <View
                    style={
                        styles.section
                    }
                >
                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Quantity
                    </Text>

                    <View
                        style={
                            styles.quantityCard
                        }
                    >
                        <TouchableOpacity
                            style={
                                styles.quantityButton
                            }
                            onPress={() =>
                                setQuantity(
                                    String(
                                        Math.max(
                                            1,
                                            numericQuantity -
                                            1
                                        )
                                    )
                                )
                            }
                        >
                            <Ionicons
                                name="remove"
                                size={22}
                                color="#6C4DFF"
                            />
                        </TouchableOpacity>

                        <TextInput
                            value={quantity}
                            onChangeText={(value) =>
                                setQuantity(
                                    value.replace(
                                        /[^0-9]/g,
                                        ''
                                    )
                                )
                            }
                            keyboardType="number-pad"
                            style={
                                styles.quantityInput
                            }
                            textAlign="center"
                        />

                        <TouchableOpacity
                            style={
                                styles.quantityButton
                            }
                            onPress={() =>
                                setQuantity(
                                    String(
                                        Math.min(
                                            item.available_quantity,
                                            numericQuantity +
                                            1
                                        )
                                    )
                                )
                            }
                        >
                            <Ionicons
                                name="add"
                                size={22}
                                color="#6C4DFF"
                            />
                        </TouchableOpacity>
                    </View>

                    <Text
                        style={
                            styles.helperText
                        }
                    >
                        Maximum available:{' '}
                        {
                            item.available_quantity
                        }
                    </Text>
                </View>

                {/* Remarks */}
                <View
                    style={
                        styles.section
                    }
                >
                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Remarks
                        <Text
                            style={
                                styles.optionalText
                            }
                        >
                            {' '}
                            (Optional)
                        </Text>
                    </Text>

                    <TextInput
                        value={remarks}
                        onChangeText={
                            setRemarks
                        }
                        placeholder="Add any notes about this assignment..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        style={
                            styles.remarksInput
                        }
                    />
                </View>

                {/* Summary */}
                {selectedMember && (
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
                                name="checkmark-circle"
                                size={24}
                                color="#22A06B"
                            />
                        </View>

                        <View
                            style={
                                styles.summaryContent
                            }
                        >
                            <Text
                                style={
                                    styles.summaryTitle
                                }
                            >
                                Ready to Assign
                            </Text>

                            <Text
                                style={
                                    styles.summaryText
                                }
                            >
                                {numericQuantity}{' '}
                                {item.name}{' '}
                                to{' '}
                                {
                                    selectedMember.name
                                }
                            </Text>
                        </View>
                    </View>
                )}

                {/* Submit */}
                <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={submitting}
                    style={[
                        styles.assignButton,
                        submitting &&
                        styles.assignButtonDisabled,
                    ]}
                    onPress={
                        handleAssign
                    }
                >
                    {submitting ? (
                        <ActivityIndicator
                            size="small"
                            color="#fff"
                        />
                    ) : (
                        <>
                            <Ionicons
                                name="person-add-outline"
                                size={21}
                                color="#fff"
                            />

                            <Text
                                style={
                                    styles.assignButtonText
                                }
                            >
                                Assign Item
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <View
                    style={
                        styles.bottomSpacing
                    }
                />
            </ScrollView>
        </View>
    );
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

    itemCard: {
        backgroundColor: '#fff',
        borderRadius: 17,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 2,
    },

    itemIconContainer: {
        width: 55,
        height: 55,
        borderRadius: 15,
        backgroundColor: '#F0EDFF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    itemInfo: {
        flex: 1,
        marginLeft: 12,
    },

    itemName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#222',
    },

    itemCategory: {
        fontSize: 12,
        color: '#777',
        marginTop: 4,
    },

    stockCard: {
        backgroundColor: '#EAF9F0',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 22,
    },

    stockLabel: {
        fontSize: 12,
        color: '#4D7861',
        fontWeight: '600',
    },

    stockValue: {
        fontSize: 27,
        color: '#18864B',
        fontWeight: '900',
        marginTop: 2,
    },

    stockIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },

    section: {
        marginBottom: 21,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#222',
        marginBottom: 10,
    },

    optionalText: {
        color: '#999',
        fontSize: 12,
        fontWeight: '500',
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

    membersCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
    },

    memberRow: {
        minHeight: 68,
        paddingHorizontal: 13,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F3',
    },

    memberRowSelected: {
        backgroundColor: '#F5F2FF',
    },

    memberAvatar: {
        width: 43,
        height: 43,
        borderRadius: 22,
        backgroundColor: '#EAE5FF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    memberAvatarText: {
        color: '#6C4DFF',
        fontSize: 16,
        fontWeight: '800',
    },

    memberInfo: {
        flex: 1,
        marginLeft: 11,
    },

    memberName: {
        fontSize: 14,
        color: '#222',
        fontWeight: '700',
    },

    memberRole: {
        fontSize: 11,
        color: '#888',
        marginTop: 3,
    },

    radio: {
        width: 23,
        height: 23,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#C8C8D0',
        alignItems: 'center',
        justifyContent: 'center',
    },

    radioSelected: {
        borderColor: '#6C4DFF',
    },

    radioInner: {
        width: 11,
        height: 11,
        borderRadius: 6,
        backgroundColor: '#6C4DFF',
    },

    emptyMembers: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 35,
    },

    emptyText: {
        color: '#888',
        fontSize: 13,
        marginTop: 8,
    },

    quantityCard: {
        height: 62,
        backgroundColor: '#fff',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    quantityButton: {
        width: 44,
        height: 44,
        borderRadius: 13,
        backgroundColor: '#F0EDFF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    quantityInput: {
        width: 80,
        fontSize: 21,
        fontWeight: '800',
        color: '#222',
        marginHorizontal: 10,
    },

    helperText: {
        color: '#888',
        fontSize: 11,
        marginTop: 6,
    },

    remarksInput: {
        minHeight: 105,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 14,
        fontSize: 13,
        color: '#333',
    },

    summaryCard: {
        backgroundColor: '#EAF9F0',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },

    summaryIcon: {
        width: 43,
        height: 43,
        borderRadius: 13,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },

    summaryContent: {
        flex: 1,
        marginLeft: 11,
    },

    summaryTitle: {
        color: '#18864B',
        fontSize: 13,
        fontWeight: '800',
    },

    summaryText: {
        color: '#47705A',
        fontSize: 12,
        marginTop: 3,
    },

    assignButton: {
        height: 54,
        borderRadius: 16,
        backgroundColor: '#6C4DFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    assignButtonDisabled: {
        opacity: 0.65,
    },

    assignButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
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