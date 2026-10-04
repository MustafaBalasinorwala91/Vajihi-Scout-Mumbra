import React, { useState } from 'react';
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
    Image,
} from 'react-native';
import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import ImageViewerModal from '../../components/common/ImageViewerModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationBell from '../../components/common/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const MAX_IMAGES = 15;

type Category = 'instrument' | 'other';

const CONDITION_OPTIONS = [
    'excellent',
    'good',
    'fair',
    'poor',
];

export default function AddInventoryItemScreen() {
    const router = useRouter();

    const { user, hasPermission } = useAuth();

    const isAdmin = user?.role === 'admin';

    const hasInventoryPermission =
        isAdmin || hasPermission('inventory');

    const params = useLocalSearchParams<{
        category?: string | string[];
    }>();

    const initialCategory =
        Array.isArray(params.category)
            ? params.category[0]
            : params.category;

    const [name, setName] = useState('');

    const [category, setCategory] =
        useState<Category>(
            initialCategory === 'other'
                ? 'other'
                : 'instrument'
        );
    const [description, setDescription] = useState('');
    const [totalQuantity, setTotalQuantity] = useState('');
    const [condition, setCondition] = useState('good');
    const [active, setActive] = useState(true);

    const [images, setImages] = useState<string[]>([]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);

    const canSave =
        name.trim().length > 0 &&
        totalQuantity.trim().length > 0 &&
        Number.isInteger(
            Number.parseInt(totalQuantity, 10)
        ) &&
        Number.parseInt(totalQuantity, 10) > 0 &&
        !saving;

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
            .map((asset) => {
                if (asset.base64) {
                    return `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
                }

                return asset.uri;
            })
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

    const handleCreate = async () => {
        if (!hasInventoryPermission) {
            Alert.alert(
                'Permission Required',
                'You do not have inventory permission to add items.'
            );
            return;
        }

        const trimmedName = name.trim();
        const trimmedDescription =
            description.trim();

        const quantity = Number.parseInt(
            totalQuantity,
            10
        );

        if (!trimmedName) {
            Alert.alert(
                'Name Required',
                'Please enter an item name.'
            );
            return;
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            Alert.alert(
                'Invalid Quantity',
                'Please enter a quantity greater than 0.'
            );
            return;
        }

        if (!BACKEND_URL) {
            Alert.alert(
                'Configuration Error',
                'EXPO_PUBLIC_BACKEND_URL is not configured.'
            );
            return;
        }

        try {
            setSaving(true);
            setError('');

            const payload = {
                name: trimmedName,
                category,
                description:
                    trimmedDescription || null,
                images,
                total_quantity: quantity,
                condition,
                active,
            };

            const sessionToken = await AsyncStorage.getItem('session_token');

            if (!sessionToken) {
                throw new Error('Session expired. Please login again.');
            }

            const response = await fetch(
                `${BACKEND_URL}/api/inventory`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${sessionToken}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data =
                await response.json().catch(
                    () => null
                );

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    data?.message ||
                    `Failed to create inventory item (${response.status}).`
                );
            }

            Alert.alert(
                'Item Created',
                `${trimmedName} has been added to inventory.`,
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
                'Create inventory item error:',
                err
            );

            setError(
                err?.message ||
                'Unable to create inventory item.'
            );

            Alert.alert(
                'Unable to Create',
                err?.message ||
                'Failed to create inventory item.'
            );
        } finally {
            setSaving(false);
        }
    };
    if (!hasInventoryPermission) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: '#F6F4FF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 30,
                }}
            >
                <View
                    style={{
                        width: 76,
                        height: 76,
                        borderRadius: 24,
                        backgroundColor: '#EEE7FF',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons
                        name="lock-closed-outline"
                        size={40}
                        color="#6C4DFF"
                    />
                </View>

                <Text
                    style={{
                        marginTop: 16,
                        color: '#16162E',
                        fontSize: 21,
                        fontWeight: '800',
                        textAlign: 'center',
                    }}
                >
                    Permission Required
                </Text>

                <Text
                    style={{
                        marginTop: 8,
                        color: '#777',
                        fontSize: 13,
                        lineHeight: 19,
                        textAlign: 'center',
                    }}
                >
                    You do not have inventory permission to add items.
                </Text>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => router.back()}
                    style={{
                        marginTop: 20,
                        backgroundColor: '#6C4DFF',
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 13,
                    }}
                >
                    <Text
                        style={{
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: '800',
                        }}
                    >
                        Go Back
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

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
                        activeOpacity={0.8}
                        onPress={() => {
                            if (!saving) {
                                router.back();
                            }
                        }}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={23}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>

                    <View
                        style={
                            styles.headerTitleContainer
                        }
                    >
                        <Text
                            style={styles.headerTitle}
                        >
                            Add Inventory Item
                        </Text>

                        <Text
                            style={
                                styles.headerSubtitle
                            }
                        >
                            Add a new instrument or item
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
                    contentContainerStyle={
                        styles.content
                    }
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={
                        false
                    }
                >
                    {/* Intro */}
                    <View style={styles.introCard}>
                        <View style={styles.introIcon}>
                            <MaterialCommunityIcons
                                name="package-variant-plus"
                                size={30}
                                color="#6C4DFF"
                            />
                        </View>

                        <View
                            style={styles.introText}
                        >
                            <Text
                                style={styles.pageTitle}
                            >
                                New Inventory Item
                            </Text>

                            <Text
                                style={
                                    styles.pageSubtitle
                                }
                            >
                                Enter the basic information
                                and initial stock quantity.
                            </Text>
                        </View>
                    </View>

                    {/* Basic Information */}
                    <View style={styles.sectionCard}>
                        <View
                            style={
                                styles.sectionHeader
                            }
                        >
                            <View
                                style={
                                    styles.sectionIcon
                                }
                            >
                                <Ionicons
                                    name="information-circle-outline"
                                    size={21}
                                    color="#6C4DFF"
                                />
                            </View>

                            <View>
                                <Text
                                    style={
                                        styles.sectionTitle
                                    }
                                >
                                    Basic Information
                                </Text>

                                <Text
                                    style={
                                        styles.sectionSubtitle
                                    }
                                >
                                    Item name and category
                                </Text>
                            </View>
                        </View>

                        {/* Name */}
                        <View
                            style={
                                styles.fieldContainer
                            }
                        >
                            <Text style={styles.label}>
                                Item Name
                            </Text>

                            <View
                                style={
                                    styles.inputWrapper
                                }
                            >
                                <Ionicons
                                    name="cube-outline"
                                    size={20}
                                    color="#6B7280"
                                />

                                <TextInput
                                    value={name}
                                    onChangeText={
                                        setName
                                    }
                                    placeholder="e.g. Guitar, Drum, First Aid Kit"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input}
                                    editable={!saving}
                                    maxLength={100}
                                />
                            </View>
                        </View>

                        {/* Category */}
                        <View
                            style={
                                styles.fieldContainer
                            }
                        >
                            <Text style={styles.label}>
                                Category
                            </Text>

                            <View
                                style={
                                    styles.categoryRow
                                }
                            >
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    disabled={saving}
                                    style={[
                                        styles.categoryOption,
                                        category ===
                                        'instrument' &&
                                        styles.categoryOptionActive,
                                    ]}
                                    onPress={() =>
                                        setCategory(
                                            'instrument'
                                        )
                                    }
                                >
                                    <MaterialCommunityIcons
                                        name="music-note"
                                        size={22}
                                        color={
                                            category ===
                                                'instrument'
                                                ? '#6C4DFF'
                                                : '#6B7280'
                                        }
                                    />

                                    <Text
                                        style={[
                                            styles.categoryOptionText,
                                            category ===
                                            'instrument' &&
                                            styles.categoryOptionTextActive,
                                        ]}
                                    >
                                        Instrument
                                    </Text>

                                    {category ===
                                        'instrument' && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={20}
                                                color="#6C4DFF"
                                            />
                                        )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    disabled={saving}
                                    style={[
                                        styles.categoryOption,
                                        category ===
                                        'other' &&
                                        styles.categoryOptionActive,
                                    ]}
                                    onPress={() =>
                                        setCategory(
                                            'other'
                                        )
                                    }
                                >
                                    <MaterialCommunityIcons
                                        name="package-variant-closed"
                                        size={22}
                                        color={
                                            category ===
                                                'other'
                                                ? '#6C4DFF'
                                                : '#6B7280'
                                        }
                                    />

                                    <Text
                                        style={[
                                            styles.categoryOptionText,
                                            category ===
                                            'other' &&
                                            styles.categoryOptionTextActive,
                                        ]}
                                    >
                                        Other
                                    </Text>

                                    {category ===
                                        'other' && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={20}
                                                color="#6C4DFF"
                                            />
                                        )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Description */}
                        <View
                            style={
                                styles.fieldContainer
                            }
                        >
                            <Text style={styles.label}>
                                Description
                            </Text>

                            <TextInput
                                value={description}
                                onChangeText={
                                    setDescription
                                }
                                placeholder="Add a description..."
                                placeholderTextColor="#9CA3AF"
                                style={styles.textArea}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                editable={!saving}
                                maxLength={500}
                            />

                            <Text
                                style={
                                    styles.characterCount
                                }
                            >
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
                                    color="#6C4DFF"
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
                        </View>

                        <Text style={styles.helperText}>
                            Add up to 15 clear photos of the instrument or item. Tap a photo to view it full-screen.
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
                                        size={28}
                                        color="#6C4DFF"
                                    />

                                    <Text style={styles.addImageText}>
                                        Add Image
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Stock */}
                    <View style={styles.sectionCard}>
                        <View
                            style={
                                styles.sectionHeader
                            }
                        >
                            <View
                                style={
                                    styles.sectionIcon
                                }
                            >
                                <MaterialCommunityIcons
                                    name="warehouse"
                                    size={21}
                                    color="#6C4DFF"
                                />
                            </View>

                            <View>
                                <Text
                                    style={
                                        styles.sectionTitle
                                    }
                                >
                                    Initial Stock
                                </Text>

                                <Text
                                    style={
                                        styles.sectionSubtitle
                                    }
                                >
                                    Set the starting quantity
                                </Text>
                            </View>
                        </View>

                        <View
                            style={
                                styles.fieldContainer
                            }
                        >
                            <Text style={styles.label}>
                                Total Quantity
                            </Text>

                            <View
                                style={
                                    styles.inputWrapper
                                }
                            >
                                <MaterialCommunityIcons
                                    name="numeric"
                                    size={20}
                                    color="#6B7280"
                                />

                                <TextInput
                                    value={
                                        totalQuantity
                                    }
                                    onChangeText={(
                                        value
                                    ) => {
                                        setTotalQuantity(
                                            value.replace(
                                                /[^0-9]/g,
                                                ''
                                            )
                                        );
                                    }}
                                    placeholder="Enter quantity"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input}
                                    keyboardType="number-pad"
                                    editable={!saving}
                                    maxLength={6}
                                />
                            </View>

                            <Text
                                style={
                                    styles.helperText
                                }
                            >
                                All newly created stock
                                starts as available.
                            </Text>
                        </View>
                    </View>

                    {/* Condition */}
                    <View style={styles.sectionCard}>
                        <View
                            style={
                                styles.sectionHeader
                            }
                        >
                            <View
                                style={
                                    styles.sectionIcon
                                }
                            >
                                <MaterialCommunityIcons
                                    name="clipboard-check-outline"
                                    size={21}
                                    color="#6C4DFF"
                                />
                            </View>

                            <View>
                                <Text
                                    style={
                                        styles.sectionTitle
                                    }
                                >
                                    Condition
                                </Text>

                                <Text
                                    style={
                                        styles.sectionSubtitle
                                    }
                                >
                                    Current condition of
                                    the stock
                                </Text>
                            </View>
                        </View>

                        <View
                            style={
                                styles.conditionGrid
                            }
                        >
                            {CONDITION_OPTIONS.map(
                                (option) => {
                                    const selected =
                                        condition ===
                                        option;

                                    return (
                                        <TouchableOpacity
                                            key={
                                                option
                                            }
                                            activeOpacity={
                                                0.85
                                            }
                                            disabled={
                                                saving
                                            }
                                            style={[
                                                styles.conditionOption,
                                                selected &&
                                                styles.conditionOptionActive,
                                            ]}
                                            onPress={() =>
                                                setCondition(
                                                    option
                                                )
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
                                                    .charAt(
                                                        0
                                                    )
                                                    .toUpperCase() +
                                                    option.slice(
                                                        1
                                                    )}
                                            </Text>

                                            {selected && (
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={
                                                        18
                                                    }
                                                    color="#6C4DFF"
                                                />
                                            )}
                                        </TouchableOpacity>
                                    );
                                }
                            )}
                        </View>
                    </View>

                    {/* Status */}
                    <View style={styles.sectionCard}>
                        <View
                            style={
                                styles.sectionHeader
                            }
                        >
                            <View
                                style={
                                    styles.sectionIcon
                                }
                            >
                                <Ionicons
                                    name="power-outline"
                                    size={21}
                                    color="#6C4DFF"
                                />
                            </View>

                            <View
                                style={
                                    styles.statusText
                                }
                            >
                                <Text
                                    style={
                                        styles.sectionTitle
                                    }
                                >
                                    Item Status
                                </Text>

                                <Text
                                    style={
                                        styles.sectionSubtitle
                                    }
                                >
                                    Make this item active
                                </Text>
                            </View>

                            <Switch
                                value={active}
                                onValueChange={
                                    setActive
                                }
                                disabled={saving}
                                trackColor={{
                                    false: '#D1D5DB',
                                    true: '#BDB0FF',
                                }}
                                thumbColor={
                                    active
                                        ? '#6C4DFF'
                                        : '#F9FAFB'
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
                                    active
                                        ? '#15803D'
                                        : '#6B7280'
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
                                    ? 'This item will appear as active in the inventory catalogue.'
                                    : 'This item will be created as inactive.'}
                            </Text>
                        </View>
                    </View>

                    {error ? (
                        <View
                            style={
                                styles.errorBanner
                            }
                        >
                            <Ionicons
                                name="alert-circle-outline"
                                size={21}
                                color="#DC2626"
                            />

                            <Text
                                style={
                                    styles.errorBannerText
                                }
                            >
                                {error}
                            </Text>
                        </View>
                    ) : null}

                    {/* Create */}
                    <TouchableOpacity
                        activeOpacity={0.88}
                        disabled={!canSave}
                        onPress={handleCreate}
                        style={[
                            styles.createButtonContainer,
                            !canSave &&
                            styles.createButtonDisabled,
                        ]}
                    >
                        <LinearGradient
                            colors={
                                canSave
                                    ? [
                                        '#6C4DFF',
                                        '#5840D9',
                                    ]
                                    : [
                                        '#CBD5E1',
                                        '#94A3B8',
                                    ]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.createButton}
                        >
                            {saving ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#FFFFFF"
                                />
                            ) : (
                                <Ionicons
                                    name="add-circle-outline"
                                    size={22}
                                    color="#FFFFFF"
                                />
                            )}

                            <Text
                                style={
                                    styles.createButtonText
                                }
                            >
                                {saving
                                    ? 'Creating Item...'
                                    : 'Create Inventory Item'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={saving}
                        style={styles.cancelButton}
                        onPress={() =>
                            router.back()
                        }
                    >
                        <Text
                            style={
                                styles.cancelButtonText
                            }
                        >
                            Cancel
                        </Text>
                    </TouchableOpacity>

                    <View
                        style={styles.bottomSpace}
                    />
                </ScrollView>
            </KeyboardAvoidingView>

            <ImageViewerModal
                visible={viewerVisible}
                images={images}
                initialIndex={viewerIndex}
                title={name || 'Inventory Images'}
                onClose={() => setViewerVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7FB',
    },

    keyboardContainer: {
        flex: 1,
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
        color: '#FFFFFF',
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
        width: '100%',
        maxWidth: 900,
        alignSelf: 'center',
        padding: 16,
        paddingTop: 18,
    },

    introCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 17,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E8E5F5',
        elevation: 2,
        shadowColor: '#000000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },

    introIcon: {
        width: 58,
        height: 58,
        borderRadius: 16,
        backgroundColor: '#F0EDFF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    introText: {
        flex: 1,
        marginLeft: 13,
    },

    pageTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#202020',
    },

    pageSubtitle: {
        fontSize: 12,
        color: '#777',
        lineHeight: 18,
        marginTop: 3,
    },

    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
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
        backgroundColor: '#F0EDFF',
        marginRight: 11,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#202020',
    },

    sectionSubtitle: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
    },

    fieldContainer: {
        marginBottom: 18,
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
        borderColor: '#BDB0FF',
        backgroundColor: '#F0EDFF',
    },

    categoryOptionText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
    },

    categoryOptionTextActive: {
        color: '#5840D9',
    },

    helperText: {
        marginTop: 7,
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 18,
    },

    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 2,
    },

    imageWrapper: {
        width: 96,
        height: 112,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#F3F0FF',
    },

    itemImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    removeImageButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(0,0,0,0.68)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    addImageBox: {
        width: 96,
        height: 112,
        borderRadius: 14,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: '#BDB0FF',
        backgroundColor: '#F8F6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    addImageText: {
        marginTop: 6,
        color: '#6C4DFF',
        fontSize: 11,
        fontWeight: '800',
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
        backgroundColor: '#F0EDFF',
        borderColor: '#BDB0FF',
    },

    conditionText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
    },

    conditionTextActive: {
        color: '#5840D9',
    },

    statusText: {
        flex: 1,
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

    createButtonContainer: {
        borderRadius: 14,
        overflow: 'hidden',
    },

    createButtonDisabled: {
        opacity: 0.65,
    },

    createButton: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        paddingHorizontal: 20,
    },

    createButtonText: {
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