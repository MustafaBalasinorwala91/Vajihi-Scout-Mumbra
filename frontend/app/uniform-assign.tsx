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
    Alert,
    RefreshControl,
} from 'react-native';

import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import NotificationBell from '../components/common/NotificationBell';
import { useAuth } from '../contexts/AuthContext';

type InventoryRecord = {
    inventory_id: string;
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
};

type UniformDetails = {
    catalog_id: string;
    name: string;
    category?: string;
    description?: string;
    images?: string[];
    components?: UniformComponent[];
};

type Member = {
    user_id: string;
    name?: string;
    username?: string;
    its_no?: string;
    tag?: string;
    badge?: string;
};

type SelectedComponent = {
    component_id: string;
    component_name: string;
    inventory_id: string;
    size: string;
    quantity: number;
    assigned: boolean;
    paid: boolean;
    condition_given: string;
};

export default function UniformAssignScreen() {
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
    const [uniform, setUniform] =
        useState<UniformDetails | null>(null);

    const [members, setMembers] =
        useState<Member[]>([]);

    const [selectedMember, setSelectedMember] =
        useState<Member | null>(null);

    const [memberSearch, setMemberSearch] =
        useState('');

    const [showMemberList, setShowMemberList] =
        useState(false);

    const [selectedComponents, setSelectedComponents] =
        useState<Record<string, SelectedComponent>>({});

    const [memberNotes, setMemberNotes] =
        useState('');

    const [assignedDate, setAssignedDate] =
        useState(
            new Date().toISOString().split('T')[0]
        );

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState('');

    const loadData = useCallback(async () => {
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

            const [uniformResponse, membersResponse] =
                await Promise.all([
                    fetch(
                        `${baseUrl}/uniforms/catalog/${catalogId}`,
                        {
                            method: 'GET',
                            credentials: 'include',
                        }
                    ),

                    fetch(
                        `${baseUrl}/attendance/members`,
                        {
                            method: 'GET',
                            credentials: 'include',
                        }
                    ),
                ]);

            if (!uniformResponse.ok) {
                const message =
                    await uniformResponse.text();

                throw new Error(
                    message ||
                    'Failed to load uniform details.'
                );
            }

            if (!membersResponse.ok) {
                const message =
                    await membersResponse.text();

                throw new Error(
                    message ||
                    'Failed to load members.'
                );
            }

            const uniformData =
                await uniformResponse.json();

            const membersData =
                await membersResponse.json();

            setUniform(uniformData);

            const memberList =
                Array.isArray(membersData)
                    ? membersData
                    : Array.isArray(
                        membersData?.members
                    )
                        ? membersData.members
                        : [];

            setMembers(memberList);
        } catch (err: any) {
            console.log(
                'Uniform assign load error:',
                err
            );

            setError(
                err?.message ||
                'Unable to load assignment data.'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [catalogId]);

    useEffect(() => {
        if (!hasUniformPermission) {
            Alert.alert(
                'Permission Required',
                'You do not have permission to assign uniforms.',
                [
                    {
                        text: 'Go Back',
                        onPress: () => router.back(),
                    },
                ]
            );

            return;
        }

        loadData();
    }, [
        hasUniformPermission,
        loadData,
        router,
    ]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
    };

    const components =
        uniform?.components || [];

    const filteredMembers = useMemo(() => {
        const search =
            memberSearch.trim().toLowerCase();

        if (!search) {
            return members.slice(0, 30);
        }

        return members
            .filter((member) => {
                const text = [
                    member.name,
                    member.username,
                    member.its_no,
                    member.tag,
                    member.badge,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                return text.includes(search);
            })
            .slice(0, 30);
    }, [members, memberSearch]);

    const getAvailableInventory = (
        component: UniformComponent
    ) => {
        return (component.inventory || [])
            .filter(
                (inventory) =>
                    Number(
                        inventory.available_quantity || 0
                    ) > 0
            );
    };

    const selectMember = (member: Member) => {
        setSelectedMember(member);
        setMemberSearch(
            member.name ||
            member.username ||
            member.its_no ||
            ''
        );
        setShowMemberList(false);
    };

    const selectComponentInventory = (
        component: UniformComponent,
        inventory: InventoryRecord
    ) => {
        const componentId =
            component.component_id;

        const componentName =
            component.name ||
            component.component_name ||
            'Component';

        setSelectedComponents((previous) => ({
            ...previous,
            [componentId]: {
                component_id: componentId,
                component_name: componentName,
                inventory_id:
                    inventory.inventory_id,
                size: inventory.size || '',
                quantity: Math.max(
                    1,
                    Number(component.quantity || 1)
                ),
                assigned: true,
                paid: false,
                condition_given: 'good',
            },
        }));
    };

    const removeComponent = (
        componentId: string
    ) => {
        setSelectedComponents((previous) => {
            const next = { ...previous };
            delete next[componentId];
            return next;
        });
    };

    const updateComponentField = (
        componentId: string,
        field:
            | 'quantity'
            | 'paid'
            | 'condition_given',
        value: any
    ) => {
        setSelectedComponents((previous) => {
            const current =
                previous[componentId];

            if (!current) return previous;

            return {
                ...previous,
                [componentId]: {
                    ...current,
                    [field]: value,
                },
            };
        });
    };

    const selectedCount =
        Object.keys(selectedComponents).length;

    const requiredComponents =
        components.filter(
            (component) =>
                component.required === true ||
                component.mandatory === true
        );

    const missingRequiredComponents =
        requiredComponents.filter(
            (component) =>
                !selectedComponents[
                component.component_id
                ]
        );

    const canSubmit =
        !!selectedMember &&
        selectedCount > 0 &&
        missingRequiredComponents.length === 0 &&
        !submitting;

    const submitAssignment = async () => {
        if (!catalogId) {
            Alert.alert(
                'Error',
                'Uniform catalogue ID is missing.'
            );
            return;
        }

        if (!selectedMember) {
            Alert.alert(
                'Select Member',
                'Please select the member who will receive this uniform.'
            );
            return;
        }

        if (selectedCount === 0) {
            Alert.alert(
                'Select Components',
                'Please select at least one uniform component.'
            );
            return;
        }

        if (missingRequiredComponents.length > 0) {
            Alert.alert(
                'Required Components Missing',
                'Please select all mandatory uniform components before assigning.'
            );
            return;
        }

        try {
            setSubmitting(true);

            const baseUrl =
                process.env.EXPO_PUBLIC_BACKEND_URL;

            if (!baseUrl) {
                throw new Error(
                    'EXPO_PUBLIC_BACKEND_URL is not configured.'
                );
            }

            const payload = {
                user_id: selectedMember.user_id,
                catalog_id: catalogId,
                components: Object.values(
                    selectedComponents
                ).map((component) => ({
                    component_id:
                        component.component_id,
                    inventory_id:
                        component.inventory_id,
                    size: component.size || null,
                    assigned: component.assigned,
                    quantity:
                        Number(component.quantity) || 1,
                    paid: component.paid,
                    condition_given:
                        component.condition_given,
                })),
                assigned_date: assignedDate,
                member_notes:
                    memberNotes.trim() || null,
            };

            const response = await fetch(
                `${baseUrl}/uniforms/assign`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                }
            );

            const responseText =
                await response.text();

            if (!response.ok) {
                throw new Error(
                    responseText ||
                    'Failed to assign uniform.'
                );
            }

            Alert.alert(
                'Uniform Assigned',
                `${uniform?.name || uniformNameFromParams || 'Uniform'} has been successfully assigned to ${selectedMember.name || selectedMember.username || 'the member'}.`,
                [
                    {
                        text: 'Done',
                        onPress: () => {
                            router.back();
                        },
                    },
                ]
            );
        } catch (err: any) {
            console.log(
                'Uniform assignment error:',
                err
            );

            Alert.alert(
                'Assignment Failed',
                err?.message ||
                'Unable to assign uniform.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (!hasUniformPermission) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons
                    name="lock-closed-outline"
                    size={54}
                    color="#6C4DFF"
                />

                <Text style={styles.errorTitle}>
                    Permission Required
                </Text>

                <Text style={styles.errorMessage}>
                    You do not have permission to assign uniforms.
                </Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <View style={styles.loadingIcon}>
                    <Ionicons
                        name="shirt-outline"
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

                <Text style={styles.loadingText}>
                    Loading assignment screen...
                </Text>
            </View>
        );
    }

    if (error || !uniform) {
        return (
            <View style={styles.centerContainer}>
                <View style={styles.errorIcon}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={40}
                        color="#FF4D4F"
                    />
                </View>

                <Text style={styles.errorTitle}>
                    Unable to load assignment
                </Text>

                <Text style={styles.errorMessage}>
                    {error ||
                        'Uniform information could not be loaded.'}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.retryButton}
                    onPress={loadData}
                >
                    <Text style={styles.retryText}>
                        Try Again
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
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
                                numberOfLines={1}
                            >
                                Assign Uniform
                            </Text>

                            <Text
                                style={
                                    styles.headerSubtitle
                                }
                                numberOfLines={1}
                            >
                                Select member and uniform components
                            </Text>
                        </View>

                        <NotificationBell />
                    </View>
                </LinearGradient>

                {/* UNIFORM SUMMARY */}

                <View style={styles.section}>
                    <View style={styles.uniformSummary}>
                        <View style={styles.uniformIcon}>
                            <Ionicons
                                name="shirt-outline"
                                size={27}
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
                                    styles.uniformName
                                }
                                numberOfLines={2}
                            >
                                {uniform.name ||
                                    uniformNameFromParams ||
                                    'Uniform'}
                            </Text>

                            {!!uniform.category && (
                                <Text
                                    style={
                                        styles.categoryText
                                    }
                                >
                                    {uniform.category}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* MEMBER */}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Select Member
                    </Text>

                    <Text style={styles.sectionSubtitle}>
                        Choose the member who will receive this uniform.
                    </Text>

                    <View
                        style={
                            styles.memberSearchContainer
                        }
                    >
                        <Ionicons
                            name="search-outline"
                            size={20}
                            color="#888"
                        />

                        <TextInput
                            value={memberSearch}
                            onChangeText={(text) => {
                                setMemberSearch(text);
                                setSelectedMember(null);
                                setShowMemberList(true);
                            }}
                            onFocus={() =>
                                setShowMemberList(true)
                            }
                            placeholder="Search name, ITS number or username"
                            placeholderTextColor="#999"
                            style={
                                styles.memberSearchInput
                            }
                        />

                        {selectedMember && (
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedMember(
                                        null
                                    );
                                    setMemberSearch('');
                                    setShowMemberList(
                                        true
                                    );
                                }}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={21}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {showMemberList && (
                        <View
                            style={
                                styles.memberList
                            }
                        >
                            {filteredMembers.length ===
                                0 ? (
                                <View
                                    style={
                                        styles.emptyMember
                                    }
                                >
                                    <Ionicons
                                        name="people-outline"
                                        size={30}
                                        color="#AAA"
                                    />

                                    <Text
                                        style={
                                            styles.emptyMemberText
                                        }
                                    >
                                        No members found
                                    </Text>
                                </View>
                            ) : (
                                filteredMembers.map(
                                    (member) => (
                                        <TouchableOpacity
                                            key={
                                                member.user_id
                                            }
                                            activeOpacity={
                                                0.8
                                            }
                                            style={
                                                styles.memberRow
                                            }
                                            onPress={() =>
                                                selectMember(
                                                    member
                                                )
                                            }
                                        >
                                            <View
                                                style={
                                                    styles.memberAvatar
                                                }
                                            >
                                                <Ionicons
                                                    name="person"
                                                    size={19}
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
                                                        styles.memberName
                                                    }
                                                >
                                                    {member.name ||
                                                        member.username ||
                                                        'Unnamed Member'}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.memberMeta
                                                    }
                                                >
                                                    {[
                                                        member.its_no &&
                                                        `ITS: ${member.its_no}`,
                                                        member.username &&
                                                        member.username !==
                                                        member.name &&
                                                        member.username,
                                                    ]
                                                        .filter(
                                                            Boolean
                                                        )
                                                        .join(
                                                            ' • '
                                                        )}
                                                </Text>
                                            </View>

                                            <Ionicons
                                                name="chevron-forward"
                                                size={19}
                                                color="#AAA"
                                            />
                                        </TouchableOpacity>
                                    )
                                )
                            )}
                        </View>
                    )}

                    {selectedMember && (
                        <View
                            style={
                                styles.selectedMemberCard
                            }
                        >
                            <View
                                style={
                                    styles.selectedMemberIcon
                                }
                            >
                                <Ionicons
                                    name="checkmark"
                                    size={21}
                                    color="#22B866"
                                />
                            </View>

                            <View
                                style={{
                                    flex: 1,
                                }}
                            >
                                <Text
                                    style={
                                        styles.selectedMemberTitle
                                    }
                                >
                                    {selectedMember.name ||
                                        selectedMember.username}
                                </Text>

                                <Text
                                    style={
                                        styles.selectedMemberMeta
                                    }
                                >
                                    {selectedMember.its_no
                                        ? `ITS: ${selectedMember.its_no}`
                                        : selectedMember.username ||
                                        'Member selected'}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.selectedBadge
                                }
                            >
                                <Text
                                    style={
                                        styles.selectedBadgeText
                                    }
                                >
                                    SELECTED
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* COMPONENTS */}

                <View style={styles.section}>
                    <View
                        style={
                            styles.sectionHeaderRow
                        }
                    >
                        <View
                            style={{
                                flex: 1,
                            }}
                        >
                            <Text
                                style={
                                    styles.sectionTitle
                                }
                            >
                                Uniform Components
                            </Text>

                            <Text
                                style={
                                    styles.sectionSubtitle
                                }
                            >
                                Select the size and stock item for each component.
                            </Text>
                        </View>

                        <View
                            style={
                                styles.countBadge
                            }
                        >
                            <Text
                                style={
                                    styles.countBadgeText
                                }
                            >
                                {selectedCount}/
                                {components.length}
                            </Text>
                        </View>
                    </View>

                    {components.length === 0 ? (
                        <View
                            style={
                                styles.emptyComponentCard
                            }
                        >
                            <Ionicons
                                name="shirt-outline"
                                size={38}
                                color="#8A75E8"
                            />

                            <Text
                                style={
                                    styles.emptyComponentTitle
                                }
                            >
                                No components available
                            </Text>

                            <Text
                                style={
                                    styles.emptyComponentText
                                }
                            >
                                This uniform has no configured components.
                            </Text>
                        </View>
                    ) : (
                        components.map(
                            (component, index) => {
                                const componentId =
                                    component.component_id;

                                const componentName =
                                    component.name ||
                                    component.component_name ||
                                    `Component ${index + 1}`;

                                const availableInventory =
                                    getAvailableInventory(
                                        component
                                    );

                                const selected =
                                    selectedComponents[
                                    componentId
                                    ];

                                return (
                                    <View
                                        key={
                                            componentId ||
                                            index
                                        }
                                        style={
                                            styles.componentCard
                                        }
                                    >
                                        <View
                                            style={
                                                styles.componentHeader
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
                                                    {componentName}
                                                </Text>

                                                {(
                                                    component.required ||
                                                    component.mandatory
                                                ) && (
                                                        <Text
                                                            style={
                                                                styles.requiredText
                                                            }
                                                        >
                                                            Required
                                                        </Text>
                                                    )}
                                            </View>

                                            {selected && (
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        removeComponent(
                                                            componentId
                                                        )
                                                    }
                                                >
                                                    <Ionicons
                                                        name="close-circle"
                                                        size={23}
                                                        color="#FF4D4F"
                                                    />
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {availableInventory.length ===
                                            0 ? (
                                            <View
                                                style={
                                                    styles.outOfStockBox
                                                }
                                            >
                                                <Ionicons
                                                    name="alert-circle-outline"
                                                    size={19}
                                                    color="#FF4D4F"
                                                />

                                                <Text
                                                    style={
                                                        styles.outOfStockText
                                                    }
                                                >
                                                    No available stock for this component.
                                                </Text>
                                            </View>
                                        ) : (
                                            <>
                                                <Text
                                                    style={
                                                        styles.fieldLabel
                                                    }
                                                >
                                                    Select Size / Stock
                                                </Text>

                                                <View
                                                    style={
                                                        styles.inventoryOptions
                                                    }
                                                >
                                                    {availableInventory.map(
                                                        (
                                                            inventory
                                                        ) => {
                                                            const isSelected =
                                                                selected?.inventory_id ===
                                                                inventory.inventory_id;

                                                            return (
                                                                <TouchableOpacity
                                                                    key={
                                                                        inventory.inventory_id
                                                                    }
                                                                    activeOpacity={
                                                                        0.82
                                                                    }
                                                                    onPress={() =>
                                                                        selectComponentInventory(
                                                                            component,
                                                                            inventory
                                                                        )
                                                                    }
                                                                    style={[
                                                                        styles.inventoryOption,
                                                                        isSelected &&
                                                                        styles.inventoryOptionSelected,
                                                                    ]}
                                                                >
                                                                    <View
                                                                        style={[
                                                                            styles.radio,
                                                                            isSelected &&
                                                                            styles.radioSelected,
                                                                        ]}
                                                                    >
                                                                        {isSelected && (
                                                                            <View
                                                                                style={
                                                                                    styles.radioInner
                                                                                }
                                                                            />
                                                                        )}
                                                                    </View>

                                                                    <View
                                                                        style={{
                                                                            flex: 1,
                                                                        }}
                                                                    >
                                                                        <Text
                                                                            style={
                                                                                styles.inventorySize
                                                                            }
                                                                        >
                                                                            {inventory.size ||
                                                                                'Standard Size'}
                                                                        </Text>

                                                                        <Text
                                                                            style={
                                                                                styles.inventoryAvailable
                                                                            }
                                                                        >
                                                                            {
                                                                                inventory.available_quantity
                                                                            }{' '}
                                                                            available
                                                                        </Text>
                                                                    </View>
                                                                </TouchableOpacity>
                                                            );
                                                        }
                                                    )}
                                                </View>

                                                {selected && (
                                                    <View
                                                        style={
                                                            styles.selectedComponentBox
                                                        }
                                                    >
                                                        <View
                                                            style={
                                                                styles.selectedComponentHeader
                                                            }
                                                        >
                                                            <View>
                                                                <Text
                                                                    style={
                                                                        styles.selectedComponentTitle
                                                                    }
                                                                >
                                                                    Selected
                                                                </Text>

                                                                <Text
                                                                    style={
                                                                        styles.selectedComponentSize
                                                                    }
                                                                >
                                                                    {selected.size ||
                                                                        'Standard Size'}
                                                                </Text>
                                                            </View>

                                                            <Ionicons
                                                                name="checkmark-circle"
                                                                size={23}
                                                                color="#22B866"
                                                            />
                                                        </View>

                                                        <Text
                                                            style={
                                                                styles.fieldLabel
                                                            }
                                                        >
                                                            Quantity
                                                        </Text>

                                                        <View
                                                            style={
                                                                styles.quantityRow
                                                            }
                                                        >
                                                            <TouchableOpacity
                                                                style={
                                                                    styles.quantityButton
                                                                }
                                                                onPress={() =>
                                                                    updateComponentField(
                                                                        componentId,
                                                                        'quantity',
                                                                        Math.max(
                                                                            1,
                                                                            selected.quantity -
                                                                            1
                                                                        )
                                                                    )
                                                                }
                                                            >
                                                                <Ionicons
                                                                    name="remove"
                                                                    size={20}
                                                                    color="#6C4DFF"
                                                                />
                                                            </TouchableOpacity>

                                                            <Text
                                                                style={
                                                                    styles.quantityValue
                                                                }
                                                            >
                                                                {
                                                                    selected.quantity
                                                                }
                                                            </Text>

                                                            <TouchableOpacity
                                                                style={
                                                                    styles.quantityButton
                                                                }
                                                                onPress={() =>
                                                                    updateComponentField(
                                                                        componentId,
                                                                        'quantity',
                                                                        Math.min(
                                                                            Number(
                                                                                inventoryMaxAvailable(
                                                                                    component,
                                                                                    selected.inventory_id
                                                                                )
                                                                            ) ||
                                                                            1,
                                                                            selected.quantity +
                                                                            1
                                                                        )
                                                                    )
                                                                }
                                                            >
                                                                <Ionicons
                                                                    name="add"
                                                                    size={20}
                                                                    color="#6C4DFF"
                                                                />
                                                            </TouchableOpacity>
                                                        </View>

                                                        <Text
                                                            style={
                                                                styles.fieldLabel
                                                            }
                                                        >
                                                            Condition
                                                        </Text>

                                                        <View
                                                            style={
                                                                styles.conditionRow
                                                            }
                                                        >
                                                            {[
                                                                'excellent',
                                                                'good',
                                                                'fair',
                                                            ].map(
                                                                (
                                                                    condition
                                                                ) => (
                                                                    <TouchableOpacity
                                                                        key={
                                                                            condition
                                                                        }
                                                                        activeOpacity={
                                                                            0.8
                                                                        }
                                                                        onPress={() =>
                                                                            updateComponentField(
                                                                                componentId,
                                                                                'condition_given',
                                                                                condition
                                                                            )
                                                                        }
                                                                        style={[
                                                                            styles.conditionChip,
                                                                            selected.condition_given ===
                                                                            condition &&
                                                                            styles.conditionChipSelected,
                                                                        ]}
                                                                    >
                                                                        <Text
                                                                            style={[
                                                                                styles.conditionChipText,
                                                                                selected.condition_given ===
                                                                                condition &&
                                                                                styles.conditionChipTextSelected,
                                                                            ]}
                                                                        >
                                                                            {condition
                                                                                .charAt(
                                                                                    0
                                                                                )
                                                                                .toUpperCase() +
                                                                                condition.slice(
                                                                                    1
                                                                                )}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                )
                                                            )}
                                                        </View>

                                                        <TouchableOpacity
                                                            activeOpacity={
                                                                0.8
                                                            }
                                                            style={
                                                                styles.paidRow
                                                            }
                                                            onPress={() =>
                                                                updateComponentField(
                                                                    componentId,
                                                                    'paid',
                                                                    !selected.paid
                                                                )
                                                            }
                                                        >
                                                            <View
                                                                style={[
                                                                    styles.checkbox,
                                                                    selected.paid &&
                                                                    styles.checkboxSelected,
                                                                ]}
                                                            >
                                                                {selected.paid && (
                                                                    <Ionicons
                                                                        name="checkmark"
                                                                        size={14}
                                                                        color="#fff"
                                                                    />
                                                                )}
                                                            </View>

                                                            <Text
                                                                style={
                                                                    styles.paidText
                                                                }
                                                            >
                                                                Payment received for this component
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </>
                                        )}
                                    </View>
                                );
                            }
                        )
                    )}
                </View>

                {/* DATE + NOTES */}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Assignment Details
                    </Text>

                    <Text
                        style={
                            styles.fieldLabel
                        }
                    >
                        Assigned Date
                    </Text>

                    <View
                        style={
                            styles.inputContainer
                        }
                    >
                        <Ionicons
                            name="calendar-outline"
                            size={20}
                            color="#6C4DFF"
                        />

                        <TextInput
                            value={assignedDate}
                            onChangeText={
                                setAssignedDate
                            }
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#999"
                            style={
                                styles.textInput
                            }
                        />
                    </View>

                    <Text
                        style={[
                            styles.fieldLabel,
                            {
                                marginTop: 16,
                            },
                        ]}
                    >
                        Member Notes
                    </Text>

                    <View
                        style={
                            styles.notesContainer
                        }
                    >
                        <TextInput
                            value={memberNotes}
                            onChangeText={
                                setMemberNotes
                            }
                            placeholder="Optional notes about this uniform assignment..."
                            placeholderTextColor="#999"
                            multiline
                            textAlignVertical="top"
                            style={
                                styles.notesInput
                            }
                        />
                    </View>
                </View>

                {/* SUBMIT */}

                <View style={styles.submitSection}>
                    {missingRequiredComponents.length >
                        0 && (
                            <View
                                style={
                                    styles.warningBox
                                }
                            >
                                <Ionicons
                                    name="warning-outline"
                                    size={19}
                                    color="#F59E0B"
                                />

                                <Text
                                    style={
                                        styles.warningText
                                    }
                                >
                                    {
                                        missingRequiredComponents.length
                                    }{' '}
                                    required component
                                    {missingRequiredComponents.length >
                                        1
                                        ? 's are'
                                        : ' is'}{' '}
                                    still not selected.
                                </Text>
                            </View>
                        )}

                    {!selectedMember && (
                        <View
                            style={
                                styles.infoBox
                            }
                        >
                            <Ionicons
                                name="information-circle-outline"
                                size={19}
                                color="#6C4DFF"
                            />

                            <Text
                                style={
                                    styles.infoText
                                }
                            >
                                Select a member and at least one component to continue.
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        activeOpacity={
                            canSubmit ? 0.86 : 1
                        }
                        disabled={!canSubmit}
                        onPress={
                            submitAssignment
                        }
                        style={[
                            styles.submitButton,
                            !canSubmit &&
                            styles.submitButtonDisabled,
                        ]}
                    >
                        {submitting ? (
                            <ActivityIndicator
                                size="small"
                                color="#fff"
                            />
                        ) : (
                            <>
                                <Ionicons
                                    name="checkmark-circle-outline"
                                    size={23}
                                    color="#fff"
                                />

                                <Text
                                    style={
                                        styles.submitButtonText
                                    }
                                >
                                    Assign Uniform
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
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

function inventoryMaxAvailable(
    component: UniformComponent,
    inventoryId: string
) {
    const inventory =
        (component.inventory || []).find(
            (item) =>
                item.inventory_id ===
                inventoryId
        );

    return Number(
        inventory?.available_quantity || 1
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
        fontSize: 13,
        marginTop: 3,
    },

    section: {
        marginHorizontal: 20,
        marginTop: 22,
    },

    uniformSummary: {
        backgroundColor: '#fff',
        borderRadius: 21,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },

    uniformIcon: {
        width: 52,
        height: 52,
        borderRadius: 17,
        backgroundColor: '#F0EDFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 13,
    },

    uniformName: {
        color: '#16162E',
        fontSize: 18,
        fontWeight: '800',
    },

    categoryText: {
        color: '#6C4DFF',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 3,
    },

    sectionTitle: {
        color: '#16162E',
        fontSize: 20,
        fontWeight: '800',
    },

    sectionSubtitle: {
        color: '#777',
        fontSize: 12,
        marginTop: 4,
        lineHeight: 17,
    },

    memberSearchContainer: {
        marginTop: 12,
        backgroundColor: '#fff',
        borderRadius: 17,
        paddingHorizontal: 14,
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },

    memberSearchInput: {
        flex: 1,
        marginLeft: 9,
        color: '#222',
        fontSize: 14,
        paddingVertical: 13,
    },

    memberList: {
        backgroundColor: '#fff',
        borderRadius: 17,
        marginTop: 8,
        overflow: 'hidden',
        elevation: 2,
    },

    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 13,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0EEF5',
    },

    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: '#F0EDFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 11,
    },

    memberName: {
        color: '#16162E',
        fontSize: 14,
        fontWeight: '700',
    },

    memberMeta: {
        color: '#888',
        fontSize: 10.5,
        marginTop: 3,
    },

    emptyMember: {
        padding: 25,
        alignItems: 'center',
    },

    emptyMemberText: {
        color: '#888',
        fontSize: 13,
        marginTop: 8,
    },

    selectedMemberCard: {
        marginTop: 10,
        backgroundColor: '#E9FFF2',
        borderRadius: 17,
        padding: 13,
        flexDirection: 'row',
        alignItems: 'center',
    },

    selectedMemberIcon: {
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },

    selectedMemberTitle: {
        color: '#145A35',
        fontSize: 14,
        fontWeight: '800',
    },

    selectedMemberMeta: {
        color: '#4B8065',
        fontSize: 10.5,
        marginTop: 3,
    },

    selectedBadge: {
        backgroundColor: '#CFF5DD',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 9,
    },

    selectedBadgeText: {
        color: '#1C7A49',
        fontSize: 8.5,
        fontWeight: '800',
    },

    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    countBadge: {
        backgroundColor: '#EEE9FF',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 11,
        marginLeft: 10,
    },

    countBadgeText: {
        color: '#6C4DFF',
        fontSize: 11,
        fontWeight: '800',
    },

    componentCard: {
        backgroundColor: '#fff',
        borderRadius: 21,
        padding: 15,
        marginTop: 12,
        elevation: 2,
    },

    componentHeader: {
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

    fieldLabel: {
        color: '#555',
        fontSize: 11.5,
        fontWeight: '700',
        marginTop: 15,
        marginBottom: 7,
    },

    inventoryOptions: {
        gap: 8,
    },

    inventoryOption: {
        borderWidth: 1.5,
        borderColor: '#E5E2EC',
        borderRadius: 14,
        padding: 11,
        flexDirection: 'row',
        alignItems: 'center',
    },

    inventoryOptionSelected: {
        borderColor: '#6C4DFF',
        backgroundColor: '#F6F2FF',
    },

    radio: {
        width: 21,
        height: 21,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#B7B3C2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },

    radioSelected: {
        borderColor: '#6C4DFF',
    },

    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#6C4DFF',
    },

    inventorySize: {
        color: '#222',
        fontSize: 13,
        fontWeight: '800',
    },

    inventoryAvailable: {
        color: '#22B866',
        fontSize: 10.5,
        marginTop: 2,
        fontWeight: '600',
    },

    selectedComponentBox: {
        marginTop: 12,
        backgroundColor: '#F8F7FC',
        borderRadius: 15,
        padding: 12,
    },

    selectedComponentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    selectedComponentTitle: {
        color: '#777',
        fontSize: 10.5,
        fontWeight: '700',
    },

    selectedComponentSize: {
        color: '#6C4DFF',
        fontSize: 14,
        fontWeight: '800',
        marginTop: 2,
    },

    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },

    quantityButton: {
        width: 39,
        height: 39,
        borderRadius: 12,
        backgroundColor: '#EEE9FF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    quantityValue: {
        color: '#16162E',
        fontSize: 18,
        fontWeight: '800',
        minWidth: 45,
        textAlign: 'center',
    },

    conditionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
    },

    conditionChip: {
        borderWidth: 1,
        borderColor: '#DDD9E7',
        borderRadius: 10,
        paddingHorizontal: 11,
        paddingVertical: 8,
        backgroundColor: '#fff',
    },

    conditionChipSelected: {
        borderColor: '#6C4DFF',
        backgroundColor: '#EEE9FF',
    },

    conditionChipText: {
        color: '#777',
        fontSize: 11,
        fontWeight: '600',
    },

    conditionChipTextSelected: {
        color: '#6C4DFF',
        fontWeight: '800',
    },

    paidRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
    },

    checkbox: {
        width: 21,
        height: 21,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#B7B3C2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 9,
    },

    checkboxSelected: {
        backgroundColor: '#6C4DFF',
        borderColor: '#6C4DFF',
    },

    paidText: {
        color: '#555',
        fontSize: 11.5,
        flex: 1,
    },

    outOfStockBox: {
        marginTop: 13,
        backgroundColor: '#FFEAEA',
        borderRadius: 13,
        padding: 11,
        flexDirection: 'row',
        alignItems: 'center',
    },

    outOfStockText: {
        flex: 1,
        color: '#D83A3A',
        fontSize: 11.5,
        marginLeft: 8,
        fontWeight: '600',
    },

    emptyComponentCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        marginTop: 12,
        alignItems: 'center',
    },

    emptyComponentTitle: {
        color: '#16162E',
        fontSize: 16,
        fontWeight: '800',
        marginTop: 10,
    },

    emptyComponentText: {
        color: '#777',
        fontSize: 12,
        marginTop: 5,
        textAlign: 'center',
    },

    inputContainer: {
        marginTop: 8,
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 13,
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 1,
    },

    textInput: {
        flex: 1,
        marginLeft: 9,
        color: '#222',
        fontSize: 14,
        paddingVertical: 12,
    },

    notesContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        minHeight: 110,
        elevation: 1,
    },

    notesInput: {
        flex: 1,
        minHeight: 110,
        color: '#222',
        fontSize: 13,
        padding: 13,
    },

    submitSection: {
        marginHorizontal: 20,
        marginTop: 25,
    },

    warningBox: {
        backgroundColor: '#FFF4E2',
        borderRadius: 14,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 9,
    },

    warningText: {
        flex: 1,
        color: '#9A6400',
        fontSize: 11.5,
        marginLeft: 8,
        lineHeight: 17,
    },

    infoBox: {
        backgroundColor: '#F0EDFF',
        borderRadius: 14,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 9,
    },

    infoText: {
        flex: 1,
        color: '#5C4AB4',
        fontSize: 11.5,
        marginLeft: 8,
        lineHeight: 17,
    },

    submitButton: {
        minHeight: 55,
        borderRadius: 17,
        backgroundColor: '#6C4DFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
    },

    submitButtonDisabled: {
        backgroundColor: '#BDB7D6',
    },

    submitButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
        marginLeft: 8,
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
        marginTop: 10,
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