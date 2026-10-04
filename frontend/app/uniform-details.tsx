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
    RefreshControl,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';

import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationBell from '../components/common/NotificationBell';
import { useAuth } from '../contexts/AuthContext';
import ImageViewerModal from '../components/common/ImageViewerModal';

type UniformStats = {
    total?: number;
    available?: number;
    assigned?: number;
    not_usable?: number;
};

type InventoryRecord = {
    inventory_id?: string;
    component_id?: string;
    catalog_id?: string;
    size?: string;
    total_quantity?: number;
    available_quantity?: number;
    assigned_quantity?: number;
    repair_quantity?: number;
    damaged_quantity?: number;
    purchase_price?: number;
    minimum_stock?: number;
};

type UniformComponent = {
    component_id: string;
    name?: string;
    component_name?: string;
    required?: boolean;
    mandatory?: boolean;
    quantity?: number;
    sizes?: string[];
    available_sizes?: string[];
    inventory?: InventoryRecord[];
    stats?: UniformStats;
};

type UniformAssignment = {
    assignment_id?: string;
    user_id?: string;
    assignment_status?: string;
    assigned_date?: string;
    member_notes?: string;
    remarks?: string;
    components?: any[];
};

type UniformDetails = {
    catalog_id: string;
    name: string;
    category?: string;
    description?: string;
    guide?: string;
    images?: string[];
    components?: UniformComponent[];
    price?: number;
    currency?: string;
    is_mandatory?: boolean;
    active?: boolean;

    stats?: UniformStats;

    my_assignment?: UniformAssignment | null;
};

