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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationBell from '../components/common/NotificationBell';
import ImageViewerModal from '../components/common/ImageViewerModal';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const MAX_IMAGES = 15;

type ComponentDraft = {
    name: string;
    description: string;
    image?: string;
    available_sizes: string[];
    is_mandatory: boolean;
    display_order: number;
};

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function UniformAddScreen() {
    const router = useRouter();

    const { user, hasPermission } = useAuth();

    const isAdmin = user?.role === 'admin';

    const hasUniformPermission =
        isAdmin || hasPermission('uniforms');

    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [guide, setGuide] = useState('');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [displayOrder, setDisplayOrder] = useState('0');
    const [mandatory, setMandatory] = useState(true);
    const [active, setActive] = useState(true);

    const [images, setImages] = useState<string[]>([]);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerImages, setViewerImages] = useState<string[]>([]);
    const [viewerIndex, setViewerIndex] = useState(0);
    const [components, setComponents] = useState<ComponentDraft[]>([
        {
            name: '',
            description: '',
            available_sizes: [],
            is_mandatory: true,
            display_order: 0,
        },
    ]);

    const [saving, setSaving] = useState(false);

    const pickImages = async () => {
        if (images.length >= MAX_IMAGES) {
            Alert.alert('Image Limit', `You can add up to ${MAX_IMAGES} package images.`);
            return;
        }

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert(
                'Permission Required',
                'Please allow photo access to add uniform images.'
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

        setImages((current) => [...current, ...picked].slice(0, MAX_IMAGES));
    };

    const removeImage = (index: number) => {
        setImages((current) => current.filter((_, i) => i !== index));
    };

    const updateComponent = (
        index: number,
        patch: Partial<ComponentDraft>
    ) => {
        setComponents((current) =>
            current.map((component, i) =>
                i === index ? { ...component, ...patch } : component
            )
        );
    };

    const addComponent = () => {
        setComponents((current) => [
            ...current,
            {
                name: '',
                description: '',
                available_sizes: [],
                is_mandatory: true,
                display_order: current.length,
            },
        ]);
    };

    const removeComponent = (index: number) => {
        if (components.length === 1) {
            Alert.alert('Component Required', 'A uniform must have at least one component.');
            return;
        }

        setComponents((current) =>
            current
                .filter((_, i) => i !== index)
                .map((component, i) => ({
                    ...component,
                    display_order: i,
                }))
        );
    };

    const toggleSize = (index: number, size: string) => {
        const component = components[index];
        const exists = component.available_sizes.includes(size);

        updateComponent(index, {
            available_sizes: exists
                ? component.available_sizes.filter((item) => item !== size)
                : [...component.available_sizes, size],
        });
    };

    const pickComponentImage = async (index: number) => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert(
                'Permission Required',
                'Please allow photo access to add a component image.'
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: false,
            quality: 0.65,
            base64: true,
        });

        if (result.canceled || !result.assets[0]) return;

        const asset = result.assets[0];
        const image = asset.base64
            ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
            : asset.uri;

        updateComponent(index, { image });
    };

    const handleCreate = async () => {
        if (!hasUniformPermission) {
            Alert.alert(
                'Permission Required',
                'You need Uniforms permission to create a uniform.'
            );
            return;
        }

        const trimmedName = name.trim();
        const trimmedCategory = category.trim();

        if (!trimmedName) {
            Alert.alert('Name Required', 'Please enter the uniform name.');
            return;
        }

        if (!trimmedCategory) {
            Alert.alert('Category Required', 'Please enter the uniform category.');
            return;
        }

        const validComponents = components.map((component) => ({
            ...component,
            name: component.name.trim(),
            description: component.description.trim() || undefined,
        }));

        if (validComponents.some((component) => !component.name)) {
            Alert.alert('Component Required', 'Please enter a name for every component.');
            return;
        }

        const parsedPrice = price.trim() ? Number(price) : 0;

        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            Alert.alert('Invalid Price', 'Please enter a valid price.');
            return;
        }

        const parsedOrder = displayOrder.trim() ? Number(displayOrder) : 0;

        if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
            Alert.alert('Invalid Display Order', 'Display order must be a whole number.');
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

            const token = await AsyncStorage.getItem('session_token');

            if (!token) {
                throw new Error('Session expired. Please login again.');
            }

            const payload: any = {
                name: trimmedName,
                category: trimmedCategory,
                description: description.trim() || null,
                guide: guide.trim() || null,
                images,
                components: validComponents,
                is_mandatory: mandatory,
                display_order: parsedOrder,
                active,
            };

            if (isAdmin) {
                payload.price = parsedPrice;
                payload.currency = currency.trim() || 'INR';
            }

            const response = await fetch(
                `${BACKEND_URL}/api/uniforms/catalog`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    data?.message ||
                    `Failed to create uniform (${response.status}).`
                );
            }

            Alert.alert(
                'Uniform Created',
                `${trimmedName} has been added to the uniform catalogue.`,
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Create uniform error:', error);

            Alert.alert(
                'Unable to Create',
                error?.message || 'Failed to create uniform catalogue.'
            );
        } finally {
            setSaving(false);
        }
    };
    if (!hasUniformPermission) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons
                    name="lock-closed-outline"
                    size={48}
                    color="#6C4DFF"
                />

                <Text style={styles.errorTitle}>
                    Permission Required
                </Text>

                <Text style={styles.errorMessage}>
                    You need Uniforms permission to create a uniform.
                </Text>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
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
                        activeOpacity={0.8}
                        disabled={saving}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={23} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Add Uniform</Text>
                        <Text style={styles.headerSubtitle}>
                            Create a uniform catalogue package
                        </Text>
                    </View>

                    <NotificationBell />
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.introCard}>
                        <View style={styles.introIcon}>
                            <Ionicons name="shirt-outline" size={30} color="#6C4DFF" />
                        </View>
                        <View style={styles.introText}>
                            <Text style={styles.pageTitle}>New Uniform Package</Text>
                            <Text style={styles.pageSubtitle}>
                                First create the catalogue. Physical stock can be added later
                                by component and size.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <SectionTitle icon="information-circle-outline" title="Basic Information" />

                        <Field
                            label="Uniform Name *"
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. Scout Full Uniform"
                        />

                        <Field
                            label="Category *"
                            value={category}
                            onChangeText={setCategory}
                            placeholder="e.g. Full Uniform, Summer, Winter"
                        />

                        <Field
                            label="Description"
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Short description of this uniform package"
                            multiline
                        />

                        <Field
                            label="Guide / Wearing Instructions"
                            value={guide}
                            onChangeText={setGuide}
                            placeholder="Explain how the uniform should be worn"
                            multiline
                        />
                    </View>

                    <View style={styles.sectionCard}>
                        <SectionTitle icon="images-outline" title="Package Images" />

                        <View style={styles.imageHelperRow}>
                            <Text style={styles.helperText}>
                                Add up to {MAX_IMAGES} images. Tap any image to view it full-screen and zoom.
                            </Text>
                            <Text style={styles.imageCountText}>
                                {images.length}/{MAX_IMAGES}
                            </Text>
                        </View>

                        <View style={styles.imageGrid}>
                            {images.map((image, index) => (
                                <View key={`${index}-${image.slice(-12)}`} style={styles.imageWrapper}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            setViewerImages(images);
                                            setViewerIndex(index);
                                            setViewerVisible(true);
                                        }}>
                                        <Image source={{ uri: image }} style={styles.packageImage} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => removeImage(index)}
                                    >
                                        <Ionicons name="close" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {images.length < MAX_IMAGES && (
                                <TouchableOpacity
                                    style={styles.addImageBox}
                                    activeOpacity={0.8}
                                    onPress={pickImages}
                                >
                                    <Ionicons name="camera-outline" size={27} color="#6C4DFF" />
                                    <Text style={styles.addImageText}>Add Image</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeaderRow}>
                            <SectionTitle icon="layers-outline" title="Uniform Components" />

                            <TouchableOpacity
                                style={styles.smallAddButton}
                                onPress={addComponent}
                            >
                                <Ionicons name="add" size={18} color="#fff" />
                                <Text style={styles.smallAddText}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.helperText}>
                            Add every physical part included in this uniform package.
                        </Text>

                        {components.map((component, index) => (
                            <View key={index} style={styles.componentCard}>
                                <View style={styles.componentHeader}>
                                    <View style={styles.componentNumber}>
                                        <Text style={styles.componentNumberText}>{index + 1}</Text>
                                    </View>

                                    <Text style={styles.componentTitle}>
                                        Component {index + 1}
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() => removeComponent(index)}
                                        style={styles.deleteComponent}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#FF4D4F" />
                                    </TouchableOpacity>
                                </View>

                                <Field
                                    label="Component Name *"
                                    value={component.name}
                                    onChangeText={(value) =>
                                        updateComponent(index, { name: value })
                                    }
                                    placeholder="e.g. Shirt"
                                />

                                <Field
                                    label="Description"
                                    value={component.description}
                                    onChangeText={(value) =>
                                        updateComponent(index, { description: value })
                                    }
                                    placeholder="Component details"
                                    multiline
                                />

                                <Text style={styles.fieldLabel}>Component Image</Text>

                                <View style={styles.componentImageRow}>
                                    {component.image ? (
                                        <View style={styles.componentImageWrapper}>
                                            <Image
                                                source={{ uri: component.image }}
                                                style={styles.componentImage}
                                            />
                                            <TouchableOpacity
                                                style={styles.removeSmallImage}
                                                onPress={() => updateComponent(index, { image: undefined })}
                                            >
                                                <Ionicons name="close" size={14} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : null}

                                    <TouchableOpacity
                                        style={styles.componentImageButton}
                                        onPress={() => pickComponentImage(index)}
                                    >
                                        <Ionicons name="image-outline" size={21} color="#6C4DFF" />
                                        <Text style={styles.componentImageButtonText}>
                                            {component.image ? 'Change Image' : 'Add Image'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.fieldLabel}>Available Sizes</Text>

                                <View style={styles.sizeGrid}>
                                    {SIZE_OPTIONS.map((size) => {
                                        const selected = component.available_sizes.includes(size);

                                        return (
                                            <TouchableOpacity
                                                key={size}
                                                activeOpacity={0.8}
                                                onPress={() => toggleSize(index, size)}
                                                style={[
                                                    styles.sizeChip,
                                                    selected && styles.sizeChipActive,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.sizeChipText,
                                                        selected && styles.sizeChipTextActive,
                                                    ]}
                                                >
                                                    {size}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                <View style={styles.switchRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.switchTitle}>Mandatory Component</Text>
                                        <Text style={styles.switchSubtitle}>
                                            Included in the complete uniform package
                                        </Text>
                                    </View>

                                    <Switch
                                        value={component.is_mandatory}
                                        onValueChange={(value) =>
                                            updateComponent(index, { is_mandatory: value })
                                        }
                                        trackColor={{ false: '#DDD', true: '#C8BCFF' }}
                                        thumbColor={component.is_mandatory ? '#6C4DFF' : '#fff'}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.sectionCard}>
                        <SectionTitle icon="cash-outline" title="Price & Settings" />

                        <View style={styles.twoColumn}>
                            <View style={{ flex: 1 }}>
                                <Field
                                    label="Price"
                                    value={price}
                                    onChangeText={setPrice}
                                    placeholder="0"
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            <View style={{ width: 105 }}>
                                <Field
                                    label="Currency"
                                    value={currency}
                                    onChangeText={setCurrency}
                                    placeholder="INR"
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>

                        <Field
                            label="Display Order"
                            value={displayOrder}
                            onChangeText={setDisplayOrder}
                            placeholder="0"
                            keyboardType="number-pad"
                        />

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.switchTitle}>Mandatory Uniform</Text>
                                <Text style={styles.switchSubtitle}>
                                    Mark this package as required for members
                                </Text>
                            </View>

                            <Switch
                                value={mandatory}
                                onValueChange={setMandatory}
                                trackColor={{ false: '#DDD', true: '#C8BCFF' }}
                                thumbColor={mandatory ? '#6C4DFF' : '#fff'}
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.switchTitle}>Active</Text>
                                <Text style={styles.switchSubtitle}>
                                    Show this uniform in the active catalogue
                                </Text>
                            </View>

                            <Switch
                                value={active}
                                onValueChange={setActive}
                                trackColor={{ false: '#DDD', true: '#C8BCFF' }}
                                thumbColor={active ? '#6C4DFF' : '#fff'}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.88}
                        disabled={saving}
                        onPress={handleCreate}
                        style={[styles.createButton, saving && styles.createButtonDisabled]}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={23} color="#fff" />
                                <Text style={styles.createButtonText}>Create Uniform Catalogue</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.bottomNote}>
                        After creating the catalogue, use Manage Stock to add physical
                        quantities for each component and size.
                    </Text>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <ImageViewerModal
                visible={viewerVisible}
                images={viewerImages}
                initialIndex={viewerIndex}
                title="Uniform Image"
                onClose={() => setViewerVisible(false)}
            />
        </View>
    );
}

