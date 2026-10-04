import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    TextInput,
    Modal,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import NotificationBell from '../components/common/NotificationBell';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');
const API_BASE = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;

type InventoryItem = {
    inventory_id: string;
    catalog_id: string;
    component_id: string;
    size: string;

    total_quantity: number;
    available_quantity: number;
    assigned_quantity: number;
    repair_quantity: number;
    damaged_quantity: number;

    minimum_stock: number;
    purchase_price: number;
    supplier?: string;
    purchase_date?: string;
    notes?: string;

    uniform_name?: string;
    category?: string;
    component_name?: string;
};

type CatalogComponent = {
    component_id: string;
    name: string;
    available_sizes?: string[];
};

type UniformCatalog = {
    catalog_id: string;
    name: string;
    category?: string;
    components?: CatalogComponent[];
};

export default function UniformInventoryScreen() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        catalog_id?: string | string[];
    }>();

    const catalogId = Array.isArray(params.catalog_id)
        ? params.catalog_id[0]
        : params.catalog_id;

    const { user, hasPermission } = useAuth();

    const isAdmin = user?.role === 'admin';

    const hasUniformPermission =
        isAdmin || hasPermission('uniforms');

    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [catalog, setCatalog] = useState<UniformCatalog | null>(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [selectedItem, setSelectedItem] =
        useState<InventoryItem | null>(null);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [addStockModalVisible, setAddStockModalVisible] = useState(false);

    const [totalQuantity, setTotalQuantity] = useState('');
    const [minimumStock, setMinimumStock] = useState('');
    const [notes, setNotes] = useState('');

    const [newComponentId, setNewComponentId] = useState('');
    const [newSize, setNewSize] = useState('');
    const [newTotalQuantity, setNewTotalQuantity] = useState('');
    const [newMinimumStock, setNewMinimumStock] = useState('5');
    const [newNotes, setNewNotes] = useState('');

    const [saving, setSaving] = useState(false);

    const getAuthHeaders = async (includeJson: boolean = false) => {
        const token = await AsyncStorage.getItem('session_token');

        if (!token) {
            throw new Error(
                'Session expired. Please login again.'
            );
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
            const baseUrl = BACKEND_URL;

            if (!baseUrl) {
                throw new Error('Backend URL is not configured.');
            }

            const headers = await getAuthHeaders();

            const [inventoryResponse, catalogResponse] =
                await Promise.all([
                    fetch(`${API_BASE}/uniforms/inventory`, {
                        method: 'GET',
                        headers,
                    }),

                    catalogId
                        ? fetch(
                            `${API_BASE}/uniforms/catalog/${catalogId}`,
                            {
                                method: 'GET',
                                headers,
                            }
                        )
                        : Promise.resolve(null),
                ]);

            if (!inventoryResponse.ok) {
                throw new Error(
                    `Inventory request failed: ${inventoryResponse.status}`
                );
            }

            const inventoryData = await inventoryResponse.json();

            const inventoryArray = Array.isArray(inventoryData)
                ? inventoryData
                : [];

            const filteredInventory = catalogId
                ? inventoryArray.filter(
                    (item: InventoryItem) =>
                        item.catalog_id === catalogId
                )
                : inventoryArray;

            setInventory(filteredInventory);

            if (catalogResponse) {
                if (!catalogResponse.ok) {
                    throw new Error(
                        `Catalog request failed: ${catalogResponse.status}`
                    );
                }

                const catalogData = await catalogResponse.json();
                setCatalog(catalogData);
            }
        } catch (error: any) {
            console.log('Uniform inventory load error:', error);

            Alert.alert(
                'Unable to Load',
                error?.message ||
                'Failed to load uniform inventory.'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [catalogId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
    };

    const groupedInventory = useMemo(() => {
        const groups: Record<string, InventoryItem[]> = {};

        inventory.forEach((item) => {
            const componentName =
                item.component_name ||
                item.component_id ||
                'Component';

            if (!groups[componentName]) {
                groups[componentName] = [];
            }

            groups[componentName].push(item);
        });

        return groups;
    }, [inventory]);

    const openEdit = (item: InventoryItem) => {
        if (!hasUniformPermission) {
            Alert.alert(
                'Permission Required',
                'You do not have permission to edit uniform stock.'
            );
            return;
        }

        setSelectedItem(item);
        setTotalQuantity(
            String(item.total_quantity ?? 0)
        );

        setMinimumStock(
            String(item.minimum_stock ?? 5)
        );

        setNotes(item.notes || '');

        setEditModalVisible(true);
    };

    const saveEdit = async () => {
        if (!hasUniformPermission) {
            Alert.alert(
                'Permission Required',
                'You do not have permission to update uniform stock.'
            );
            return;
        }

        if (!selectedItem) return;
        const total = Number(totalQuantity);
        const minimum = Number(minimumStock);

        if (!Number.isInteger(total) || total < 0) {
            Alert.alert(
                'Invalid Quantity',
                'Enter a valid whole-number total quantity.'
            );
            return;
        }

        if (!Number.isInteger(minimum) || minimum < 0) {
            Alert.alert(
                'Invalid Minimum Stock',
                'Enter a valid whole-number minimum stock value.'
            );
            return;
        }

        const requiredQuantity =
            selectedItem.assigned_quantity +
            selectedItem.repair_quantity +
            selectedItem.damaged_quantity;

        if (total < requiredQuantity) {
            Alert.alert(
                'Quantity Too Low',
                `Total quantity cannot be below ${requiredQuantity} because items are already assigned, under repair, or damaged.`
            );
            return;
        }

        try {
            setSaving(true);

            if (!BACKEND_URL) {
                throw new Error('Backend URL is not configured.');
            }

            const headers =
                await getAuthHeaders(true);

            const response = await fetch(
                `${API_BASE}/uniforms/inventory/${selectedItem.inventory_id}`,
                {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                        total_quantity: total,
                        minimum_stock: minimum,
                        notes: notes.trim() || null,
                    }),
                }
            );

            const responseText =
                await response.text();

            if (!response.ok) {
                let message =
                    responseText ||
                    'Failed to update inventory.';

                try {
                    const parsed =
                        JSON.parse(responseText);
                    message =
                        parsed?.detail ||
                        parsed?.message ||
                        message;
                } catch {
                    // Keep the raw response message.
                }

                throw new Error(message);
            }

            setEditModalVisible(false);

            Alert.alert(
                'Updated',
                'Uniform stock information has been updated.'
            );

            await loadData();
        } catch (error: any) {
            Alert.alert(
                'Update Failed',
                error?.message ||
                'Unable to update inventory.'
            );
        } finally {
            setSaving(false);
        }
    };

    const deleteStock = async (item: InventoryItem) => {
        Alert.alert(
            'Delete Stock Record',
            `Delete ${item.component_name || 'component'} - Size ${item.size}? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setSaving(true);

                            const response = await fetch(
                                `${API_BASE}/uniforms/inventory/${item.inventory_id}`,
                                {
                                    method: 'DELETE',
                                    headers: await getAuthHeaders(),
                                }
                            );

                            const responseText = await response.text();
                            if (!response.ok) {
                                let message = responseText || 'Failed to delete stock record.';
                                try {
                                    const parsed = JSON.parse(responseText);
                                    message = parsed?.detail || parsed?.message || message;
                                } catch { }
                                throw new Error(message);
                            }

                            Alert.alert('Deleted', 'Stock record deleted successfully.');
                            await loadData();
                        } catch (error: any) {
                            Alert.alert('Delete Failed', error?.message || 'Unable to delete stock record.');
                        } finally {
                            setSaving(false);
                        }
                    },
                },
            ]
        );
    };

    const openAddStock = () => {
        if (!hasUniformPermission) {
            Alert.alert(
                'Permission Required',
                'You do not have permission to add uniform stock.'
            );
            return;
        }

        if (!catalog?.components?.length) {
            Alert.alert(
                'No Components',
                'This uniform has no components yet. Edit the uniform and add at least one component before adding stock.'
            );
            return;
        }

        setNewComponentId('');
        setNewSize('');
        setNewTotalQuantity('');
        setNewMinimumStock('5');
        setNewNotes('');

        setAddStockModalVisible(true);
    };

    const selectedNewComponent =
        catalog?.components?.find(
            (component) =>
                component.component_id ===
                newComponentId
        );

    const availableSizes =
        selectedNewComponent?.available_sizes || [];

    const saveInitialStock = async () => {
        if (!hasUniformPermission) {
            Alert.alert(
                'Permission Required',
                'You do not have permission to add uniform stock.'
            );
            return;
        }

        if (!catalogId) {
            Alert.alert(
                'Uniform Required',
                'Uniform catalogue ID is missing.'
            );
            return;
        }

        if (!newComponentId) {
            Alert.alert(
                'Component Required',
                'Please select a uniform component.'
            );
            return;
        }

        if (!newSize) {
            Alert.alert(
                'Size Required',
                'Please select a size.'
            );
            return;
        }

        const quantity = Number(newTotalQuantity);
        const minimum = Number(newMinimumStock);

        if (!Number.isInteger(quantity) || quantity < 0) {
            Alert.alert(
                'Invalid Quantity',
                'Enter a valid whole-number initial quantity.'
            );
            return;
        }

        if (!Number.isInteger(minimum) || minimum < 0) {
            Alert.alert(
                'Invalid Minimum Stock',
                'Enter a valid whole-number minimum stock.'
            );
            return;
        }

        try {
            setSaving(true);

            if (!BACKEND_URL) {
                throw new Error('Backend URL is not configured.');
            }

            const headers =
                await getAuthHeaders(true);

            const response = await fetch(
                `${API_BASE}/uniforms/inventory`,
                {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        catalog_id: catalogId,
                        component_id: newComponentId,
                        size: newSize,
                        total_quantity: quantity,
                        // Required by the current backend contract.
                        purchase_price: 0,
                        purchase_date: new Date()
                            .toISOString()
                            .split('T')[0],
                        notes: newNotes.trim() || null,
                        minimum_stock: minimum,
                    }),
                }
            );

            const responseText =
                await response.text();

            if (!response.ok) {
                let message =
                    responseText ||
                    'Failed to add initial stock.';

                try {
                    const parsed =
                        JSON.parse(responseText);
                    message =
                        parsed?.detail ||
                        parsed?.message ||
                        message;
                } catch {
                    // Keep the raw response message.
                }

                throw new Error(message);
            }

            setAddStockModalVisible(false);

            Alert.alert(
                'Stock Added',
                'Initial uniform stock has been added successfully.'
            );

            await loadData();
        } catch (error: any) {
            Alert.alert(
                'Unable to Add Stock',
                error?.message ||
                'Failed to add initial stock.'
            );
        } finally {
            setSaving(false);
        }
    };

    if (!hasUniformPermission) {
        return (
            <View style={styles.centerContainer}>
                <View style={styles.permissionIcon}>
                    <Ionicons
                        name="lock-closed-outline"
                        size={40}
                        color="#6C4DFF"
                    />
                </View>

                <Text style={styles.permissionTitle}>
                    Permission Required
                </Text>

                <Text style={styles.permissionText}>
                    You need Uniforms permission to manage
                    uniform stock.
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

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator
                    size="large"
                    color="#6C4DFF"
                />

                <Text style={styles.loadingText}>
                    Loading uniform stock...
                </Text>
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
                        colors={['#6C4DFF']}
                        tintColor="#6C4DFF"
                    />
                }
                contentContainerStyle={
                    styles.scrollContent
                }
            >
                {/* HEADER */}

                <LinearGradient
                    colors={['#2B145A', '#5B3DF5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            style={styles.headerBack}
                            onPress={() => router.back()}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={26}
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
                                Uniform Stock
                            </Text>

                            <Text
                                style={styles.headerSubtitle}
                            >
                                Manage component and size stock
                            </Text>
                        </View>

                        <NotificationBell />
                    </View>
                </LinearGradient>

                {/* UNIFORM INFO */}

                <View style={styles.section}>
                    <View style={styles.uniformCard}>
                        <View style={styles.uniformIcon}>
                            <Ionicons
                                name="shirt-outline"
                                size={28}
                                color="#6C4DFF"
                            />
                        </View>

                        <View
                            style={{
                                flex: 1,
                            }}
                        >
                            <Text
                                style={styles.uniformName}
                            >
                                {catalog?.name ||
                                    inventory[0]?.uniform_name ||
                                    'Uniform'}
                            </Text>

                            <Text
                                style={styles.uniformMeta}
                            >
                                {catalog?.category ||
                                    inventory[0]?.category ||
                                    'Uniform stock'}
                            </Text>

                            <Text
                                style={styles.uniformCount}
                            >
                                {inventory.length} stock record
                                {inventory.length === 1
                                    ? ''
                                    : 's'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* STOCK SUMMARY */}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Stock Overview
                    </Text>

                    <View style={styles.summaryGrid}>
                        <View
                            style={[
                                styles.summaryCard,
                                {
                                    backgroundColor:
                                        '#EEE7FF',
                                },
                            ]}
                        >
                            <Ionicons
                                name="cube-outline"
                                size={22}
                                color="#6C4DFF"
                            />

                            <Text
                                style={[
                                    styles.summaryValue,
                                    {
                                        color: '#6C4DFF',
                                    },
                                ]}
                            >
                                {inventory.reduce(
                                    (sum, item) =>
                                        sum +
                                        Number(
                                            item.total_quantity || 0
                                        ),
                                    0
                                )}
                            </Text>

                            <Text
                                style={styles.summaryLabel}
                            >
                                Total
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.summaryCard,
                                {
                                    backgroundColor:
                                        '#E8FFF0',
                                },
                            ]}
                        >
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={22}
                                color="#22B866"
                            />

                            <Text
                                style={[
                                    styles.summaryValue,
                                    {
                                        color: '#22B866',
                                    },
                                ]}
                            >
                                {inventory.reduce(
                                    (sum, item) =>
                                        sum +
                                        Number(
                                            item.available_quantity ||
                                            0
                                        ),
                                    0
                                )}
                            </Text>

                            <Text
                                style={styles.summaryLabel}
                            >
                                Available
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.summaryCard,
                                {
                                    backgroundColor:
                                        '#EAF3FF',
                                },
                            ]}
                        >
                            <Ionicons
                                name="person-outline"
                                size={22}
                                color="#2878D8"
                            />

                            <Text
                                style={[
                                    styles.summaryValue,
                                    {
                                        color: '#2878D8',
                                    },
                                ]}
                            >
                                {inventory.reduce(
                                    (sum, item) =>
                                        sum +
                                        Number(
                                            item.assigned_quantity ||
                                            0
                                        ),
                                    0
                                )}
                            </Text>

                            <Text
                                style={styles.summaryLabel}
                            >
                                Assigned
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.summaryCard,
                                {
                                    backgroundColor:
                                        '#FFF4E2',
                                },
                            ]}
                        >
                            <Ionicons
                                name="construct-outline"
                                size={22}
                                color="#C27A00"
                            />

                            <Text
                                style={[
                                    styles.summaryValue,
                                    {
                                        color: '#C27A00',
                                    },
                                ]}
                            >
                                {inventory.reduce(
                                    (sum, item) =>
                                        sum +
                                        Number(
                                            item.repair_quantity ||
                                            0
                                        ) +
                                        Number(
                                            item.damaged_quantity ||
                                            0
                                        ),
                                    0
                                )}
                            </Text>

                            <Text
                                style={styles.summaryLabel}
                            >
                                Issues
                            </Text>
                        </View>
                    </View>
                </View>

                {/* STOCK RECORDS */}

                <View style={styles.section}>
                    <View
                        style={
                            styles.sectionHeader
                        }
                    >
                        <View
                            style={{
                                flex: 1,
                            }}
                        >
                            <Text
                                style={styles.sectionTitle}
                            >
                                Stock Records
                            </Text>

                            <Text
                                style={
                                    styles.sectionSubtitle
                                }
                            >
                                Component and size-wise inventory
                            </Text>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.addStockTopButton}
                            onPress={openAddStock}
                        >
                            <Ionicons
                                name="add"
                                size={18}
                                color="#fff"
                            />

                            <Text
                                style={
                                    styles.addStockTopButtonText
                                }
                            >
                                Add Stock
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {inventory.length === 0 ? (
                        <View
                            style={styles.emptyCard}
                        >
                            <Ionicons
                                name="cube-outline"
                                size={42}
                                color="#A89DD4"
                            />

                            <Text
                                style={styles.emptyTitle}
                            >
                                No stock records
                            </Text>

                            <Text
                                style={styles.emptyText}
                            >
                                Add initial stock for this
                                uniform component and size.
                            </Text>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                style={styles.emptyAddButton}
                                onPress={openAddStock}
                            >
                                <Ionicons
                                    name="add"
                                    size={18}
                                    color="#fff"
                                />

                                <Text
                                    style={
                                        styles.emptyAddButtonText
                                    }
                                >
                                    Add Initial Stock
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        Object.entries(
                            groupedInventory
                        ).map(
                            ([
                                componentName,
                                records,
                            ]) => (
                                <View
                                    key={componentName}
                                    style={{
                                        marginBottom: 18,
                                    }}
                                >
                                    <Text
                                        style={
                                            styles.componentHeading
                                        }
                                    >
                                        {componentName}
                                    </Text>

                                    {records.map(
                                        (item) => {
                                            const isLowStock =
                                                item.available_quantity <=
                                                item.minimum_stock;

                                            return (
                                                <View
                                                    key={
                                                        item.inventory_id
                                                    }
                                                    style={
                                                        styles.stockCard
                                                    }
                                                >
                                                    <View
                                                        style={
                                                            styles.stockTop
                                                        }
                                                    >
                                                        <View
                                                            style={
                                                                styles.sizeBadge
                                                            }
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.sizeText
                                                                }
                                                            >
                                                                {item.size}
                                                            </Text>
                                                        </View>

                                                        <View
                                                            style={{
                                                                flex: 1,
                                                                marginLeft: 11,
                                                            }}
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.stockTitle
                                                                }
                                                            >
                                                                {componentName}
                                                            </Text>

                                                            <Text
                                                                style={
                                                                    styles.stockSubtitle
                                                                }
                                                            >
                                                                Size {item.size}
                                                            </Text>
                                                        </View>

                                                        {isLowStock && (
                                                            <View
                                                                style={
                                                                    styles.lowStockBadge
                                                                }
                                                            >
                                                                <Text
                                                                    style={
                                                                        styles.lowStockText
                                                                    }
                                                                >
                                                                    LOW
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>

                                                    <View
                                                        style={
                                                            styles.stockStats
                                                        }
                                                    >
                                                        <View
                                                            style={
                                                                styles.stockStat
                                                            }
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.stockStatValue
                                                                }
                                                            >
                                                                {
                                                                    item.total_quantity
                                                                }
                                                            </Text>

                                                            <Text
                                                                style={
                                                                    styles.stockStatLabel
                                                                }
                                                            >
                                                                Total
                                                            </Text>
                                                        </View>

                                                        <View
                                                            style={
                                                                styles.stockStat
                                                            }
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.stockStatValue,
                                                                    {
                                                                        color:
                                                                            '#22B866',
                                                                    },
                                                                ]}
                                                            >
                                                                {
                                                                    item.available_quantity
                                                                }
                                                            </Text>

                                                            <Text
                                                                style={
                                                                    styles.stockStatLabel
                                                                }
                                                            >
                                                                Available
                                                            </Text>
                                                        </View>

                                                        <View
                                                            style={
                                                                styles.stockStat
                                                            }
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.stockStatValue,
                                                                    {
                                                                        color:
                                                                            '#2878D8',
                                                                    },
                                                                ]}
                                                            >
                                                                {
                                                                    item.assigned_quantity
                                                                }
                                                            </Text>

                                                            <Text
                                                                style={
                                                                    styles.stockStatLabel
                                                                }
                                                            >
                                                                Assigned
                                                            </Text>
                                                        </View>

                                                        <View
                                                            style={
                                                                styles.stockStat
                                                            }
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.stockStatValue,
                                                                    {
                                                                        color:
                                                                            '#C27A00',
                                                                    },
                                                                ]}
                                                            >
                                                                {
                                                                    item.repair_quantity +
                                                                    item.damaged_quantity
                                                                }
                                                            </Text>

                                                            <Text
                                                                style={
                                                                    styles.stockStatLabel
                                                                }
                                                            >
                                                                Issues
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    <View
                                                        style={
                                                            styles.stockActions
                                                        }
                                                    >
                                                        <TouchableOpacity
                                                            activeOpacity={0.8}
                                                            style={styles.editButton}
                                                            onPress={() => openEdit(item)}
                                                        >
                                                            <Ionicons
                                                                name="create-outline"
                                                                size={18}
                                                                color="#6C4DFF"
                                                            />
                                                            <Text style={styles.editButtonText}>Edit</Text>
                                                        </TouchableOpacity>

                                                        {isAdmin && (
                                                            <TouchableOpacity
                                                                activeOpacity={0.8}
                                                                style={styles.deleteStockButton}
                                                                onPress={() => deleteStock(item)}
                                                            >
                                                                <Ionicons
                                                                    name="trash-outline"
                                                                    size={18}
                                                                    color="#D64545"
                                                                />
                                                                <Text style={styles.deleteStockButtonText}>Delete</Text>
                                                            </TouchableOpacity>
                                                        )}

                                                    </View>
                                                </View>
                                            );
                                        }
                                    )}
                                </View>
                            )
                        )
                    )}
                </View>

                <View
                    style={styles.bottomSpace}
                />
            </ScrollView>

            {/* EDIT MODAL */}

            <Modal
                visible={editModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() =>
                    setEditModalVisible(false)
                }
            >
                <View
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalCard}>
                        <View
                            style={
                                styles.modalHeader
                            }
                        >
                            <View>
                                <Text
                                    style={
                                        styles.modalTitle
                                    }
                                >
                                    Edit Stock
                                </Text>

                                <Text
                                    style={
                                        styles.modalSubtitle
                                    }
                                >
                                    {selectedItem?.component_name ||
                                        'Uniform component'}{' '}
                                    • Size{' '}
                                    {selectedItem?.size ||
                                        ''}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() =>
                                    setEditModalVisible(
                                        false
                                    )
                                }
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={28}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={
                                false
                            }
                        >
                            <Text
                                style={
                                    styles.inputLabel
                                }
                            >
                                Total Quantity
                            </Text>

                            <TextInput
                                style={
                                    styles.input
                                }
                                value={totalQuantity}
                                onChangeText={
                                    setTotalQuantity
                                }
                                keyboardType="numeric"
                                placeholder="Total quantity"
                            />

                            <Text
                                style={
                                    styles.inputLabel
                                }
                            >
                                Minimum Stock
                            </Text>

                            <TextInput
                                style={
                                    styles.input
                                }
                                value={minimumStock}
                                onChangeText={
                                    setMinimumStock
                                }
                                keyboardType="numeric"
                                placeholder="Minimum stock"
                            />

                            <Text
                                style={
                                    styles.inputLabel
                                }
                            >
                                Notes
                            </Text>

                            <TextInput
                                style={[
                                    styles.input,
                                    styles.textArea,
                                ]}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                placeholder="Optional notes"
                            />

                            <TouchableOpacity
                                style={
                                    styles.saveButton
                                }
                                onPress={saveEdit}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator
                                        color="#fff"
                                    />
                                ) : (
                                    <Text
                                        style={
                                            styles.saveButtonText
                                        }
                                    >
                                        Save Changes
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>


            {/* INITIAL STOCK MODAL */}

            <Modal
                visible={addStockModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() =>
                    setAddStockModalVisible(false)
                }
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>
                                    Add Initial Stock
                                </Text>

                                <Text style={styles.modalSubtitle}>
                                    Add component and size stock
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() =>
                                    setAddStockModalVisible(false)
                                }
                                disabled={saving}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={28}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.inputLabel}>
                                Component
                            </Text>

                            <View style={styles.optionWrap}>
                                {(catalog?.components || []).map(
                                    (component) => {
                                        const selected =
                                            component.component_id ===
                                            newComponentId;

                                        return (
                                            <TouchableOpacity
                                                key={
                                                    component.component_id
                                                }
                                                activeOpacity={0.8}
                                                style={[
                                                    styles.optionChip,
                                                    selected &&
                                                    styles.optionChipSelected,
                                                ]}
                                                onPress={() => {
                                                    setNewComponentId(
                                                        component.component_id
                                                    );
                                                    setNewSize('');
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.optionChipText,
                                                        selected &&
                                                        styles.optionChipTextSelected,
                                                    ]}
                                                >
                                                    {component.name}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    }
                                )}
                            </View>

                            <Text style={styles.inputLabel}>
                                Size
                            </Text>

                            {availableSizes.length === 0 ? (
                                <Text style={styles.helperText}>
                                    Select a component to see available sizes.
                                </Text>
                            ) : (
                                <View style={styles.optionWrap}>
                                    {availableSizes.map((size) => {
                                        const selected =
                                            size === newSize;

                                        return (
                                            <TouchableOpacity
                                                key={size}
                                                activeOpacity={0.8}
                                                style={[
                                                    styles.optionChip,
                                                    selected &&
                                                    styles.optionChipSelected,
                                                ]}
                                                onPress={() =>
                                                    setNewSize(size)
                                                }
                                            >
                                                <Text
                                                    style={[
                                                        styles.optionChipText,
                                                        selected &&
                                                        styles.optionChipTextSelected,
                                                    ]}
                                                >
                                                    {size}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}

                            <Text style={styles.inputLabel}>
                                Initial Quantity
                            </Text>

                            <TextInput
                                style={styles.input}
                                value={newTotalQuantity}
                                onChangeText={
                                    setNewTotalQuantity
                                }
                                keyboardType="numeric"
                                placeholder="e.g. 20"
                            />

                            <Text style={styles.inputLabel}>
                                Minimum Stock
                            </Text>

                            <TextInput
                                style={styles.input}
                                value={newMinimumStock}
                                onChangeText={
                                    setNewMinimumStock
                                }
                                keyboardType="numeric"
                                placeholder="e.g. 5"
                            />

                            <Text style={styles.inputLabel}>
                                Notes
                            </Text>

                            <TextInput
                                style={[
                                    styles.input,
                                    styles.textArea,
                                ]}
                                value={newNotes}
                                onChangeText={setNewNotes}
                                multiline
                                placeholder="Optional notes"
                            />

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={saveInitialStock}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator
                                        color="#fff"
                                    />
                                ) : (
                                    <Text
                                        style={
                                            styles.saveButtonText
                                        }
                                    >
                                        Add Initial Stock
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
        paddingTop: 64,
        paddingHorizontal: 18,
        paddingBottom: 25,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },

    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    headerBack: {
        width: 42,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
    },

    headerTextContainer: {
        flex: 1,
        marginHorizontal: 7,
    },

    headerTitle: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '800',
    },

    headerSubtitle: {
        color: '#E9DDFF',
        fontSize: 12,
        marginTop: 3,
    },

    section: {
        marginHorizontal: 20,
        marginTop: 21,
    },

    uniformCard: {
        backgroundColor: '#fff',
        borderRadius: 21,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },

    uniformIcon: {
        width: 55,
        height: 55,
        borderRadius: 17,
        backgroundColor: '#F0EDFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 13,
    },

    uniformName: {
        color: '#17172D',
        fontSize: 18,
        fontWeight: '800',
    },

    uniformMeta: {
        color: '#6C4DFF',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 3,
    },

    uniformCount: {
        color: '#888',
        fontSize: 10.5,
        marginTop: 3,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },

    sectionTitle: {
        color: '#17172D',
        fontSize: 20,
        fontWeight: '800',
    },

    sectionSubtitle: {
        color: '#777',
        fontSize: 11.5,
        marginTop: 3,
    },

    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 9,
        marginTop: 12,
    },

    summaryCard: {
        width: '48.5%',
        minHeight: 105,
        borderRadius: 18,
        padding: 13,
    },

    summaryValue: {
        fontSize: 22,
        fontWeight: '800',
        marginTop: 7,
    },

    summaryLabel: {
        color: '#777',
        fontSize: 10.5,
        marginTop: 1,
    },

    componentHeading: {
        color: '#6C4DFF',
        fontSize: 14,
        fontWeight: '800',
        marginTop: 13,
        marginBottom: 8,
    },

    stockCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 14,
        marginBottom: 10,
        elevation: 2,
    },

    stockTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    sizeBadge: {
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor: '#EEE7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    sizeText: {
        color: '#6C4DFF',
        fontSize: 13,
        fontWeight: '800',
    },

    stockTitle: {
        color: '#17172D',
        fontSize: 14.5,
        fontWeight: '800',
    },

    stockSubtitle: {
        color: '#888',
        fontSize: 10.5,
        marginTop: 3,
    },

    lowStockBadge: {
        backgroundColor: '#FFF0D7',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
    },

    lowStockText: {
        color: '#C27A00',
        fontSize: 8,
        fontWeight: '800',
    },

    stockStats: {
        flexDirection: 'row',
        marginTop: 15,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0EEF5',
    },

    stockStat: {
        flex: 1,
        alignItems: 'center',
    },

    stockStatValue: {
        color: '#333',
        fontSize: 15,
        fontWeight: '800',
    },

    stockStatLabel: {
        color: '#999',
        fontSize: 9,
        marginTop: 3,
    },

    stockActions: {
        flexDirection: 'row',
        marginTop: 13,
        gap: 9,
    },

    editButton: {
        flex: 1,
        height: 43,
        borderRadius: 13,
        backgroundColor: '#F0EDFF',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 7,
    },

    editButtonText: {
        color: '#6C4DFF',
        fontSize: 12,
        fontWeight: '800',
    },

    deleteStockButton: {
        flex: 1,
        height: 43,
        borderRadius: 13,
        backgroundColor: '#FFF0F0',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 7,
    },

    deleteStockButtonText: {
        color: '#D64545',
        fontSize: 12,
        fontWeight: '800',
    },

    addStockTopButton: {
        backgroundColor: '#6C4DFF',
        minHeight: 40,
        paddingHorizontal: 14,
        borderRadius: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginLeft: 10,
    },

    addStockTopButtonText: {
        color: '#fff',
        fontSize: 11.5,
        fontWeight: '800',
    },

    emptyAddButton: {
        marginTop: 16,
        backgroundColor: '#6C4DFF',
        minHeight: 44,
        paddingHorizontal: 18,
        borderRadius: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
    },

    emptyAddButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },

    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        marginTop: 12,
    },

    emptyTitle: {
        color: '#333',
        fontSize: 16,
        fontWeight: '800',
        marginTop: 10,
    },

    emptyText: {
        color: '#888',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 5,
        lineHeight: 18,
    },

    centerContainer: {
        flex: 1,
        backgroundColor: '#F6F4FF',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },

    loadingText: {
        color: '#6C4DFF',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
    },

    permissionIcon: {
        width: 80,
        height: 80,
        borderRadius: 25,
        backgroundColor: '#EEE7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    permissionTitle: {
        color: '#17172D',
        fontSize: 21,
        fontWeight: '800',
        marginTop: 17,
    },

    permissionText: {
        color: '#777',
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
        marginTop: 8,
    },

    backButton: {
        backgroundColor: '#6C4DFF',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 14,
        marginTop: 20,
    },

    backButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '800',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },

    modalCard: {
        backgroundColor: '#F8F7FC',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 19,
        paddingBottom: 30,
        maxHeight: '88%',
    },

    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },

    modalTitle: {
        color: '#17172D',
        fontSize: 20,
        fontWeight: '800',
    },

    modalSubtitle: {
        color: '#777',
        fontSize: 11,
        marginTop: 3,
    },

    inputLabel: {
        color: '#555',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 11,
        marginBottom: 6,
    },

    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E1EF',
        borderRadius: 13,
        height: 46,
        paddingHorizontal: 13,
        color: '#222',
        fontSize: 13,
    },

    textArea: {
        height: 80,
        paddingTop: 12,
        textAlignVertical: 'top',
    },

    optionWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4,
    },

    optionChip: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E2DDF0',
        paddingHorizontal: 13,
        paddingVertical: 10,
        borderRadius: 12,
    },

    optionChipSelected: {
        backgroundColor: '#6C4DFF',
        borderColor: '#6C4DFF',
    },

    optionChipText: {
        color: '#555',
        fontSize: 11.5,
        fontWeight: '700',
    },

    optionChipTextSelected: {
        color: '#fff',
    },

    helperText: {
        color: '#999',
        fontSize: 11,
        marginBottom: 4,
    },

    saveButton: {
        backgroundColor: '#6C4DFF',
        height: 49,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 8,
    },

    saveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },

    bottomSpace: {
        height: 35,
    },
});