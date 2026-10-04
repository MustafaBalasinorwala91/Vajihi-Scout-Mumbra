import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
import ImageViewerModal from '../components/common/ImageViewerModal';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationBell from '../components/common/NotificationBell';
import { useAuth } from '../contexts/AuthContext';

const MAX_IMAGES = 15;
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');
const API_BASE = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;

type ComponentDraft = {
    component_id?: string;
    name: string;
    description: string;
    image?: string;
    available_sizes: string[];
    is_mandatory: boolean;
    display_order: number;
};

type UniformCatalog = {
    catalog_id: string;
    name: string;
    category?: string;
    description?: string;
    guide?: string;
    images?: string[];
    components?: Array<{
        component_id: string;
        name?: string;
        description?: string;
        image?: string;
        available_sizes?: string[];
        is_mandatory?: boolean;
        required?: boolean;
        mandatory?: boolean;
        display_order?: number;
    }>;
    price?: number;
    currency?: string;
    is_mandatory?: boolean;
    display_order?: number;
    active?: boolean;
};

function normalizeImage(value?: string | null) {
    if (!value) return null;
    if (
        value.startsWith('http://') ||
        value.startsWith('https://') ||
        value.startsWith('data:')
    ) {
        return value;
    }
    return `data:image/jpeg;base64,${value}`;
}

function errorMessage(data: any, fallback: string) {
    if (typeof data?.detail === 'string') return data.detail;
    if (Array.isArray(data?.detail)) {
        return data.detail.map((x: any) => x?.msg).filter(Boolean).join(', ');
    }
    return data?.message || fallback;
}