function SectionTitle({
    icon,
    title,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
}) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
                <Ionicons name={icon} size={21} color="#6C4DFF" />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
}

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    multiline,
    keyboardType,
    autoCapitalize,
}: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    multiline?: boolean;
    keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#999"
                multiline={multiline}
                keyboardType={keyboardType || 'default'}
                autoCapitalize={autoCapitalize}
                style={[styles.input, multiline && styles.multilineInput]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F4FF',
    },
    centerContainer: {
        flex: 1,
        backgroundColor: '#F6F4FF',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },

    errorTitle: {
        marginTop: 16,
        color: '#16162E',
        fontSize: 21,
        fontWeight: '800',
        textAlign: 'center',
    },

    errorMessage: {
        marginTop: 8,
        color: '#777',
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
    },

    backButton: {
        marginTop: 20,
        backgroundColor: '#6C4DFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 13,
    },

    backButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '800',
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
        fontSize: 13,
        marginTop: 3,
    },

    keyboardContainer: {
        flex: 1,
    },

    scrollView: {
        flex: 1,
    },

    content: {
        padding: 20,
        paddingBottom: 100,
    },

    introCard: {
        backgroundColor: '#fff',
        borderRadius: 21,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 15,
    },

    introIcon: {
        width: 58,
        height: 58,
        borderRadius: 19,
        backgroundColor: '#EEE7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 13,
    },

    introText: {
        flex: 1,
    },

    pageTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#16162E',
    },

    pageSubtitle: {
        fontSize: 12.5,
        lineHeight: 18,
        color: '#777',
        marginTop: 4,
    },

    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 21,
        padding: 17,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.045,
        shadowRadius: 8,
        elevation: 2,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },

    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    sectionIcon: {
        width: 39,
        height: 39,
        borderRadius: 13,
        backgroundColor: '#EEE7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#16162E',
    },

    helperText: {
        color: '#777',
        fontSize: 12,
        lineHeight: 17,
        marginTop: -7,
        marginBottom: 13,
    },

    field: {
        marginBottom: 13,
    },

    fieldLabel: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#30304A',
        marginBottom: 7,
    },

    input: {
        minHeight: 49,
        borderWidth: 1,
        borderColor: '#E5E1F0',
        borderRadius: 14,
        paddingHorizontal: 13,
        color: '#16162E',
        fontSize: 14,
        backgroundColor: '#FCFBFF',
    },

    multilineInput: {
        minHeight: 92,
        paddingTop: 12,
        textAlignVertical: 'top',
    },

    imageHelperRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 2,
    },

    imageCountText: {
        color: '#6C4DFF',
        fontSize: 12,
        fontWeight: '800',
        marginTop: 1,
    },

    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },

    imageWrapper: {
        width: 92,
        height: 108,
        borderRadius: 15,
        overflow: 'hidden',
        position: 'relative',
    },

    packageImage: {
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
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    addImageBox: {
        width: 92,
        height: 108,
        borderRadius: 15,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: '#B9ADFF',
        backgroundColor: '#F8F6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    addImageText: {
        color: '#6C4DFF',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 5,
    },

    smallAddButton: {
        backgroundColor: '#6C4DFF',
        paddingHorizontal: 11,
        paddingVertical: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },

    smallAddText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },

    componentCard: {
        borderWidth: 1,
        borderColor: '#EAE6F5',
        borderRadius: 17,
        padding: 13,
        marginTop: 12,
        backgroundColor: '#FCFBFF',
    },

    componentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 13,
    },

    componentNumber: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: '#6C4DFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 9,
    },

    componentNumberText: {
        color: '#fff',
        fontWeight: '800',
    },

    componentTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '800',
        color: '#16162E',
    },

    deleteComponent: {
        padding: 5,
    },

    componentImageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 10,
    },

    componentImageWrapper: {
        width: 64,
        height: 64,
        borderRadius: 13,
        overflow: 'hidden',
        position: 'relative',
    },

    componentImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    removeSmallImage: {
        position: 'absolute',
        top: 3,
        right: 3,
        width: 21,
        height: 21,
        borderRadius: 11,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    componentImageButton: {
        minHeight: 48,
        paddingHorizontal: 13,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#D9D1FF',
        backgroundColor: '#F8F6FF',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },

    componentImageButtonText: {
        color: '#6C4DFF',
        fontSize: 12,
        fontWeight: '700',
    },

    sizeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },

    sizeChip: {
        minWidth: 48,
        paddingHorizontal: 11,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DDD8EB',
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },

    sizeChipActive: {
        backgroundColor: '#6C4DFF',
        borderColor: '#6C4DFF',
    },

    sizeChipText: {
        color: '#444',
        fontSize: 12,
        fontWeight: '700',
    },

    sizeChipTextActive: {
        color: '#fff',
    },

    switchRow: {
        minHeight: 58,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#EEEAF5',
        marginTop: 8,
        paddingTop: 10,
    },

    switchTitle: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#30304A',
    },

    switchSubtitle: {
        fontSize: 11.5,
        color: '#888',
        marginTop: 3,
        lineHeight: 16,
    },

    twoColumn: {
        flexDirection: 'row',
        gap: 10,
    },

    createButton: {
        minHeight: 56,
        borderRadius: 18,
        backgroundColor: '#6C4DFF',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },

    createButtonDisabled: {
        opacity: 0.65,
    },

    createButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },

    bottomNote: {
        color: '#777',
        fontSize: 11.5,
        lineHeight: 17,
        textAlign: 'center',
        marginTop: 11,
        paddingHorizontal: 10,
    },
});