export default function UniformDetailsScreen() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        catalog_id?: string | string[];
    }>();

    const { user, hasPermission } = useAuth();

    const isAdmin = user?.role === 'admin';

    const catalogId = Array.isArray(params.catalog_id)
        ? params.catalog_id[0]
        : params.catalog_id;

    const hasUniformPermission =
        isAdmin || hasPermission('uniforms');

    const [uniform, setUniform] =
        useState<UniformDetails | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState('');

    const [activeImage, setActiveImage] =
        useState(0);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);

    const loadUniform = useCallback(async () => {
        if (!catalogId) {
            setError('Uniform catalogue ID is missing.');
            setLoading(false);
            return;
        }

        try {
            setError('');

            const baseUrl =
                process.env.EXPO_PUBLIC_BACKEND_URL;

            if (!baseUrl) {
                throw new Error(
                    'EXPO_PUBLIC_BACKEND_URL is not configured.'
                );
            }

            const sessionToken = await AsyncStorage.getItem('session_token');

            if (!sessionToken) {
                throw new Error('Session expired. Please login again.');
            }

            const response = await fetch(
                `${baseUrl}/uniforms/catalog/${catalogId}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${sessionToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                const message =
                    await response.text();

                throw new Error(
                    message ||
                    'Failed to load uniform details.'
                );
            }

            const data =
                await response.json();

            setUniform(data);
        } catch (err: any) {
            console.log(
                'Uniform details error:',
                err
            );

            setError(
                err?.message ||
                'Unable to load uniform details.'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [catalogId]);

    useEffect(() => {
        loadUniform();
    }, [loadUniform]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUniform();
    };

    const stats = uniform?.stats || {};

    const total =
        Number(stats.total || 0);

    const available =
        Number(stats.available || 0);

    const assigned =
        Number(stats.assigned || 0);

    const notUsable =
        Number(stats.not_usable || 0);

    const images =
        uniform?.images || [];

    const components =
        uniform?.components || [];

    const currentAssignment =
        uniform?.my_assignment || null;

    const assignmentStatus =
        currentAssignment?.assignment_status ||
        'none';

    const getStatus = () => {
        if (available <= 0) {
            return {
                label: 'OUT OF STOCK',
                background: '#FFEAEA',
                text: '#FF4D4F',
            };
        }

        if (available <= 5) {
            return {
                label: 'LOW STOCK',
                background: '#FFF3E2',
                text: '#F59E0B',
            };
        }

        return {
            label: 'AVAILABLE',
            background: '#E8FFF0',
            text: '#22B866',
        };
    };

    const status = getStatus();

    const totalComponents =
        components.length;

    const mandatoryComponents =
        components.filter(
            (component) =>
                component.required === true ||
                component.mandatory === true
        ).length;

    const openUniformInventory = () => {
        if (!catalogId) return;

        router.push({
            pathname: '/uniform-inventory',
            params: {
                catalog_id: catalogId,
            },
        } as any);
    };

    const openAssignments = () => {
        if (!catalogId) return;

        router.push({
            pathname: '/uniform-assignments',
            params: {
                catalog_id: catalogId,
                uniform_name: uniform?.name || '',
            },
        } as any);
    };

    const assignUniform = () => {
        if (!catalogId) return;

        if (available <= 0) {
            Alert.alert(
                'Out of Stock',
                'There is currently no available stock for this uniform.'
            );
            return;
        }

        router.push({
            pathname: '/uniform-assign',
            params: {
                catalog_id: catalogId,
                uniform_name: uniform?.name || '',
            },
        } as any);
    };

    const renderStat = (
        icon: keyof typeof Ionicons.glyphMap,
        value: number,
        label: string,
        background: string,
        color: string
    ) => (
        <View
            style={[
                styles.statCard,
                { backgroundColor: background },
            ]}
        >
            <View
                style={[
                    styles.statIcon,
                    { backgroundColor: '#FFFFFF' },
                ]}
            >
                <Ionicons
                    name={icon}
                    size={19}
                    color={color}
                />
            </View>

            <Text
                style={[
                    styles.statValue,
                    { color },
                ]}
            >
                {value}
            </Text>

            <Text style={styles.statLabel}>
                {label}
            </Text>
        </View>
    );

    const componentCards = useMemo(() => {
        return components.map(
            (component, index) => {
                const componentName =
                    component.name ||
                    component.component_name ||
                    `Component ${index + 1}`;

                const componentStats =
                    component.stats || {};

                const componentTotal =
                    Number(
                        componentStats.total || 0
                    );

                const componentAvailable =
                    Number(
                        componentStats.available || 0
                    );

                const componentAssigned =
                    Number(
                        componentStats.assigned || 0
                    );

                const componentNotUsable =
                    Number(
                        componentStats.not_usable || 0
                    );

                const inventory =
                    component.inventory || [];

                const sizes = Array.from(
                    new Set(
                        inventory
                            .map((item) => item.size)
                            .filter(Boolean)
                    )
                );

                return {
                    component,
                    componentName,
                    componentTotal,
                    componentAvailable,
                    componentAssigned,
                    componentNotUsable,
                    sizes,
                };
            }
        );
    }, [components]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingIcon}>
                    <Ionicons
                        name="shirt-outline"
                        size={36}
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

                <Text style={styles.loadingText}>
                    Loading uniform details...
                </Text>
            </View>
        );
    }

    if (error || !uniform) {
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
                    Unable to load uniform
                </Text>

                <Text style={styles.errorMessage}>
                    {error ||
                        'Uniform details could not be found.'}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.retryButton}
                    onPress={loadUniform}
                >
                    <Text style={styles.retryText}>
                        Try Again
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.backErrorButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backErrorText}>
                        Go Back
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
                        colors={['#5B3DF5']}
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
                            style={
                                styles.headerTextContainer
                            }
                        >
                            <Text
                                style={styles.headerTitle}
                                numberOfLines={1}
                            >
                                Uniform Details
                            </Text>

                            <Text
                                style={styles.headerSubtitle}
                                numberOfLines={1}
                            >
                                View stock, components and assignments
                            </Text>
                        </View>

                        <NotificationBell />
                    </View>
                </LinearGradient>

                {/* IMAGE */}

                <View style={styles.imageSection}>
                    <View style={styles.mainImageContainer}>
                        {images.length > 0 ? (
                            <TouchableOpacity
                                activeOpacity={0.95}
                                style={styles.imageTapArea}
                                onPress={() => {
                                    setViewerIndex(activeImage);
                                    setViewerVisible(true);
                                }}
                            >
                                <Image
                                    source={{
                                        uri: images[activeImage],
                                    }}
                                    style={styles.mainImage}
                                />
                            </TouchableOpacity>
                        ) : (
                            <View
                                style={
                                    styles.imagePlaceholder
                                }
                            >
                                <Ionicons
                                    name="shirt-outline"
                                    size={72}
                                    color="#6C4DFF"
                                />
                            </View>
                        )}

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
                                        color: status.text,
                                    },
                                ]}
                            >
                                {status.label}
                            </Text>
                        </View>
                    </View>

                    {images.length > 1 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={
                                styles.thumbnailRow
                            }
                        >
                            {images.map(
                                (image, index) => (
                                    <TouchableOpacity
                                        key={`${image}-${index}`}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            setActiveImage(index);
                                            setViewerIndex(index);
                                            setViewerVisible(true);
                                        }}
                                        style={[
                                            styles.thumbnail,
                                            index ===
                                            activeImage &&
                                            styles.thumbnailActive,
                                        ]}
                                    >
                                        <Image
                                            source={{
                                                uri: image,
                                            }}
                                            style={
                                                styles.thumbnailImage
                                            }
                                        />
                                    </TouchableOpacity>
                                )
                            )}
                        </ScrollView>
                    )}
                </View>

                {/* BASIC INFORMATION */}

                <View style={styles.section}>
                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Text
                                style={styles.uniformName}
                            >
                                {uniform.name}
                            </Text>

                            {!!uniform.category && (
                                <Text
                                    style={styles.categoryText}
                                >
                                    {uniform.category}
                                </Text>
                            )}
                        </View>

                        {uniform.is_mandatory && (
                            <View
                                style={styles.mandatoryBadge}
                            >
                                <Ionicons
                                    name="star"
                                    size={13}
                                    color="#F59E0B"
                                />

                                <Text
                                    style={
                                        styles.mandatoryText
                                    }
                                >
                                    Mandatory
                                </Text>
                            </View>
                        )}
                    </View>

                    {!!uniform.description && (
                        <Text
                            style={styles.description}
                        >
                            {uniform.description}
                        </Text>
                    )}

                    {!!uniform.guide && (
                        <View style={styles.guideCard}>
                            <View
                                style={styles.guideIcon}
                            >
                                <Ionicons
                                    name="information-circle-outline"
                                    size={22}
                                    color="#6C4DFF"
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text
                                    style={styles.guideTitle}
                                >
                                    Uniform Guide
                                </Text>

                                <Text
                                    style={styles.guideText}
                                >
                                    {uniform.guide}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* STOCK OVERVIEW */}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Stock Overview
                    </Text>

                    <View style={styles.statsGrid}>
                        {renderStat(
                            'cube-outline',
                            total,
                            'Total',
                            '#EAF3FF',
                            '#2878D8'
                        )}

                        {renderStat(
                            'checkmark-circle-outline',
                            available,
                            'Available',
                            '#E9FFF2',
                            '#22B866'
                        )}

                        {renderStat(
                            'people-outline',
                            assigned,
                            'Assigned',
                            '#FFF4E4',
                            '#F59E0B'
                        )}

                        {renderStat(
                            'warning-outline',
                            notUsable,
                            'Not Usable',
                            '#FFEAEA',
                            '#FF4D4F'
                        )}
                    </View>
                </View>

                {/* COMPONENTS */}

                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View>
                            <Text style={styles.sectionTitle}>
                                Components
                            </Text>

                            <Text
                                style={styles.sectionSubtitle}
                            >
                                {totalComponents}{' '}
                                {totalComponents === 1
                                    ? 'component'
                                    : 'components'}
                                {mandatoryComponents > 0
                                    ? ` • ${mandatoryComponents} mandatory`
                                    : ''}
                            </Text>
                        </View>
                    </View>

                    {componentCards.length === 0 ? (
                        <View
                            style={styles.emptyComponentCard}
                        >
                            <Ionicons
                                name="shirt-outline"
                                size={34}
                                color="#8A75E8"
                            />

                            <Text
                                style={
                                    styles.emptyComponentTitle
                                }
                            >
                                No components configured
                            </Text>

                            <Text
                                style={
                                    styles.emptyComponentText
                                }
                            >
                                This uniform does not have
                                any components configured yet.
                            </Text>
                        </View>
                    ) : (
                        componentCards.map(
                            (item, index) => (
                                <View
                                    key={
                                        item.component
                                            .component_id ||
                                        index
                                    }
                                    style={styles.componentCard}
                                >
                                    <View
                                        style={
                                            styles.componentTop
                                        }
                                    >
                                        <View
                                            style={
                                                styles.componentIcon
                                            }
                                        >
                                            <Ionicons
                                                name="shirt-outline"
                                                size={21}
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
                                                    styles.componentName
                                                }
                                            >
                                                {item.componentName}
                                            </Text>

                                            {(item.component
                                                .required ||
                                                item.component
                                                    .mandatory) && (
                                                    <Text
                                                        style={
                                                            styles.requiredText
                                                        }
                                                    >
                                                        Required
                                                    </Text>
                                                )}
                                        </View>
                                    </View>

                                    <View
                                        style={
                                            styles.componentStats
                                        }
                                    >
                                        <View
                                            style={
                                                styles.componentStat
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.componentValue
                                                }
                                            >
                                                {item.componentTotal}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.componentLabel
                                                }
                                            >
                                                Total
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.componentStat
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.componentValue,
                                                    {
                                                        color:
                                                            '#22B866',
                                                    },
                                                ]}
                                            >
                                                {
                                                    item.componentAvailable
                                                }
                                            </Text>

                                            <Text
                                                style={
                                                    styles.componentLabel
                                                }
                                            >
                                                Available
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.componentStat
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.componentValue,
                                                    {
                                                        color:
                                                            '#F59E0B',
                                                    },
                                                ]}
                                            >
                                                {
                                                    item.componentAssigned
                                                }
                                            </Text>

                                            <Text
                                                style={
                                                    styles.componentLabel
                                                }
                                            >
                                                Assigned
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.componentStat
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.componentValue,
                                                    {
                                                        color:
                                                            '#FF4D4F',
                                                    },
                                                ]}
                                            >
                                                {
                                                    item.componentNotUsable
                                                }
                                            </Text>

                                            <Text
                                                style={
                                                    styles.componentLabel
                                                }
                                            >
                                                Issues
                                            </Text>
                                        </View>
                                    </View>

                                    {item.sizes.length > 0 && (
                                        <View
                                            style={
                                                styles.sizesSection
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.sizesTitle
                                                }
                                            >
                                                Available Sizes
                                            </Text>

                                            <View
                                                style={
                                                    styles.sizeRow
                                                }
                                            >
                                                {item.sizes.map(
                                                    (size) => (
                                                        <View
                                                            key={size}
                                                            style={
                                                                styles.sizeChip
                                                            }
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.sizeText
                                                                }
                                                            >
                                                                {size}
                                                            </Text>
                                                        </View>
                                                    )
                                                )}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )
                        )
                    )}
                </View>

                {/* CURRENT USER ASSIGNMENT */}

                {currentAssignment && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Your Current Assignment
                        </Text>

                        <View
                            style={
                                styles.assignmentCard
                            }
                        >
                            <View
                                style={
                                    styles.assignmentHeader
                                }
                            >
                                <View
                                    style={
                                        styles.assignmentIcon
                                    }
                                >
                                    <Ionicons
                                        name="person-outline"
                                        size={23}
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
                                            styles.assignmentTitle
                                        }
                                    >
                                        Uniform Assigned
                                    </Text>

                                    <Text
                                        style={
                                            styles.assignmentDate
                                        }
                                    >
                                        {currentAssignment.assigned_date ||
                                            'Assignment date unavailable'}
                                    </Text>
                                </View>

                                <View
                                    style={[
                                        styles.assignmentStatus,
                                        assignmentStatus ===
                                            'returned'
                                            ? styles.returnedStatus
                                            : styles.activeStatus,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.assignmentStatusText,
                                            assignmentStatus ===
                                                'returned'
                                                ? styles.returnedStatusText
                                                : styles.activeStatusText,
                                        ]}
                                    >
                                        {assignmentStatus
                                            .replace(
                                                /_/g,
                                                ' '
                                            )
                                            .toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            {!!currentAssignment
                                .member_notes && (
                                    <Text
                                        style={
                                            styles.assignmentNotes
                                        }
                                    >
                                        {currentAssignment.member_notes}
                                    </Text>
                                )}

                            {!!currentAssignment
                                .remarks && (
                                    <Text
                                        style={
                                            styles.assignmentNotes
                                        }
                                    >
                                        {currentAssignment.remarks}
                                    </Text>
                                )}
                        </View>
                    </View>
                )}

                {/* ACTIONS */}

                {hasUniformPermission && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Management
                        </Text>
                        <TouchableOpacity
                            activeOpacity={0.88}
                            style={styles.secondaryAction}
                            onPress={openUniformInventory}
                        >
                            <View
                                style={styles.secondaryActionIcon}
                            >
                                <Ionicons
                                    name="cube-outline"
                                    size={23}
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
                                        styles.secondaryActionTitle
                                    }
                                >
                                    Manage Stock
                                </Text>

                                <Text
                                    style={
                                        styles.secondaryActionSubtitle
                                    }
                                >
                                    View sizes, stock and add purchased items
                                </Text>
                            </View>

                            <Ionicons
                                name="chevron-forward"
                                size={22}
                                color="#777"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.88}
                            style={styles.primaryAction}
                            onPress={assignUniform}
                        >
                            <View
                                style={
                                    styles.primaryActionIcon
                                }
                            >
                                <Ionicons
                                    name="person-add-outline"
                                    size={23}
                                    color="#fff"
                                />
                            </View>

                            <View
                                style={{
                                    flex: 1,
                                }}
                            >
                                <Text
                                    style={
                                        styles.primaryActionTitle
                                    }
                                >
                                    Assign Uniform
                                </Text>

                                <Text
                                    style={
                                        styles.primaryActionSubtitle
                                    }
                                >
                                    Assign this uniform package to a member
                                </Text>
                            </View>

                            <Ionicons
                                name="chevron-forward"
                                size={22}
                                color="#fff"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.88}
                            style={styles.secondaryAction}
                            onPress={openAssignments}
                        >
                            <View
                                style={
                                    styles.secondaryActionIcon
                                }
                            >
                                <Ionicons
                                    name="people-outline"
                                    size={23}
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
                                        styles.secondaryActionTitle
                                    }
                                >
                                    Assignment History
                                </Text>

                                <Text
                                    style={
                                        styles.secondaryActionSubtitle
                                    }
                                >
                                    View members who received this uniform
                                </Text>
                            </View>

                            <Ionicons
                                name="chevron-forward"
                                size={22}
                                color="#777"
                            />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.bottomSpace} />
            </ScrollView>
            <ImageViewerModal
                visible={viewerVisible}
                images={images}
                initialIndex={viewerIndex}
                title={uniform.name || 'Uniform Images'}
                onClose={() => setViewerVisible(false)}
            />
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
        fontSize: 27,
        fontWeight: '800',
    },

    headerSubtitle: {
        color: '#E9DDFF',
        fontSize: 13,
        marginTop: 3,
    },

    imageSection: {
        marginHorizontal: 20,
        marginTop: 18,
    },

    mainImageContainer: {
        height: 255,
        borderRadius: 27,
        backgroundColor: '#EEE7FF',
        overflow: 'hidden',
        position: 'relative',
    },

    mainImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    imageTapArea: {
        width: '100%',
        height: '100%',
    },

    statusBadge: {
        position: 'absolute',
        top: 15,
        right: 15,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
    },

    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },

    thumbnailRow: {
        paddingTop: 10,
        paddingBottom: 3,
    },

    thumbnail: {
        width: 65,
        height: 65,
        borderRadius: 13,
        overflow: 'hidden',
        marginRight: 9,
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

    section: {
        marginHorizontal: 20,
        marginTop: 23,
    },

    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    uniformName: {
        color: '#16162E',
        fontSize: 26,
        fontWeight: '800',
    },

    categoryText: {
        color: '#6C4DFF',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 4,
    },

    mandatoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#FFF4D9',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 13,
        marginLeft: 10,
    },

    mandatoryText: {
        color: '#C27A00',
        fontSize: 10,
        fontWeight: '800',
    },

    description: {
        color: '#686879',
        fontSize: 14,
        lineHeight: 21,
        marginTop: 10,
    },

    guideCard: {
        marginTop: 14,
        backgroundColor: '#F0EDFF',
        borderRadius: 17,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    guideIcon: {
        width: 39,
        height: 39,
        borderRadius: 13,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 11,
    },

    guideTitle: {
        color: '#28204A',
        fontSize: 14,
        fontWeight: '800',
    },

    guideText: {
        color: '#6D6780',
        fontSize: 12.5,
        lineHeight: 18,
        marginTop: 3,
    },

    sectionTitle: {
        color: '#16162E',
        fontSize: 21,
        fontWeight: '800',
    },

    sectionSubtitle: {
        color: '#777',
        fontSize: 12.5,
        marginTop: 3,
    },

    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 9,
        marginTop: 12,
    },

    statCard: {
        width: '48.5%',
        minHeight: 104,
        borderRadius: 20,
        padding: 13,
    },

    statIcon: {
        width: 34,
        height: 34,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },

    statValue: {
        fontSize: 25,
        fontWeight: '800',
        marginTop: 6,
    },

    statLabel: {
        color: '#696979',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 1,
    },

    componentCard: {
        backgroundColor: '#fff',
        borderRadius: 21,
        padding: 15,
        marginTop: 11,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.05,
        shadowRadius: 7,
    },

    componentTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    componentIcon: {
        width: 43,
        height: 43,
        borderRadius: 14,
        backgroundColor: '#F0EDFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 11,
    },

    componentName: {
        color: '#16162E',
        fontSize: 16,
        fontWeight: '800',
    },

    requiredText: {
        color: '#F59E0B',
        fontSize: 10.5,
        fontWeight: '700',
        marginTop: 2,
    },

    componentStats: {
        flexDirection: 'row',
        marginTop: 14,
        backgroundColor: '#F8F7FC',
        borderRadius: 14,
        paddingVertical: 9,
    },

    componentStat: {
        flex: 1,
        alignItems: 'center',
    },

    componentValue: {
        color: '#2878D8',
        fontSize: 15,
        fontWeight: '800',
    },

    componentLabel: {
        color: '#777',
        fontSize: 9,
        marginTop: 2,
    },

    sizesSection: {
        marginTop: 13,
    },

    sizesTitle: {
        color: '#555',
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 7,
    },

    sizeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
    },

    sizeChip: {
        backgroundColor: '#EEE9FF',
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 10,
    },

    sizeText: {
        color: '#6C4DFF',
        fontSize: 11,
        fontWeight: '800',
    },

    emptyComponentCard: {
        backgroundColor: '#fff',
        borderRadius: 21,
        paddingVertical: 35,
        paddingHorizontal: 25,
        alignItems: 'center',
        marginTop: 12,
    },

    emptyComponentTitle: {
        color: '#16162E',
        fontSize: 16,
        fontWeight: '800',
        marginTop: 10,
    },

    emptyComponentText: {
        color: '#777',
        fontSize: 12.5,
        textAlign: 'center',
        lineHeight: 18,
        marginTop: 5,
    },

    assignmentCard: {
        backgroundColor: '#fff',
        borderRadius: 21,
        padding: 15,
        marginTop: 12,
    },

    assignmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    assignmentIcon: {
        width: 45,
        height: 45,
        borderRadius: 14,
        backgroundColor: '#F0EDFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 11,
    },

    assignmentTitle: {
        color: '#16162E',
        fontSize: 15,
        fontWeight: '800',
    },

    assignmentDate: {
        color: '#777',
        fontSize: 11.5,
        marginTop: 3,
    },

    assignmentStatus: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 10,
    },

    activeStatus: {
        backgroundColor: '#E8FFF0',
    },

    returnedStatus: {
        backgroundColor: '#F0F0F0',
    },

    assignmentStatusText: {
        fontSize: 9,
        fontWeight: '800',
    },

    activeStatusText: {
        color: '#22B866',
    },

    returnedStatusText: {
        color: '#777',
    },

    assignmentNotes: {
        color: '#666',
        fontSize: 12.5,
        lineHeight: 18,
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F0EEF5',
    },

    primaryAction: {
        marginTop: 12,
        backgroundColor: '#6C4DFF',
        borderRadius: 19,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },

    primaryActionIcon: {
        width: 43,
        height: 43,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    primaryActionTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },

    primaryActionSubtitle: {
        color: '#E7E0FF',
        fontSize: 11.5,
        marginTop: 3,
    },

    secondaryAction: {
        marginTop: 10,
        backgroundColor: '#fff',
        borderRadius: 19,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },

    secondaryActionIcon: {
        width: 43,
        height: 43,
        borderRadius: 14,
        backgroundColor: '#F0EDFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    secondaryActionTitle: {
        color: '#16162E',
        fontSize: 15,
        fontWeight: '800',
    },

    secondaryActionSubtitle: {
        color: '#777',
        fontSize: 11.5,
        marginTop: 3,
    },

    loadingContainer: {
        flex: 1,
        backgroundColor: '#F6F4FF',
        justifyContent: 'center',
        alignItems: 'center',
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

    errorContainer: {
        flex: 1,
        backgroundColor: '#F6F4FF',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 35,
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

    backErrorButton: {
        marginTop: 10,
        paddingHorizontal: 25,
        paddingVertical: 10,
    },

    backErrorText: {
        color: '#6C4DFF',
        fontWeight: '700',
        fontSize: 14,
    },

    bottomSpace: {
        height: 35,
    },
});