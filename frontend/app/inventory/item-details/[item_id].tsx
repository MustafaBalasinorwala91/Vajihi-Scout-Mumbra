import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import NotificationBell from '../../../components/common/NotificationBell';
import { useAuth } from '../../../contexts/AuthContext';
import ImageViewerModal from '../../../components/common/ImageViewerModal';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

function getImageUri(image?: string) {
    if (!image) return null;

    if (
        image.startsWith('http://') ||
        image.startsWith('https://') ||
        image.startsWith('data:')
    ) {
        return image;
    }

    return `data:image/jpeg;base64,${image}`;
}

interface InventoryItem {
    item_id: string;
    name: string;
    category: 'instrument' | 'other';
    description?: string;
    images?: string[];
    total_quantity: number;
    available_quantity: number;
    assigned_quantity: number;
    repair_quantity: number;
    not_usable_quantity: number;
    condition?: string;
    active?: boolean;
}

export default function InventoryItemDetailsScreen() {
    const router = useRouter();
    const { user, hasPermission } = useAuth();

    const isAdmin = user?.role === 'admin';
    const canManageInventory =
        isAdmin || hasPermission('inventory');
    const canDeleteInventory = isAdmin;

    const { item_id } = useLocalSearchParams<{
        item_id: string;
    }>();

    const [item, setItem] = useState<InventoryItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [activeImage, setActiveImage] = useState(0);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);

    const loadItem = useCallback(async () => {
        try {
            setError('');

            if (!BACKEND_URL) {
                throw new Error(
                    'EXPO_PUBLIC_BACKEND_URL is not configured.'
                );
            }

            if (!item_id) {
                throw new Error('Inventory item ID is missing.');
            }

            const token = await AsyncStorage.getItem('session_token');

            if (!token) {
                throw new Error('Session expired. Please login again.');
            }

            const response = await fetch(
                `${BACKEND_URL}/api/inventory/${item_id}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const message = await response.text();

                throw new Error(
                    message ||
                    `Failed to load inventory item (${response.status}).`
                );
            }

            const data = await response.json();

            setActiveImage(0);
            setItem(data);
        } catch (err: any) {
            console.error(
                'Inventory item details error:',
                err
            );

            setError(
                err?.message ||
                'Unable to load inventory item.'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [item_id]);

    useEffect(() => {
        loadItem();
    }, [loadItem]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadItem();
    };

    const handleDelete = () => {
        if (!item) {
            return;
        }

        Alert.alert(
            'Delete Item',
            `Are you sure you want to delete "${item.name}"?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: deleteItem,
                },
            ]
        );
    };

    const deleteItem = async () => {
        if (!canDeleteInventory) {
            Alert.alert(
                'Permission Required',
                'Only an admin can delete inventory items.'
            );
            return;
        }

        try {
            if (!item_id) {
                return;
            }
            const token = await AsyncStorage.getItem('session_token');

            if (!token) {
                throw new Error('Session expired. Please login again.');
            }

            const response = await fetch(
                `${BACKEND_URL}/api/inventory/${item_id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const message = await response.text();

                throw new Error(
                    message ||
                    `Failed to delete item (${response.status}).`
                );
            }

            Alert.alert(
                'Success',
                'Inventory item deleted successfully.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (err: any) {
            console.error(
                'Delete inventory item error:',
                err
            );

            Alert.alert(
                'Unable to Delete',
                err?.message ||
                'Failed to delete inventory item.'
            );
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator
                    size="large"
                    color="#6C4DFF"
                />

                <Text style={styles.loadingText}>
                    Loading item...
                </Text>
            </View>
        );
    }

    if (error || !item) {
        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons
                    name="package-variant-remove"
                    size={54}
                    color="#E05A5A"
                />

                <Text style={styles.errorTitle}>
                    Unable to load item
                </Text>

                <Text style={styles.errorText}>
                    {error || 'Inventory item not found.'}
                </Text>

                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadItem}
                >
                    <Text style={styles.retryButtonText}>
                        Retry
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    const categoryLabel =
        item.category === 'instrument'
            ? 'Instrument'
            : 'Other';

    const stockPercentage =
        item.total_quantity > 0
            ? Math.round(
                (item.available_quantity /
                    item.total_quantity) *
                100
            )
            : 0;

    const hasRepair =
        item.repair_quantity > 0;

    const hasNotUsable =
        item.not_usable_quantity > 0;

    const images = (item.images ?? [])
        .map((image) => getImageUri(image))
        .filter((image): image is string => Boolean(image));

    const currentImage =
        images.length > 0
            ? images[Math.min(activeImage, images.length - 1)]
            : null;

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#6C4DFF', '#8B6FFF']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={23}
                            color="#fff"
                        />
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <Text
                            style={styles.headerTitle}
                            numberOfLines={1}
                        >
                            {item.name}
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            {categoryLabel} details
                        </Text>
                    </View>

                    <NotificationBell />
                </View>
            </LinearGradient>

            {/* Item Images */}
            <View style={styles.imageSection}>
                <View style={styles.mainImageContainer}>
                    {currentImage ? (
                        <TouchableOpacity
                            activeOpacity={0.95}
                            style={styles.imageTapArea}
                            onPress={() => {
                                setViewerIndex(activeImage);
                                setViewerVisible(true);
                            }}
                        >
                            <Image
                                source={{ uri: currentImage }}
                                style={styles.mainImage}
                            />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <MaterialCommunityIcons
                                name={
                                    item.category === 'instrument'
                                        ? 'music-box-multiple'
                                        : 'package-variant-closed'
                                }
                                size={72}
                                color="#6C4DFF"
                            />
                        </View>
                    )}

                    <View style={styles.imageLabelBadge}>
                        <Ionicons
                            name="images-outline"
                            size={14}
                            color="#6C4DFF"
                        />
                        <Text style={styles.imageLabelText}>
                            {images.length > 0
                                ? `${images.length} image${images.length !== 1 ? 's' : ''}`
                                : 'No image'}
                        </Text>
                    </View>
                </View>

                {images.length > 1 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.thumbnailRow}
                    >
                        {images.map((image, index) => (
                            <TouchableOpacity
                                key={`${image.slice(-20)}-${index}`}
                                activeOpacity={0.8}
                                onPress={() => {
                                    setActiveImage(index);
                                    setViewerIndex(index);
                                    setViewerVisible(true);
                                }}
                                style={[
                                    styles.thumbnail,
                                    index === activeImage &&
                                    styles.thumbnailActive,
                                ]}
                            >
                                <Image
                                    source={{ uri: image }}
                                    style={styles.thumbnailImage}
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Item Icon / Hero */}
                <View style={styles.heroCard}>
                    <View style={styles.heroIcon}>
                        <MaterialCommunityIcons
                            name={
                                item.category === 'instrument'
                                    ? 'music-box-multiple'
                                    : 'package-variant-closed'
                            }
                            size={42}
                            color="#6C4DFF"
                        />
                    </View>

                    <View style={styles.heroInfo}>
                        <Text style={styles.itemName}>
                            {item.name}
                        </Text>

                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>
                                {categoryLabel}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.activeBadge,
                            {
                                backgroundColor:
                                    item.active === false
                                        ? '#FFF0F0'
                                        : '#EAF9F0',
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.activeDot,
                                {
                                    backgroundColor:
                                        item.active === false
                                            ? '#E05A5A'
                                            : '#22A06B',
                                },
                            ]}
                        />

                        <Text
                            style={[
                                styles.activeText,
                                {
                                    color:
                                        item.active === false
                                            ? '#D64545'
                                            : '#18864B',
                                },
                            ]}
                        >
                            {item.active === false
                                ? 'Inactive'
                                : 'Active'}
                        </Text>
                    </View>
                </View>

                {/* Stock Overview */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Stock Overview
                    </Text>

                    <View style={styles.stockGrid}>
                        <StockCard
                            icon="layers-outline"
                            label="Total"
                            value={item.total_quantity}
                            iconColor="#6C4DFF"
                            backgroundColor="#F0EDFF"
                        />

                        <StockCard
                            icon="checkmark-circle-outline"
                            label="Available"
                            value={item.available_quantity}
                            iconColor="#22A06B"
                            backgroundColor="#EAF9F0"
                        />

                        <StockCard
                            icon="person-outline"
                            label="Assigned"
                            value={item.assigned_quantity}
                            iconColor="#2878D8"
                            backgroundColor="#EAF3FF"
                        />

                        <StockCard
                            icon="construct-outline"
                            label="Repair"
                            value={item.repair_quantity}
                            iconColor="#F59E0B"
                            backgroundColor="#FFF6E5"
                        />

                        <StockCard
                            icon="close-circle-outline"
                            label="Not Usable"
                            value={item.not_usable_quantity}
                            iconColor="#E05A5A"
                            backgroundColor="#FFF0F0"
                        />
                    </View>
                </View>

                {/* Availability */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Availability
                    </Text>

                    <View style={styles.availabilityCard}>
                        <View style={styles.availabilityHeader}>
                            <Text style={styles.availabilityLabel}>
                                Available Stock
                            </Text>

                            <Text style={styles.availabilityValue}>
                                {item.available_quantity} /{' '}
                                {item.total_quantity}
                            </Text>
                        </View>

                        <View style={styles.progressBackground}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${stockPercentage}%`,
                                    },
                                ]}
                            />
                        </View>

                        <Text style={styles.progressText}>
                            {stockPercentage}% currently available
                        </Text>
                    </View>
                </View>

                {/* Item Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Item Information
                    </Text>

                    <View style={styles.infoCard}>
                        <InfoRow
                            icon="cube-outline"
                            label="Category"
                            value={categoryLabel}
                        />

                        <InfoRow
                            icon="shield-checkmark-outline"
                            label="Condition"
                            value={
                                item.condition || 'Not specified'
                            }
                        />

                        <InfoRow
                            icon="barcode-outline"
                            label="Item ID"
                            value={item.item_id}
                        />

                        {item.description ? (
                            <View style={styles.descriptionContainer}>
                                <View style={styles.descriptionIcon}>
                                    <Ionicons
                                        name="document-text-outline"
                                        size={20}
                                        color="#777"
                                    />
                                </View>

                                <View
                                    style={
                                        styles.descriptionContent
                                    }
                                >
                                    <Text
                                        style={styles.infoLabel}
                                    >
                                        Description
                                    </Text>

                                    <Text
                                        style={
                                            styles.descriptionText
                                        }
                                    >
                                        {item.description}
                                    </Text>
                                </View>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Issues */}
                {(hasRepair || hasNotUsable) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Attention
                        </Text>

                        <View style={styles.issueCard}>
                            {hasRepair && (
                                <View style={styles.issueRow}>
                                    <View
                                        style={[
                                            styles.issueIcon,
                                            {
                                                backgroundColor:
                                                    '#FFF6E5',
                                            },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="tools"
                                            size={20}
                                            color="#F59E0B"
                                        />
                                    </View>

                                    <View
                                        style={styles.issueContent}
                                    >
                                        <Text
                                            style={
                                                styles.issueTitle
                                            }
                                        >
                                            Under Repair
                                        </Text>

                                        <Text
                                            style={
                                                styles.issueText
                                            }
                                        >
                                            {item.repair_quantity}{' '}
                                            item
                                            {item.repair_quantity !==
                                                1
                                                ? 's'
                                                : ''}{' '}
                                            currently under repair.
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {hasNotUsable && (
                                <View style={styles.issueRow}>
                                    <View
                                        style={[
                                            styles.issueIcon,
                                            {
                                                backgroundColor:
                                                    '#FFF0F0',
                                            },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="close-circle-outline"
                                            size={20}
                                            color="#E05A5A"
                                        />
                                    </View>

                                    <View
                                        style={styles.issueContent}
                                    >
                                        <Text
                                            style={
                                                styles.issueTitle
                                            }
                                        >
                                            Not Usable
                                        </Text>

                                        <Text
                                            style={
                                                styles.issueText
                                            }
                                        >
                                            {item.not_usable_quantity}{' '}
                                            item
                                            {item.not_usable_quantity !==
                                                1
                                                ? 's'
                                                : ''}{' '}
                                            marked as not usable.
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Actions */}
                {canManageInventory && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Actions
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.actionButton}
                            onPress={() => {
                                router.push({
                                    pathname: '/inventory/edit-item/[item_id]',
                                    params: {
                                        item_id: item.item_id,
                                    },
                                });
                            }}
                        >
                            <View
                                style={[
                                    styles.actionIcon,
                                    {
                                        backgroundColor: '#F0EDFF',
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="create-outline"
                                    size={22}
                                    color="#6C4DFF"
                                />
                            </View>

                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>
                                    Edit Item
                                </Text>

                                <Text style={styles.actionSubtitle}>
                                    Update item details and stock information
                                </Text>
                            </View>

                            <Ionicons
                                name="chevron-forward"
                                size={21}
                                color="#999"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.actionButton}
                            onPress={() => {
                                router.push({
                                    pathname: '/inventory/assign-item/[id]',
                                    params: {
                                        id: item.item_id,
                                    },
                                });
                            }}
                        >
                            <View
                                style={[
                                    styles.actionIcon,
                                    {
                                        backgroundColor: '#EAF3FF',
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="person-add-outline"
                                    size={22}
                                    color="#2878D8"
                                />
                            </View>

                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>
                                    Assign Item
                                </Text>

                                <Text style={styles.actionSubtitle}>
                                    Assign this item to a member
                                </Text>
                            </View>

                            <Ionicons
                                name="chevron-forward"
                                size={21}
                                color="#999"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.actionButton}
                            onPress={() => {
                                router.push({
                                    pathname: '/inventory/assignment-history/[item_id]',
                                    params: {
                                        item_id: item.item_id,
                                    },
                                });
                            }}
                        >
                            <View
                                style={[
                                    styles.actionIcon,
                                    {
                                        backgroundColor: '#F0EDFF',
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="time-outline"
                                    size={22}
                                    color="#6C4DFF"
                                />
                            </View>

                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>
                                    Assignment History
                                </Text>

                                <Text style={styles.actionSubtitle}>
                                    View current and previous assignments
                                </Text>
                            </View>

                            <Ionicons
                                name="chevron-forward"
                                size={21}
                                color="#999"
                            />
                        </TouchableOpacity>

                        {canDeleteInventory && (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                style={styles.deleteButton}
                                onPress={handleDelete}
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={21}
                                    color="#D64545"
                                />

                                <Text style={styles.deleteButtonText}>
                                    Delete Inventory Item
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={styles.bottomSpacing} />
            </ScrollView>

            <ImageViewerModal
                visible={viewerVisible}
                images={images}
                initialIndex={viewerIndex}
                title={item.name || 'Inventory Images'}
                onClose={() => setViewerVisible(false)}
            />
        </View>
    );
}

function StockCard({
    icon,
    label,
    value,
    iconColor,
    backgroundColor,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: number;
    iconColor: string;
    backgroundColor: string;
}) {
    return (
        <View style={styles.stockCard}>
            <View
                style={[
                    styles.stockIcon,
                    { backgroundColor },
                ]}
            >
                <Ionicons
                    name={icon}
                    size={20}
                    color={iconColor}
                />
            </View>

            <Text style={styles.stockValue}>
                {value}
            </Text>

            <Text style={styles.stockLabel}>
                {label}
            </Text>
        </View>
    );
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
}) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
                <Ionicons
                    name={icon}
                    size={20}
                    color="#777"
                />
            </View>

            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>
                    {label}
                </Text>

                <Text
                    style={styles.infoValue}
                    numberOfLines={2}
                >
                    {value}
                </Text>
            </View>
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

    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    headerButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.18)',
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

    imageSection: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 2,
    },

    mainImageContainer: {
        position: 'relative',
        height: 230,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#F0EDFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },

    imageTapArea: {
        width: '100%',
        height: '100%',
    },

    mainImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    imagePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    imageLabelBadge: {
        position: 'absolute',
        right: 12,
        bottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.94)',
    },

    imageLabelText: {
        marginLeft: 5,
        fontSize: 11,
        fontWeight: '700',
        color: '#4E3AAE',
    },

    thumbnailRow: {
        paddingTop: 10,
        paddingBottom: 4,
        paddingRight: 4,
        gap: 9,
    },

    thumbnail: {
        width: 64,
        height: 64,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#ECEAF6',
        borderWidth: 2,
        borderColor: 'transparent',
    },

    thumbnailActive: {
        borderColor: '#6C4DFF',
    },

    thumbnailImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    heroCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },

    heroIcon: {
        width: 64,
        height: 64,
        borderRadius: 18,
        backgroundColor: '#F0EDFF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    heroInfo: {
        flex: 1,
        marginLeft: 13,
    },

    itemName: {
        fontSize: 19,
        fontWeight: '800',
        color: '#202020',
    },

    categoryBadge: {
        alignSelf: 'flex-start',
        marginTop: 7,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: '#F0EDFF',
    },

    categoryBadgeText: {
        color: '#6C4DFF',
        fontSize: 11,
        fontWeight: '700',
    },

    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 20,
    },

    activeDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        marginRight: 5,
    },

    activeText: {
        fontSize: 11,
        fontWeight: '700',
    },

    section: {
        marginBottom: 20,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#202020',
        marginBottom: 10,
    },

    stockGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 9,
    },

    stockCard: {
        width: '31.8%',
        minHeight: 115,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 1,
    },

    stockIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 7,
    },

    stockValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#222',
    },

    stockLabel: {
        fontSize: 11,
        color: '#777',
        marginTop: 2,
    },

    availabilityCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
    },

    availabilityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    availabilityLabel: {
        fontSize: 14,
        color: '#555',
        fontWeight: '600',
    },

    availabilityValue: {
        fontSize: 14,
        color: '#202020',
        fontWeight: '800',
    },

    progressBackground: {
        height: 9,
        backgroundColor: '#ECECF2',
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 13,
    },

    progressFill: {
        height: '100%',
        backgroundColor: '#6C4DFF',
        borderRadius: 10,
    },

    progressText: {
        fontSize: 11,
        color: '#888',
        marginTop: 7,
    },

    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 15,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F3',
    },

    infoIcon: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: '#F4F4F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 11,
    },

    infoContent: {
        flex: 1,
    },

    infoLabel: {
        fontSize: 11,
        color: '#888',
        marginBottom: 3,
    },

    infoValue: {
        fontSize: 14,
        color: '#252525',
        fontWeight: '600',
    },

    descriptionContainer: {
        flexDirection: 'row',
        paddingVertical: 14,
    },

    descriptionIcon: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: '#F4F4F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 11,
    },

    descriptionContent: {
        flex: 1,
    },

    descriptionText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#444',
    },

    issueCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
    },

    issueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    issueIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    issueContent: {
        flex: 1,
    },

    issueTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#333',
    },

    issueText: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
    },

    actionButton: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },

    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    actionContent: {
        flex: 1,
    },

    actionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#222',
    },

    actionSubtitle: {
        fontSize: 11,
        color: '#888',
        marginTop: 3,
    },

    deleteButton: {
        height: 52,
        borderRadius: 15,
        backgroundColor: '#FFF0F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },

    deleteButtonText: {
        color: '#D64545',
        fontSize: 14,
        fontWeight: '800',
        marginLeft: 8,
    },

    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        backgroundColor: '#F7F7FB',
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
        marginTop: 15,
    },

    errorText: {
        fontSize: 13,
        color: '#777',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 19,
    },

    retryButton: {
        marginTop: 20,
        backgroundColor: '#6C4DFF',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 12,
    },

    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },

    bottomSpacing: {
        height: 30,
    },
});