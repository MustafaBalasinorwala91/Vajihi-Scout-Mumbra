import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import ImageViewerModal from '../../../components/common/ImageViewerModal';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import NotificationBell from '../../../components/common/NotificationBell';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../contexts/AuthContext';

type Category = 'instrument' | 'other';

interface InventoryItem {
    item_id: string;
    name: string;
    category: Category;
    description?: string | null;
    images?: string[];
    total_quantity?: number;
    available_quantity?: number;
    assigned_quantity?: number;
    repair_quantity?: number;
    not_usable_quantity?: number;
    condition?: string | null;
    active?: boolean;
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const MAX_IMAGES = 15;

const CONDITION_OPTIONS = [
    'excellent',
    'good',
    'fair',
    'poor',
    'damaged',
];

export default function EditInventoryItemScreen() {
    const router = useRouter();
    const { user, hasPermission } = useAuth();
    const params = useLocalSearchParams<{ item_id: string | string[] }>();

    const isAdmin = user?.role === 'admin';
    const canManageInventory =
        isAdmin || hasPermission('inventory');

    const itemId = Array.isArray(params.item_id)
        ? params.item_id[0]
        : params.item_id;

    const [item, setItem] = useState<InventoryItem | null>(null);

    const [name, setName] = useState('');
    const [category, setCategory] = useState<Category>('instrument');
    const [description, setDescription] = useState('');
    const [totalQuantity, setTotalQuantity] = useState('');
    const [condition, setCondition] = useState('good');
    const [active, setActive] = useState(true);
    const [images, setImages] = useState<string[]>([]);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const assignedQuantity = item?.assigned_quantity ?? 0;
    const repairQuantity = item?.repair_quantity ?? 0;
    const notUsableQuantity = item?.not_usable_quantity ?? 0;

    const minimumAllowedQuantity =
        assignedQuantity + repairQuantity + notUsableQuantity;

    const parsedTotalQuantity = Number.parseInt(totalQuantity, 10);

    const quantityIsValid =
        Number.isInteger(parsedTotalQuantity) &&
        parsedTotalQuantity >= minimumAllowedQuantity;

    const canSave =
        name.trim().length > 0 &&
        totalQuantity.trim().length > 0 &&
        quantityIsValid &&
        !saving;

    const getAuthHeaders = async (
        includeJson = false
    ): Promise<Record<string, string>> => {
        const token =
            await AsyncStorage.getItem('session_token');

        if (!token) {
            throw new Error(
                'Session expired. Please login again.'
            );
        }

        return {
            Authorization: `Bearer ${token}`,
            ...(includeJson
                ? { 'Content-Type': 'application/json' }
                : {}),
        };
    };

    const loadItem = useCallback(async () => {
        if (!itemId) {
            setError('Inventory item ID is missing.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');

            if (!BACKEND_URL) {
                throw new Error(
                    'EXPO_PUBLIC_BACKEND_URL is not configured.'
                );
            }

            const response = await fetch(
                `${BACKEND_URL}/api/inventory/${itemId}`,
                {
                    method: 'GET',
                    headers: await getAuthHeaders(),
                }
            );

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    data?.message ||
                    'Failed to load inventory item.'
                );
            }

            const loadedItem: InventoryItem =
                data?.item ?? data;

            setItem(loadedItem);

            setName(loadedItem.name ?? '');
            setCategory(
                loadedItem.category === 'other'
                    ? 'other'
                    : 'instrument'
            );
            setDescription(loadedItem.description ?? '');
            setTotalQuantity(
                String(loadedItem.total_quantity ?? 0)
            );
            setCondition(
                loadedItem.condition?.toLowerCase() || 'good'
            );
            setActive(loadedItem.active !== false);
            setImages(loadedItem.images ?? []);
        } catch (err: any) {
            console.error('Load inventory item error:', err);

            setError(
                err?.message ||
                'Unable to load inventory item.'
            );
        } finally {
            setLoading(false);
        }
    }, [itemId]);

    useEffect(() => {
        loadItem();
    }, [loadItem]);

    const availableQuantity = useMemo(() => {
        if (!item) return 0;

        return (
            parsedTotalQuantity -
            assignedQuantity -
            repairQuantity -
            notUsableQuantity
        );
    }, [
        item,
        parsedTotalQuantity,
        assignedQuantity,
        repairQuantity,
        notUsableQuantity,
    ]);

    const pickImages = async () => {
        if (images.length >= MAX_IMAGES) {
            Alert.alert(
                'Image Limit',
                `You can add up to ${MAX_IMAGES} images.`
            );
            return;
        }

        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert(
                'Permission Required',
                'Please allow photo access to add item images.'
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: MAX_IMAGES - images.length,
            quality: 0.65,
            base64: true,
        });

        if (result.canceled) return;

        const picked = result.assets
            .map((asset) =>
                asset.base64
                    ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
                    : asset.uri
            )
            .filter(Boolean);

        setImages((current) =>
            [...current, ...picked].slice(0, MAX_IMAGES)
        );
    };

    const removeImage = (index: number) => {
        setImages((current) =>
            current.filter((_, i) => i !== index)
        );
    };

    const handleSave = async () => {
        if (!canManageInventory) {
            Alert.alert(
                'Permission Required',
                'You do not have inventory permission to edit this item.'
            );
            return;
        }

        if (!itemId || !item) return;

        const trimmedName = name.trim();
        const trimmedDescription = description.trim();

        if (!trimmedName) {
            Alert.alert(
                'Name Required',
                'Please enter an item name.'
            );
            return;
        }

        if (!Number.isInteger(parsedTotalQuantity)) {
            Alert.alert(
                'Invalid Quantity',
                'Please enter a valid total quantity.'
            );
            return;
        }

        if (parsedTotalQuantity < minimumAllowedQuantity) {
            Alert.alert(
                'Invalid Quantity',
                `Total quantity cannot be less than ${minimumAllowedQuantity} because items are already assigned, under repair, or not usable.`
            );
            return;
        }

        try {
            setSaving(true);
            setError('');

            if (!BACKEND_URL) {
                throw new Error(
                    'EXPO_PUBLIC_BACKEND_URL is not configured.'
                );
            }

            const payload = {
                name: trimmedName,
                category,
                description: trimmedDescription || null,
                images,
                total_quantity: parsedTotalQuantity,
                condition,
                active,
            };

            const response = await fetch(
                `${BACKEND_URL}/api/inventory/${itemId}`,
                {
                    method: 'PUT',
                    headers: await getAuthHeaders(true),
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    data?.message ||
                    'Failed to update inventory item.'
                );
            }

            Alert.alert(
                'Updated Successfully',
                'Inventory item has been updated.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            router.back();
                        },
                    },
                ]
            );
        } catch (err: any) {
            console.error(
                'Update inventory item error:',
                err
            );

            Alert.alert(
                'Update Failed',
                err?.message ||
                'Unable to update inventory item.'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        if (saving) return;
        router.back();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color="#2563EB"
                />

                <Text style={styles.loadingText}>
                    Loading inventory item...
                </Text>
            </View>
        );
    }

    if (!item) {
        return (
            <View style={styles.errorContainer}>
                <View style={styles.errorIcon}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={42}
                        color="#DC2626"
                    />
                </View>

                <Text style={styles.errorTitle}>
                    Unable to Load Item
                </Text>

                <Text style={styles.errorMessage}>
                    {error ||
                        'The inventory item could not be found.'}
                </Text>

                <TouchableOpacity
                    style={styles.backButton}
                    activeOpacity={0.85}
                    onPress={handleBack}
                >
                    <Ionicons
                        name="arrow-back"
                        size={20}
                        color="#FFFFFF"
                    />

                    <Text style={styles.backButtonText}>
                        Go Back
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!canManageInventory) {
        return (
            <View style={styles.errorContainer}>
                <View style={styles.errorIcon}>
                    <Ionicons
                        name="lock-closed-outline"
                        size={42}
                        color="#2563EB"
                    />
                </View>

                <Text style={styles.errorTitle}>
                    Permission Required
                </Text>

                <Text style={styles.errorMessage}>
                    You do not have inventory permission to edit this item.
                </Text>

                <TouchableOpacity
                    style={styles.backButton}
                    activeOpacity={0.85}
                    onPress={handleBack}
                >
                    <Ionicons
                        name="arrow-back"
                        size={20}
                        color="#FFFFFF"
                    />

                    <Text style={styles.backButtonText}>
                        Go Back
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#2B145A', '#6C4DFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        disabled={saving}
                        onPress={handleBack}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={23}
                            color="#fff"
                        />
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>
                            Edit Item
                        </Text>

                        <Text
                            style={styles.headerSubtitle}
                            numberOfLines={1}
                        >
                            {item.name}
                        </Text>
                    </View>

                    <NotificationBell />
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.pageIntro}>
                        <View style={styles.pageIntroIcon}>
                            <MaterialCommunityIcons
                                name="package-variant-closed"
                                size={28}
                                color="#2563EB"
                            />
                        </View>

                        <View style={styles.pageIntroText}>
                            <Text style={styles.pageTitle}>
                                Update Inventory
                            </Text>

                            <Text style={styles.pageSubtitle}>
                                Modify the details and stock information
                                for this item.
                            </Text>
                        </View>
                    </View>

                    {/* Basic Information */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons
                                    name="information-circle-outline"
                                    size={21}
                                    color="#2563EB"
                                />
                            </View>

                            <View>
                                <Text style={styles.sectionTitle}>
                                    Basic Information
                                </Text>

                                <Text style={styles.sectionSubtitle}>
                                    Item name and category
                                </Text>
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>
                                Item Name
                            </Text>

                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="cube-outline"
                                    size={20}
                                    color="#6B7280"
                                />

                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter item name"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input}
                                    editable={!saving}
                                    maxLength={100}
                                />
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>
                                Category
                            </Text>

                            <View style={styles.categoryRow}>
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    disabled={saving}
                                    style={[
                                        styles.categoryOption,
                                        category === 'instrument' &&
                                        styles.categoryOptionActive,
                                    ]}
                                    onPress={() =>
                                        setCategory('instrument')
                                    }
                                >
                                    <MaterialCommunityIcons
                                        name="music-note"
                                        size={21}
                                        color={
                                            category === 'instrument'
                                                ? '#2563EB'
                                                : '#6B7280'
                                        }
                                    />

                                    <Text
                                        style={[
                                            styles.categoryOptionText,
                                            category === 'instrument' &&
                                            styles.categoryOptionTextActive,
                                        ]}
                                    >
                                        Instrument
                                    </Text>

                                    {category === 'instrument' && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={20}
                                            color="#2563EB"
                                        />
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    disabled={saving}
                                    style={[
                                        styles.categoryOption,
                                        category === 'other' &&
                                        styles.categoryOptionActive,
                                    ]}
                                    onPress={() =>
                                        setCategory('other')
                                    }
                                >
                                    <MaterialCommunityIcons
                                        name="package-variant"
                                        size={21}
                                        color={
                                            category === 'other'
                                                ? '#2563EB'
                                                : '#6B7280'
                                        }
                                    />

                                    <Text
                                        style={[
                                            styles.categoryOptionText,
                                            category === 'other' &&
                                            styles.categoryOptionTextActive,
                                        ]}
                                    >
                                        Other
                                    </Text>

                                    {category === 'other' && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={20}
                                            color="#2563EB"
                                        />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>
                                Description
                            </Text>

                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Add a description..."
                                placeholderTextColor="#9CA3AF"
                                style={styles.textArea}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                editable={!saving}
                                maxLength={500}
                            />

                            <Text style={styles.characterCount}>
                                {description.length}/500
                            </Text>
                        </View>
                    </View>

                    {/* Images */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons
                                    name="images-outline"
                                    size={21}
                                    color="#2563EB"
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.sectionTitle}>
                                    Images
                                </Text>

                                <Text style={styles.sectionSubtitle}>
                                    Add up to {MAX_IMAGES} photos
                                </Text>
                            </View>

                            <Text style={styles.imageCountText}>
                                {images.length}/{MAX_IMAGES}
                            </Text>
                        </View>

                        <Text style={styles.imageHelperText}>
                            Tap any photo to open it full-screen. You can zoom and inspect it closely.
                        </Text>

                        <View style={styles.imageGrid}>
                            {images.map((image, index) => (
                                <View
                                    key={`${index}-${image.slice(-10)}`}
                                    style={styles.imageWrapper}
                                >
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            setViewerIndex(index);
                                            setViewerVisible(true);
                                        }}
                                    >
                                        <Image
                                            source={{ uri: image }}
                                            style={styles.itemImage}
                                        />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        style={styles.removeImageButton}
                                        onPress={() => removeImage(index)}
                                        disabled={saving}
                                    >
                                        <Ionicons
                                            name="close"
                                            size={16}
                                            color="#FFFFFF"
                                        />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {images.length < MAX_IMAGES && (
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    style={styles.addImageBox}
                                    onPress={pickImages}
                                    disabled={saving}
                                >
                                    <Ionicons
                                        name="camera-outline"
                                        size={27}
                                        color="#2563EB"
                                    />
                                    <Text style={styles.addImageText}>
                                        Add Image
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Stock Information */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <MaterialCommunityIcons
                                    name="warehouse"
                                    size={21}
                                    color="#2563EB"
                                />
                            </View>

                            <View>
                                <Text style={styles.sectionTitle}>
                                    Stock Information
                                </Text>

                                <Text style={styles.sectionSubtitle}>
                                    Update total available stock
                                </Text>
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>
                                Total Quantity
                            </Text>

                            <View style={styles.inputWrapper}>
                                <MaterialCommunityIcons
                                    name="numeric"
                                    size={20}
                                    color="#6B7280"
                                />

                                <TextInput
                                    value={totalQuantity}
                                    onChangeText={(value) => {
                                        const cleaned =
                                            value.replace(/[^0-9]/g, '');

                                        setTotalQuantity(cleaned);
                                    }}
                                    placeholder="Enter quantity"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input}
                                    keyboardType="number-pad"
                                    editable={!saving}
                                    maxLength={6}
                                />
                            </View>

                            <Text style={styles.helperText}>
                                Minimum allowed total quantity:{' '}
                                <Text style={styles.helperBold}>
                                    {minimumAllowedQuantity}
                                </Text>
                            </Text>
                        </View>

                        <View style={styles.stockSummary}>
                            <View style={styles.stockSummaryHeader}>
                                <Text style={styles.stockSummaryTitle}>
                                    Current Stock Allocation
                                </Text>

                                <MaterialCommunityIcons
                                    name="information-outline"
                                    size={18}
                                    color="#6B7280"
                                />
                            </View>

                            <View style={styles.stockGrid}>
                                <View style={styles.stockBox}>
                                    <Text style={styles.stockValue}>
                                        {assignedQuantity}
                                    </Text>

                                    <Text style={styles.stockLabel}>
                                        Assigned
                                    </Text>
                                </View>

                                <View style={styles.stockBox}>
                                    <Text style={styles.stockValue}>
                                        {repairQuantity}
                                    </Text>

                                    <Text style={styles.stockLabel}>
                                        Repair
                                    </Text>
                                </View>

                                <View style={styles.stockBox}>
                                    <Text style={styles.stockValue}>
                                        {notUsableQuantity}
                                    </Text>

                                    <Text style={styles.stockLabel}>
                                        Not Usable
                                    </Text>
                                </View>

                                <View style={styles.stockBox}>
                                    <Text
                                        style={[
                                            styles.stockValue,
                                            availableQuantity < 0 &&
                                            styles.invalidValue,
                                        ]}
                                    >
                                        {Number.isFinite(availableQuantity)
                                            ? Math.max(
                                                availableQuantity,
                                                0
                                            )
                                            : 0}
                                    </Text>

                                    <Text style={styles.stockLabel}>
                                        Available
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {!quantityIsValid &&
                            totalQuantity.length > 0 && (
                                <View style={styles.warningBox}>
                                    <Ionicons
                                        name="warning-outline"
                                        size={20}
                                        color="#B45309"
                                    />

                                    <Text style={styles.warningText}>
                                        Total quantity must be at least{' '}
                                        {minimumAllowedQuantity}.
                                    </Text>
                                </View>
                            )}
                    </View>

                    {/* Condition */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <MaterialCommunityIcons
                                    name="clipboard-check-outline"
                                    size={21}
                                    color="#2563EB"
                                />
                            </View>

                            <View>
                                <Text style={styles.sectionTitle}>
                                    Condition
                                </Text>

                                <Text style={styles.sectionSubtitle}>
                                    Current overall condition
                                </Text>
                            </View>
                        </View>

                        <View style={styles.conditionGrid}>
                            {CONDITION_OPTIONS.map((option) => {
                                const selected =
                                    condition === option;

                                return (
                                    <TouchableOpacity
                                        key={option}
                                        activeOpacity={0.85}
                                        disabled={saving}
                                        style={[
                                            styles.conditionOption,
                                            selected &&
                                            styles.conditionOptionActive,
                                        ]}
                                        onPress={() =>
                                            setCondition(option)
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.conditionText,
                                                selected &&
                                                styles.conditionTextActive,
                                            ]}
                                        >
                                            {option
                                                .charAt(0)
                                                .toUpperCase() +
                                                option.slice(1)}
                                        </Text>

                                        {selected && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={18}
                                                color="#2563EB"
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Status */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons
                                    name="power-outline"
                                    size={21}
                                    color="#2563EB"
                                />
                            </View>

                            <View style={styles.statusHeaderText}>
                                <Text style={styles.sectionTitle}>
                                    Item Status
                                </Text>

                                <Text style={styles.sectionSubtitle}>
                                    Control whether this item is active
                                </Text>
                            </View>

                            <Switch
                                value={active}
                                onValueChange={setActive}
                                disabled={saving}
                                trackColor={{
                                    false: '#D1D5DB',
                                    true: '#93C5FD',
                                }}
                                thumbColor={
                                    active ? '#2563EB' : '#F9FAFB'
                                }
                            />
                        </View>

                        <View
                            style={[
                                styles.statusBanner,
                                active
                                    ? styles.activeBanner
                                    : styles.inactiveBanner,
                            ]}
                        >
                            <Ionicons
                                name={
                                    active
                                        ? 'checkmark-circle'
                                        : 'pause-circle'
                                }
                                size={20}
                                color={
                                    active ? '#15803D' : '#6B7280'
                                }
                            />

                            <Text
                                style={[
                                    styles.statusBannerText,
                                    active
                                        ? styles.activeBannerText
                                        : styles.inactiveBannerText,
                                ]}
                            >
                                {active
                                    ? 'This item is active and available in the inventory catalogue.'
                                    : 'This item is inactive and should not be used for new assignments.'}
                            </Text>
                        </View>
                    </View>

                    {/* Error */}
                    {error ? (
                        <View style={styles.errorBanner}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={21}
                                color="#DC2626"
                            />

                            <Text style={styles.errorBannerText}>
                                {error}
                            </Text>
                        </View>
                    ) : null}

                    {/* Save Button */}
                    <TouchableOpacity
                        activeOpacity={0.88}
                        disabled={!canSave}
                        onPress={handleSave}
                        style={[
                            styles.saveButtonContainer,
                            !canSave &&
                            styles.saveButtonDisabled,
                        ]}
                    >
                        <LinearGradient
                            colors={
                                canSave
                                    ? ['#2563EB', '#1D4ED8']
                                    : ['#CBD5E1', '#94A3B8']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.saveButton}
                        >
                            {saving ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#FFFFFF"
                                />
                            ) : (
                                <Ionicons
                                    name="save-outline"
                                    size={21}
                                    color="#FFFFFF"
                                />
                            )}

                            <Text style={styles.saveButtonText}>
                                {saving
                                    ? 'Saving Changes...'
                                    : 'Save Changes'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={saving}
                        style={styles.cancelButton}
                        onPress={handleBack}
                    >
                        <Text style={styles.cancelButtonText}>
                            Cancel
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.bottomSpace} />
                </ScrollView>
            </KeyboardAvoidingView>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    keyboardContainer: {
        flex: 1,
    },

    scrollView: {
        flex: 1,
    },

    content: {
        width: '100%',
        maxWidth: 900,
        alignSelf: 'center',
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 40,
    },

    header: {
        paddingTop: 62,
        paddingHorizontal: 18,
        paddingBottom: 23,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },

    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    headerButton: {
        width: 42,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 7,
    },

    headerTitleContainer: {
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
        fontSize: 12,
        marginTop: 2,
    },

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        padding: 24,
    },

    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },

    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        padding: 24,
    },

    errorIcon: {
        width: 76,
        height: 76,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
        marginBottom: 16,
    },

    errorTitle: {
        fontSize: 21,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },

    errorMessage: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 21,
        textAlign: 'center',
        maxWidth: 500,
        marginBottom: 20,
    },

    backButton: {
        minHeight: 46,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    backButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    pageIntro: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },

    pageIntroIcon: {
        width: 58,
        height: 58,
        borderRadius: 16,
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
    },

    pageIntroText: {
        flex: 1,
        marginLeft: 14,
    },

    pageTitle: {
        fontSize: 23,
        fontWeight: '800',
        color: '#111827',
    },

    pageSubtitle: {
        marginTop: 3,
        fontSize: 13,
        lineHeight: 19,
        color: '#6B7280',
    },

    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
        elevation: 2,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },

    sectionIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        marginRight: 11,
    },

    sectionHeaderText: {
        flex: 1,
    },

    statusHeaderText: {
        flex: 1,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },

    sectionSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },

    imageCountText: {
        color: '#2563EB',
        fontSize: 12,
        fontWeight: '800',
    },

    imageHelperText: {
        color: '#6B7280',
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 12,
    },

    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },

    imageWrapper: {
        width: 94,
        height: 94,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#EFF6FF',
    },

    itemImage: {
        width: 94,
        height: 94,
        resizeMode: 'cover',
    },

    removeImageButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    addImageBox: {
        width: 94,
        height: 94,
        borderRadius: 14,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: '#B7C9FF',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFF',
    },

    addImageText: {
        color: '#2563EB',
        fontSize: 11,
        fontWeight: '800',
        marginTop: 5,
    },

    fieldContainer: {
        marginBottom: 18,
    },

    fieldContainerLast: {
        marginBottom: 0,
    },

    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },

    inputWrapper: {
        minHeight: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },

    input: {
        flex: 1,
        minHeight: 48,
        marginLeft: 9,
        fontSize: 15,
        color: '#111827',
        paddingVertical: 0,
    },

    textArea: {
        minHeight: 120,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingTop: 13,
        paddingBottom: 13,
        fontSize: 15,
        color: '#111827',
    },

    characterCount: {
        textAlign: 'right',
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 5,
    },

    categoryRow: {
        flexDirection: 'row',
        gap: 10,
    },

    categoryOption: {
        flex: 1,
        minHeight: 52,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    categoryOptionActive: {
        borderColor: '#93C5FD',
        backgroundColor: '#EFF6FF',
    },

    categoryOptionText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
    },

    categoryOptionTextActive: {
        color: '#1D4ED8',
    },

    helperText: {
        marginTop: 7,
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 18,
    },

    helperBold: {
        fontWeight: '800',
        color: '#374151',
    },

    stockSummary: {
        borderRadius: 14,
        padding: 14,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    stockSummaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    stockSummaryTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#374151',
    },

    stockGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },

    stockBox: {
        flex: 1,
        minWidth: 100,
        borderRadius: 11,
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    stockValue: {
        fontSize: 19,
        fontWeight: '800',
        color: '#111827',
    },

    invalidValue: {
        color: '#DC2626',
    },

    stockLabel: {
        marginTop: 3,
        fontSize: 10,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
    },

    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 12,
        padding: 12,
        borderRadius: 11,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },

    warningText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 12,
        lineHeight: 18,
        color: '#92400E',
        fontWeight: '600',
    },

    conditionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 9,
    },

    conditionOption: {
        minWidth: 120,
        flexGrow: 1,
        minHeight: 46,
        paddingHorizontal: 13,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
    },

    conditionOptionActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#93C5FD',
    },

    conditionText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
    },

    conditionTextActive: {
        color: '#1D4ED8',
    },

    statusBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 11,
    },

    activeBanner: {
        backgroundColor: '#F0FDF4',
    },

    inactiveBanner: {
        backgroundColor: '#F3F4F6',
    },

    statusBannerText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '600',
    },

    activeBannerText: {
        color: '#166534',
    },

    inactiveBannerText: {
        color: '#4B5563',
    },

    errorBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 13,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        marginBottom: 16,
    },

    errorBannerText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        lineHeight: 19,
        color: '#991B1B',
        fontWeight: '600',
    },

    saveButtonContainer: {
        borderRadius: 14,
        overflow: 'hidden',
    },

    saveButtonDisabled: {
        opacity: 0.65,
    },

    saveButton: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        paddingHorizontal: 20,
    },

    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },

    cancelButton: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        borderRadius: 13,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },

    cancelButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4B5563',
    },

    bottomSpace: {
        height: 20,
    },
});