export default function UniformEditScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ catalog_id?: string | string[] }>();
    const { user, hasPermission } = useAuth();

    const catalogId = Array.isArray(params.catalog_id)
        ? params.catalog_id[0]
        : params.catalog_id;

    const isAdmin = user?.role === 'admin';

    const hasUniformPermission =
        isAdmin || hasPermission('uniforms');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [guide, setGuide] = useState('');
    const [price, setPrice] = useState('0');
    const [currency, setCurrency] = useState('INR');
    const [displayOrder, setDisplayOrder] = useState('0');
    const [mandatory, setMandatory] = useState(true);
    const [active, setActive] = useState(true);
    const [images, setImages] = useState<string[]>([]);
    const [components, setComponents] = useState<ComponentDraft[]>([]);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerImages, setViewerImages] = useState<string[]>([]);
    const [viewerIndex, setViewerIndex] = useState(0);

    const getAuthHeaders = useCallback(async (includeJson = false) => {
        const token = await AsyncStorage.getItem('session_token');
        if (!token) throw new Error('Session expired. Please login again.');
        return {
            Authorization: `Bearer ${token}`,
            ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
        };
    }, []);

    const loadCatalog = useCallback(async () => {
        if (!catalogId) {
            setError('Uniform catalogue ID is missing.');
            setLoading(false);
            return;
        }

        if (!BACKEND_URL) {
            setError('EXPO_PUBLIC_BACKEND_URL is not configured.');
            setLoading(false);
            return;
        }

        try {
            setError('');
            const response = await fetch(`${API_BASE}/uniforms/catalog/${catalogId}`, {
                method: 'GET',
                headers: await getAuthHeaders(),
            });
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(errorMessage(data, `Failed to load uniform (${response.status}).`));
            }

            const catalog: UniformCatalog = data;
            setName(catalog.name || '');
            setCategory(catalog.category || '');
            setDescription(catalog.description || '');
            setGuide(catalog.guide || '');
            setPrice(String(catalog.price ?? 0));
            setCurrency(catalog.currency || 'INR');
            setDisplayOrder(String(catalog.display_order ?? 0));
            setMandatory(catalog.is_mandatory !== false);
            setActive(catalog.active !== false);
            setImages((catalog.images || []).map((image) => normalizeImage(image)).filter(Boolean) as string[]);
            setComponents(
                (catalog.components || []).map((component, index) => ({
                    component_id: component.component_id,
                    name: component.name || (component as any).component_name || '',
                    description: component.description || '',
                    image: normalizeImage(component.image || (component as any).image_url) || undefined,
                    available_sizes: component.available_sizes || [],
                    is_mandatory:
                        component.is_mandatory !== undefined
                            ? component.is_mandatory
                            : component.mandatory !== undefined
                                ? component.mandatory
                                : component.required !== false,
                    display_order: component.display_order ?? index,
                }))
            );
        } catch (err: any) {
            console.error('Load uniform edit error:', err);
            setError(err?.message || 'Unable to load uniform.');
        } finally {
            setLoading(false);
        }
    }, [catalogId, getAuthHeaders]);

    useEffect(() => {
        loadCatalog();
    }, [loadCatalog]);

    const pickImages = async () => {
        if (images.length >= MAX_IMAGES) {
            Alert.alert('Image Limit', `You can add up to ${MAX_IMAGES} package images.`);
            return;
        }

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Please allow photo access to add uniform images.');
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

        setImages((current) => [...current, ...picked].slice(0, MAX_IMAGES));
    };

    const pickComponentImage = async (index: number) => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Please allow photo access to add a component image.');
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

        setComponents((current) =>
            current.map((component, i) => (i === index ? { ...component, image } : component))
        );
    };

    const updateComponent = (index: number, patch: Partial<ComponentDraft>) => {
        setComponents((current) =>
            current.map((component, i) => (i === index ? { ...component, ...patch } : component))
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
                .map((component, i) => ({ ...component, display_order: i }))
        );
    };

    const toggleSize = (index: number, size: string) => {
        const component = components[index];
        const selected = component.available_sizes.includes(size);
        updateComponent(index, {
            available_sizes: selected
                ? component.available_sizes.filter((item) => item !== size)
                : [...component.available_sizes, size],
        });
    };

    const handleSave = async () => {
        if (!hasUniformPermission) {
            Alert.alert('Permission Required', 'You need Uniforms permission to edit this uniform.');
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

        const validComponents = components.map((component, index) => ({
            ...(component.component_id ? { component_id: component.component_id } : {}),
            name: component.name.trim(),
            description: component.description.trim() || undefined,
            image: component.image,
            available_sizes: component.available_sizes,
            is_mandatory: component.is_mandatory,
            display_order: index,
        }));

        if (!validComponents.length || validComponents.some((component) => !component.name)) {
            Alert.alert('Component Required', 'Please keep at least one component and enter a name for every component.');
            return;
        }

        const parsedPrice = price.trim() ? Number(price) : 0;
        const parsedOrder = displayOrder.trim() ? Number(displayOrder) : 0;

        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            Alert.alert('Invalid Price', 'Please enter a valid price.');
            return;
        }
        if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
            Alert.alert('Invalid Display Order', 'Display order must be a whole number.');
            return;
        }

        try {
            setSaving(true);
            setError('');

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

            // The backend protects price/currency for non-admin users.
            if (isAdmin) {
                payload.price = parsedPrice;
                payload.currency = currency.trim() || 'INR';
            }

            const response = await fetch(`${API_BASE}/uniforms/catalog/${catalogId}`, {
                method: 'PUT',
                headers: await getAuthHeaders(true),
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(errorMessage(data, `Failed to update uniform (${response.status}).`));
            }

            Alert.alert('Uniform Updated', 'Uniform catalogue has been updated successfully.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (err: any) {
            console.error('Update uniform error:', err);
            setError(err?.message || 'Unable to update uniform.');
            Alert.alert('Unable to Update', err?.message || 'Failed to update uniform catalogue.');
        } finally {
            setSaving(false);
        }
    };

    if (!hasUniformPermission) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="lock-closed-outline" size={48} color="#6C4DFF" />
                <Text style={styles.errorTitle}>Permission Required</Text>
                <Text style={styles.errorMessage}>You need Uniforms permission to edit this uniform.</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6C4DFF" />
                <Text style={styles.loadingText}>Loading uniform...</Text>
            </View>
        );
    }

    if (error && !name) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={50} color="#D64545" />
                <Text style={styles.errorTitle}>Unable to Load Uniform</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
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
                    <TouchableOpacity style={styles.headerButton} disabled={saving} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={23} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Edit Uniform</Text>
                        <Text style={styles.headerSubtitle}>Update catalogue details</Text>
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
                            <Ionicons name="create-outline" size={30} color="#6C4DFF" />
                        </View>
                        <View style={styles.introText}>
                            <Text style={styles.pageTitle}>Update Uniform Package</Text>
                            <Text style={styles.pageSubtitle}>Changes are saved to the existing catalogue item. Physical stock is managed separately.</Text>
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <SectionTitle icon="information-circle-outline" title="Basic Information" />
                        <Field label="Uniform Name *" value={name} onChangeText={setName} placeholder="e.g. Scout Full Uniform" />
                        <Field label="Category *" value={category} onChangeText={setCategory} placeholder="e.g. Full Uniform, Summer, Winter" />
                        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Short description" multiline />
                        <Field label="Guide / Wearing Instructions" value={guide} onChangeText={setGuide} placeholder="Explain how the uniform should be worn" multiline />
                    </View>

                    <View style={styles.sectionCard}>
                        <View style={styles.imageHelperRow}>
                            <SectionTitle icon="images-outline" title="Package Images" />
                            <Text style={styles.imageCountText}>{images.length}/{MAX_IMAGES}</Text>
                        </View>
                        <Text style={styles.helperText}>Add up to {MAX_IMAGES} images. Tap any image to view it full-screen and zoom.</Text>
                        <View style={styles.imageGrid}>
                            {images.map((image, index) => (
                                <View key={`${index}-${image.slice(-12)}`} style={styles.imageWrapper}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            setViewerImages(images);
                                            setViewerIndex(index);
                                            setViewerVisible(true);
                                        }}
                                    >
                                        <Image source={{ uri: image }} style={styles.packageImage} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setImages((current) => current.filter((_, i) => i !== index))}>
                                        <Ionicons name="close" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {images.length < MAX_IMAGES && (
                                <TouchableOpacity style={styles.addImageBox} onPress={pickImages}>
                                    <Ionicons name="camera-outline" size={27} color="#6C4DFF" />
                                    <Text style={styles.addImageText}>Add Image</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeaderRow}>
                            <SectionTitle icon="layers-outline" title="Uniform Components" />
                            <TouchableOpacity style={styles.smallAddButton} onPress={addComponent}>
                                <Ionicons name="add" size={18} color="#fff" />
                                <Text style={styles.smallAddText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.helperText}>Update the physical parts and available sizes in this package.</Text>

                        {components.map((component, index) => (
                            <View key={component.component_id || `new-${index}`} style={styles.componentCard}>
                                <View style={styles.componentHeader}>
                                    <View style={styles.componentNumber}><Text style={styles.componentNumberText}>{index + 1}</Text></View>
                                    <Text style={styles.componentTitle}>Component {index + 1}</Text>
                                    <TouchableOpacity onPress={() => removeComponent(index)} style={styles.deleteComponent}>
                                        <Ionicons name="trash-outline" size={20} color="#FF4D4F" />
                                    </TouchableOpacity>
                                </View>

                                <Field label="Component Name *" value={component.name} onChangeText={(value) => updateComponent(index, { name: value })} placeholder="e.g. Shirt" />
                                <Field label="Description" value={component.description} onChangeText={(value) => updateComponent(index, { description: value })} placeholder="Component details" multiline />

                                <Text style={styles.fieldLabel}>Component Image</Text>
                                <View style={styles.componentImageRow}>
                                    {component.image ? (
                                        <View style={styles.componentImageWrapper}>
                                            <TouchableOpacity
                                                activeOpacity={0.9}
                                                onPress={() => {
                                                    setViewerImages([component.image!]);
                                                    setViewerIndex(0);
                                                    setViewerVisible(true);
                                                }}
                                            >
                                                <Image source={{ uri: component.image }} style={styles.componentImage} />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.removeSmallImage} onPress={() => updateComponent(index, { image: undefined })}>
                                                <Ionicons name="close" size={14} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : null}
                                    <TouchableOpacity style={styles.componentImageButton} onPress={() => pickComponentImage(index)}>
                                        <Ionicons name="image-outline" size={21} color="#6C4DFF" />
                                        <Text style={styles.componentImageButtonText}>{component.image ? 'Change Image' : 'Add Image'}</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.fieldLabel}>Available Sizes</Text>
                                <View style={styles.sizeGrid}>
                                    {SIZE_OPTIONS.map((size) => {
                                        const selected = component.available_sizes.includes(size);
                                        return (
                                            <TouchableOpacity key={size} activeOpacity={0.8} onPress={() => toggleSize(index, size)} style={[styles.sizeChip, selected && styles.sizeChipActive]}>
                                                <Text style={[styles.sizeChipText, selected && styles.sizeChipTextActive]}>{size}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                <View style={styles.switchRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.switchTitle}>Mandatory Component</Text>
                                        <Text style={styles.switchSubtitle}>Included in the complete uniform package</Text>
                                    </View>
                                    <Switch value={component.is_mandatory} onValueChange={(value) => updateComponent(index, { is_mandatory: value })} trackColor={{ false: '#DDD', true: '#C8BCFF' }} thumbColor={component.is_mandatory ? '#6C4DFF' : '#fff'} />
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.sectionCard}>
                        <SectionTitle icon="cash-outline" title="Price & Settings" />
                        <View style={styles.twoColumn}>
                            <View style={{ flex: 1 }}>
                                <Field label={isAdmin ? 'Price' : 'Price (Admin only)'} value={price} onChangeText={setPrice} placeholder="0" keyboardType="decimal-pad" />
                            </View>
                            <View style={{ width: 105 }}>
                                <Field label="Currency" value={currency} onChangeText={setCurrency} placeholder="INR" autoCapitalize="characters" />
                            </View>
                        </View>
                        {!isAdmin && <Text style={styles.warningText}>Only an admin can change price or currency.</Text>}
                        <Field label="Display Order" value={displayOrder} onChangeText={setDisplayOrder} placeholder="0" keyboardType="number-pad" />

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.switchTitle}>Mandatory Uniform</Text>
                                <Text style={styles.switchSubtitle}>Mark this package as required for members</Text>
                            </View>
                            <Switch value={mandatory} onValueChange={setMandatory} trackColor={{ false: '#DDD', true: '#C8BCFF' }} thumbColor={mandatory ? '#6C4DFF' : '#fff'} />
                        </View>

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.switchTitle}>Active</Text>
                                <Text style={styles.switchSubtitle}>Show this uniform in the active catalogue</Text>
                            </View>
                            <Switch value={active} onValueChange={setActive} trackColor={{ false: '#DDD', true: '#C8BCFF' }} thumbColor={active ? '#6C4DFF' : '#fff'} />
                        </View>
                    </View>

                    {error ? (
                        <View style={styles.errorBanner}>
                            <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
                            <Text style={styles.errorBannerText}>{error}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity activeOpacity={0.88} disabled={saving} onPress={handleSave} style={[styles.createButton, saving && styles.createButtonDisabled]}>
                        {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark-circle-outline" size={23} color="#fff" />}
                        <Text style={styles.createButtonText}>{saving ? 'Saving Changes...' : 'Save Changes'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.8} disabled={saving} style={styles.cancelButton} onPress={() => router.back()}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

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

function SectionTitle({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}><Ionicons name={icon} size={21} color="#6C4DFF" /></View>
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
    container: { flex: 1, backgroundColor: '#F6F4FF' },
    header: { paddingTop: 62, paddingHorizontal: 18, paddingBottom: 23, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', alignItems: 'center' },
    headerButton: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center', marginRight: 7 },
    headerTitleContainer: { flex: 1, marginHorizontal: 7 },
    headerTitle: { color: '#fff', fontSize: 27, fontWeight: '800' },
    headerSubtitle: { color: '#E9DDFF', fontSize: 12, marginTop: 2 },
    keyboardContainer: { flex: 1 },
    scrollView: { flex: 1 },
    content: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: 16, paddingTop: 18 },
    introCard: { backgroundColor: '#fff', borderRadius: 18, padding: 17, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#E8E5F5', elevation: 2 },
    introIcon: { width: 58, height: 58, borderRadius: 16, backgroundColor: '#F0EDFF', alignItems: 'center', justifyContent: 'center' },
    introText: { flex: 1, marginLeft: 13 },
    pageTitle: { fontSize: 20, fontWeight: '800', color: '#202020' },
    pageSubtitle: { fontSize: 12, color: '#777', lineHeight: 18, marginTop: 3 },
    sectionCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0EDFF', marginRight: 11 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#202020' },
    field: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
    input: { minHeight: 50, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 14, fontSize: 15, color: '#111827' },
    multilineInput: { minHeight: 110, paddingTop: 13, textAlignVertical: 'top' },
    twoColumn: { flexDirection: 'row', gap: 12 },
    imageHelperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    helperText: { fontSize: 12, color: '#6B7280', lineHeight: 18, marginBottom: 12 },
    imageCountText: { color: '#6C4DFF', fontSize: 12, fontWeight: '800' },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    imageWrapper: { width: 94, height: 94, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F0EDFF' },
    packageImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    removeImageButton: { position: 'absolute', right: 5, top: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
    addImageBox: { width: 94, height: 94, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#BDB0FF', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF8FF' },
    addImageText: { color: '#6C4DFF', fontSize: 11, fontWeight: '800', marginTop: 5 },
    smallAddButton: { backgroundColor: '#6C4DFF', minHeight: 40, paddingHorizontal: 13, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
    smallAddText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    componentCard: { backgroundColor: '#FCFBFF', borderRadius: 15, borderWidth: 1, borderColor: '#EBE7F7', padding: 14, marginTop: 12 },
    componentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    componentNumber: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#6C4DFF', alignItems: 'center', justifyContent: 'center' },
    componentNumberText: { color: '#fff', fontWeight: '800' },
    componentTitle: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '800', color: '#202020' },
    deleteComponent: { padding: 5 },
    componentImageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
    componentImageWrapper: { width: 76, height: 76, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F0EDFF' },
    componentImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    removeSmallImage: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
    componentImageButton: { minHeight: 44, borderWidth: 1, borderColor: '#DCD5F5', borderRadius: 12, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fff' },
    componentImageButtonText: { color: '#6C4DFF', fontSize: 12, fontWeight: '800' },
    sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    sizeChip: { minWidth: 55, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 11, borderWidth: 1, borderColor: '#E1DCEC', backgroundColor: '#fff', alignItems: 'center' },
    sizeChipActive: { backgroundColor: '#F0EDFF', borderColor: '#BDB0FF' },
    sizeChipText: { color: '#555', fontSize: 12, fontWeight: '700' },
    sizeChipTextActive: { color: '#5840D9' },
    switchRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 13, marginTop: 5, borderTopWidth: 1, borderTopColor: '#EEEAF4' },
    switchTitle: { color: '#333', fontSize: 13, fontWeight: '700' },
    switchSubtitle: { color: '#888', fontSize: 11, marginTop: 3 },
    warningText: { color: '#A15C00', fontSize: 11, lineHeight: 17, marginBottom: 10 },
    errorBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 15 },
    errorBannerText: { flex: 1, color: '#991B1B', fontSize: 12, lineHeight: 18, marginLeft: 7 },
    createButton: { minHeight: 54, borderRadius: 15, backgroundColor: '#6C4DFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2 },
    createButtonDisabled: { opacity: 0.65 },
    createButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    cancelButton: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E1DCEC', marginTop: 10 },
    cancelButtonText: { color: '#555', fontSize: 14, fontWeight: '800' },
    centerContainer: { flex: 1, backgroundColor: '#F6F4FF', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
    loadingText: { marginTop: 12, color: '#6C4DFF', fontSize: 14, fontWeight: '600' },
    errorTitle: { marginTop: 16, color: '#16162E', fontSize: 21, fontWeight: '800', textAlign: 'center' },
    errorMessage: { marginTop: 8, color: '#777', fontSize: 13, lineHeight: 19, textAlign: 'center' },
    backButton: { marginTop: 20, backgroundColor: '#6C4DFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 13 },
    backButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
