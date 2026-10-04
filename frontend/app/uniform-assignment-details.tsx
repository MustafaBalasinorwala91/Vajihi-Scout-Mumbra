import React, {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
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

const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');
const API_BASE = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;

type Member = {
    user_id?: string;
    name?: string;
    its_no?: string;
    picture?: string;
    instrument?: string;
};

type Catalog = {
    catalog_id?: string;
    name?: string;
    category?: string;
    description?: string;
    images?: string[];
    is_mandatory?: boolean;
};

type Inventory = {
    inventory_id?: string;
    size?: string;
    available_quantity?: number;
    assigned_quantity?: number;
    repair_quantity?: number;
    damaged_quantity?: number;
    purchase_price?: number;
    minimum_stock?: number;
};

type AssignmentComponent = {
    component_id: string;
    inventory_id?: string;
    component_name?: string;
    size?: string;
    assigned?: boolean;
    quantity?: number;
    paid?: boolean;
    condition_given?: string;
    condition_returned?: string;
    status?: string;
    inventory?: Inventory | null;
};

type UniformAssignment = {
    assignment_id: string;
    user_id?: string;
    catalog_id?: string;
    uniform_name?: string;
    assignment_status?: string;
    payment_status?: string;
    member_notes?: string;
    assigned_date?: string;
    return_date?: string;
    assigned_by?: string;
    remarks?: string;
    member?: Member | null;
    catalog?: Catalog | null;
    components?: AssignmentComponent[];
};

export default function UniformAssignmentDetailsScreen() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        assignment_id?: string | string[];
    }>();

    const { user, hasPermission } = useAuth();

    const isAdmin = user?.role === 'admin';

    const assignmentId = Array.isArray(
        params.assignment_id
    )
        ? params.assignment_id[0]
        : params.assignment_id;

    const hasUniformPermission =
        isAdmin || hasPermission('uniforms');
    const [assignment, setAssignment] =
        useState<UniformAssignment | null>(
            null
        );

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState('');

    const [returning, setReturning] =
        useState(false);

    const getAuthHeaders = async (includeJson = false) => {
        const token = await AsyncStorage.getItem('session_token');

        if (!token) {
            throw new Error('Session expired. Please login again.');
        }

        const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
        };

        if (includeJson) {
            headers['Content-Type'] = 'application/json';
        }

        return headers;
    };

    const loadAssignment = useCallback(
        async () => {
            if (!assignmentId) {
                setError(
                    'Assignment ID is missing.'
                );
                setLoading(false);
                return;
            }

            try {
                setError('');

                if (!BACKEND_URL) {
                    throw new Error(
                        'EXPO_PUBLIC_BACKEND_URL is not configured.'
                    );
                }

                const response =
                    await fetch(
                        `${API_BASE}/uniforms/assignment/${assignmentId}`,
                        {
                            method: 'GET',
                            headers: await getAuthHeaders(),
                            credentials: 'include',
                        }
                    );

                if (!response.ok) {
                    const message =
                        await response.text();

                    throw new Error(
                        message ||
                        'Failed to load assignment details.'
                    );
                }

                const data =
                    await response.json();

                setAssignment(data);
            } catch (err: any) {
                console.log(
                    'Uniform assignment details error:',
                    err
                );

                setError(
                    err?.message ||
                    'Unable to load assignment details.'
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [assignmentId]
    );

    useEffect(() => {
        loadAssignment();
    }, [loadAssignment]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAssignment();
    };

    const components =
        assignment?.components || [];

    const activeComponents =
        components.filter(
            (component) =>
                component.status ===
                'assigned' ||
                component.status === 'repair'
        );

    const returnedComponents =
        components.filter(
            (component) =>
                component.status ===
                'returned' ||
                component.status === 'lost' ||
                component.status === 'damaged'
        );

    const getAssignmentStatus = () => {
        const status =
            String(
                assignment?.assignment_status ||
                ''
            ).toLowerCase();

        if (status === 'returned') {
            return {
                label: 'RETURNED',
                background: '#F0F0F0',
                color: '#777',
            };
        }

        if (status === 'partial') {
            return {
                label: 'PARTIAL',
                background: '#FFF4E2',
                color: '#C27A00',
            };
        }

        if (status === 'pending') {
            return {
                label: 'PENDING',
                background: '#FFF4E2',
                color: '#C27A00',
            };
        }

        return {
            label: status
                ? status
                    .replace(
                        /_/g,
                        ' '
                    )
                    .toUpperCase()
                : 'ACTIVE',
            background: '#E8FFF0',
            color: '#22B866',
        };
    };

    const status =
        getAssignmentStatus();

    const getComponentStatus = (
        component: AssignmentComponent
    ) => {
        const value =
            String(
                component.status ||
                'pending'
            ).toLowerCase();

        if (value === 'returned') {
            return {
                label: 'RETURNED',
                background: '#F0F0F0',
                color: '#777',
            };
        }

        if (value === 'repair') {
            return {
                label: 'REPAIR',
                background: '#FFF4E2',
                color: '#C27A00',
            };
        }

        if (value === 'lost') {
            return {
                label: 'LOST',
                background: '#FFEAEA',
                color: '#FF4D4F',
            };
        }

        if (value === 'damaged') {
            return {
                label: 'DAMAGED',
                background: '#FFEAEA',
                color: '#FF4D4F',
            };
        }

        if (value === 'assigned') {
            return {
                label: 'ASSIGNED',
                background: '#E8FFF0',
                color: '#22B866',
            };
        }

        return {
            label: 'PENDING',
            background: '#FFF4E2',
            color: '#C27A00',
        };
    };

    const returnUniform = () => {
        if (!assignment) return;

        if (activeComponents.length === 0) {
            Alert.alert(
                'Nothing to Return',
                'There are no active uniform components to return.'
            );
            return;
        }

        Alert.alert(
            'Return Uniform',
            'Do you want to return all currently active components?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Continue',
                    onPress: processReturn,
                },
            ]
        );
    };

    const processReturn = async () => {
        if (!assignment) return;

        try {
            setReturning(true);

            const baseUrl = BACKEND_URL;

            if (!baseUrl) {
                throw new Error(
                    'EXPO_PUBLIC_BACKEND_URL is not configured.'
                );
            }

            const today =
                new Date()
                    .toISOString()
                    .split('T')[0];

            const payload = {
                components:
                    activeComponents.map(
                        (component) => ({
                            component_id:
                                component.component_id,
                            condition_returned:
                                'good',
                        })
                    ),
                return_date: today,
                remarks:
                    'Uniform returned from assignment details.',
            };

            const response =
                await fetch(
                    `${API_BASE}/uniforms/return/${assignment.assignment_id}`,
                    {
                        method: 'PUT',
                        headers: await getAuthHeaders(true),
                        credentials: 'include',
                        body: JSON.stringify(
                            payload
                        ),
                    }
                );

            const responseText =
                await response.text();

            let responseMessage = responseText;
            try {
                const parsed = responseText
                    ? JSON.parse(responseText)
                    : null;
                responseMessage =
                    parsed?.detail ||
                    parsed?.message ||
                    responseText;
            } catch {
                // Keep the raw response when it is not JSON.
            }

            if (!response.ok) {
                throw new Error(
                    responseMessage ||
                    'Failed to return uniform.'
                );
            }

            Alert.alert(
                'Uniform Returned',
                'The selected uniform components have been returned successfully.',
                [
                    {
                        text: 'Done',
                        onPress:
                            loadAssignment,
                    },
                ]
            );
        } catch (err: any) {
            console.log(
                'Uniform return error:',
                err
            );

            Alert.alert(
                'Return Failed',
                err?.message ||
                'Unable to return uniform.'
            );
        } finally {
            setReturning(false);
        }
    };

    if (loading) {
        return (
            <View
                style={
                    styles.centerContainer
                }
            >
                <View
                    style={
                        styles.loadingIcon
                    }
                >
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

                <Text
                    style={
                        styles.loadingText
                    }
                >
                    Loading assignment...
                </Text>
            </View>
        );
    }

    if (error || !assignment) {
        return (
            <View
                style={
                    styles.centerContainer
                }
            >
                <View
                    style={styles.errorIcon}
                >
                    <Ionicons
                        name="alert-circle-outline"
                        size={40}
                        color="#FF4D4F"
                    />
                </View>

                <Text
                    style={styles.errorTitle}
                >
                    Unable to load assignment
                </Text>

                <Text
                    style={
                        styles.errorMessage
                    }
                >
                    {error ||
                        'Assignment could not be found.'}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={
                        styles.retryButton
                    }
                    onPress={
                        loadAssignment
                    }
                >
                    <Text
                        style={
                            styles.retryText
                        }
                    >
                        Try Again
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={
                        styles.backButton
                    }
                    onPress={() =>
                        router.back()
                    }
                >
                    <Text
                        style={
                            styles.backButtonText
                        }
                    >
                        Go Back
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    const member =
        assignment.member;

    const catalog =
        assignment.catalog;

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={
                    false
                }
                refreshControl={
                    <RefreshControl
                        refreshing={
                            refreshing
                        }
                        onRefresh={
                            onRefresh
                        }
                        colors={[
                            '#5B3DF5',
                        ]}
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
                    <View
                        style={
                            styles.headerTop
                        }
                    >
                        <TouchableOpacity
                            activeOpacity={
                                0.7
                            }
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
                                numberOfLines={
                                    1
                                }
                            >
                                Assignment Details
                            </Text>

                            <Text
                                style={
                                    styles.headerSubtitle
                                }
                                numberOfLines={
                                    1
                                }
                            >
                                View uniform issue and return status
                            </Text>
                        </View>

                        <NotificationBell />
                    </View>
                </LinearGradient>

                {/* MEMBER */}

                <View
                    style={styles.section}
                >
                    <View
                        style={
                            styles.memberCard
                        }
                    >
                        <View
                            style={
                                styles.memberAvatar
                            }
                        >
                            <Ionicons
                                name="person"
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
                                    styles.memberName
                                }
                            >
                                {member?.name ||
                                    'Unknown Member'}
                            </Text>

                            <Text
                                style={
                                    styles.memberMeta
                                }
                            >
                                {member?.its_no
                                    ? `ITS: ${member.its_no}`
                                    : 'ITS number unavailable'}
                            </Text>

                            {!!member?.instrument && (
                                <Text
                                    style={
                                        styles.memberInstrument
                                    }
                                >
                                    {member.instrument}
                                </Text>
                            )}
                        </View>

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
                                        color:
                                            status.color,
                                    },
                                ]}
                            >
                                {status.label}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* UNIFORM */}

                <View
                    style={styles.section}
                >
                    <View
                        style={
                            styles.uniformCard
                        }
                    >
                        <View
                            style={
                                styles.uniformIcon
                            }
                        >
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
                                style={
                                    styles.uniformName
                                }
                            >
                                {assignment.uniform_name ||
                                    catalog?.name ||
                                    'Uniform'}
                            </Text>

                            {!!catalog?.category && (
                                <Text
                                    style={
                                        styles.uniformCategory
                                    }
                                >
                                    {
                                        catalog.category
                                    }
                                </Text>
                            )}

                            <Text
                                style={
                                    styles.assignmentDate
                                }
                            >
                                Assigned:{' '}
                                {assignment.assigned_date ||
                                    'Date unavailable'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* SUMMARY */}

                <View
                    style={styles.section}
                >
                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Assignment Summary
                    </Text>

                    <View
                        style={
                            styles.summaryGrid
                        }
                    >
                        <View
                            style={[
                                styles.summaryBox,
                                {
                                    backgroundColor:
                                        '#EAF3FF',
                                },
                            ]}
                        >
                            <Ionicons
                                name="shirt-outline"
                                size={21}
                                color="#2878D8"
                            />

                            <Text
                                style={[
                                    styles.summaryValue,
                                    {
                                        color:
                                            '#2878D8',
                                    },
                                ]}
                            >
                                {
                                    components.length
                                }
                            </Text>

                            <Text
                                style={
                                    styles.summaryLabel
                                }
                            >
                                Components
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.summaryBox,
                                {
                                    backgroundColor:
                                        '#E9FFF2',
                                },
                            ]}
                        >
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={21}
                                color="#22B866"
                            />

                            <Text
                                style={[
                                    styles.summaryValue,
                                    {
                                        color:
                                            '#22B866',
                                    },
                                ]}
                            >
                                {
                                    activeComponents.length
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
                            style={[
                                styles.summaryBox,
                                {
                                    backgroundColor:
                                        '#F0F0F0',
                                },
                            ]}
                        >
                            <Ionicons
                                name="return-down-back-outline"
                                size={21}
                                color="#777"
                            />

                            <Text
                                style={[
                                    styles.summaryValue,
                                    {
                                        color:
                                            '#777',
                                    },
                                ]}
                            >
                                {
                                    returnedComponents.length
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
                            style={[
                                styles.summaryBox,
                                {
                                    backgroundColor:
                                        assignment.payment_status ===
                                            'paid'
                                            ? '#E9FFF2'
                                            : '#FFF4E2',
                                },
                            ]}
                        >
                            <Ionicons
                                name={
                                    assignment.payment_status ===
                                        'paid'
                                        ? 'checkmark-circle-outline'
                                        : 'card-outline'
                                }
                                size={21}
                                color={
                                    assignment.payment_status ===
                                        'paid'
                                        ? '#22B866'
                                        : '#F59E0B'
                                }
                            />

                            <Text
                                style={[
                                    styles.summaryValue,
                                    {
                                        color:
                                            assignment.payment_status ===
                                                'paid'
                                                ? '#22B866'
                                                : '#F59E0B',
                                    },
                                ]}
                            >
                                {assignment.payment_status ||
                                    'unpaid'}
                            </Text>

                            <Text
                                style={
                                    styles.summaryLabel
                                }
                            >
                                Payment
                            </Text>
                        </View>
                    </View>
                </View>

                {/* COMPONENTS */}

                <View
                    style={styles.section}
                >
                    <View
                        style={
                            styles.sectionHeaderRow
                        }
                    >
                        <View>
                            <Text
                                style={
                                    styles.sectionTitle
                                }
                            >
                                Components
                            </Text>

                            <Text
                                style={
                                    styles.sectionSubtitle
                                }
                            >
                                Current status of every uniform component
                            </Text>
                        </View>
                    </View>

                    {components.map(
                        (
                            component,
                            index
                        ) => {
                            const componentStatus =
                                getComponentStatus(
                                    component
                                );

                            return (
                                <View
                                    key={
                                        component.component_id ||
                                        index
                                    }
                                    style={
                                        styles.componentCard
                                    }
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
                                                size={22}
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
                                                {component.component_name ||
                                                    `Component ${index + 1}`}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.componentMeta
                                                }
                                            >
                                                Size:{' '}
                                                {component.size ||
                                                    'Standard'}
                                                {' • '}
                                                Qty:{' '}
                                                {component.quantity ||
                                                    1}
                                            </Text>
                                        </View>

                                        <View
                                            style={[
                                                styles.componentStatus,
                                                {
                                                    backgroundColor:
                                                        componentStatus.background,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.componentStatusText,
                                                    {
                                                        color:
                                                            componentStatus.color,
                                                    },
                                                ]}
                                            >
                                                {
                                                    componentStatus.label
                                                }
                                            </Text>
                                        </View>
                                    </View>

                                    <View
                                        style={
                                            styles.componentInfoRow
                                        }
                                    >
                                        <View
                                            style={
                                                styles.componentInfoItem
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.componentInfoLabel
                                                }
                                            >
                                                Given
                                            </Text>

                                            <Text
                                                style={
                                                    styles.componentInfoValue
                                                }
                                            >
                                                {component.condition_given ||
                                                    'new'}
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.componentInfoItem
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.componentInfoLabel
                                                }
                                            >
                                                Payment
                                            </Text>

                                            <Text
                                                style={[
                                                    styles.componentInfoValue,
                                                    {
                                                        color:
                                                            component.paid
                                                                ? '#22B866'
                                                                : '#F59E0B',
                                                    },
                                                ]}
                                            >
                                                {component.paid
                                                    ? 'Paid'
                                                    : 'Unpaid'}
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.componentInfoItem
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.componentInfoLabel
                                                }
                                            >
                                                Returned
                                            </Text>

                                            <Text
                                                style={
                                                    styles.componentInfoValue
                                                }
                                            >
                                                {component.condition_returned ||
                                                    '—'}
                                            </Text>
                                        </View>
                                    </View>

                                    {!!component.inventory && (
                                        <View
                                            style={
                                                styles.inventoryBox
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.inventoryTitle
                                                }
                                            >
                                                Inventory Status
                                            </Text>

                                            <View
                                                style={
                                                    styles.inventoryRow
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.inventoryText
                                                    }
                                                >
                                                    Available:{' '}
                                                    {
                                                        component
                                                            .inventory
                                                            .available_quantity
                                                    }
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.inventoryText
                                                    }
                                                >
                                                    Assigned:{' '}
                                                    {
                                                        component
                                                            .inventory
                                                            .assigned_quantity
                                                    }
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        }
                    )}
                </View>

                {/* NOTES */}

                {(!!assignment.member_notes ||
                    !!assignment.remarks) && (
                        <View
                            style={styles.section}
                        >
                            <Text
                                style={
                                    styles.sectionTitle
                                }
                            >
                                Notes
                            </Text>

                            <View
                                style={
                                    styles.notesCard
                                }
                            >
                                {!!assignment.member_notes && (
                                    <View>
                                        <Text
                                            style={
                                                styles.notesLabel
                                            }
                                        >
                                            Member Notes
                                        </Text>

                                        <Text
                                            style={
                                                styles.notesText
                                            }
                                        >
                                            {
                                                assignment.member_notes
                                            }
                                        </Text>
                                    </View>
                                )}

                                {!!assignment.remarks && (
                                    <View
                                        style={{
                                            marginTop:
                                                assignment.member_notes
                                                    ? 14
                                                    : 0,
                                        }}
                                    >
                                        <Text
                                            style={
                                                styles.notesLabel
                                            }
                                        >
                                            Remarks
                                        </Text>

                                        <Text
                                            style={
                                                styles.notesText
                                            }
                                        >
                                            {
                                                assignment.remarks
                                            }
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                {/* RETURN */}

                {activeComponents.length >
                    0 && (
                        <View
                            style={styles.section}
                        >
                            <Text
                                style={
                                    styles.sectionTitle
                                }
                            >
                                Actions
                            </Text>

                            <TouchableOpacity
                                activeOpacity={
                                    0.86
                                }
                                style={
                                    styles.returnButton
                                }
                                onPress={
                                    returnUniform
                                }
                                disabled={
                                    returning
                                }
                            >
                                {returning ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff"
                                    />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="return-down-back-outline"
                                            size={23}
                                            color="#fff"
                                        />

                                        <View
                                            style={{
                                                flex: 1,
                                                marginLeft: 11,
                                            }}
                                        >
                                            <Text
                                                style={
                                                    styles.returnTitle
                                                }
                                            >
                                                Return Active Components
                                            </Text>

                                            <Text
                                                style={
                                                    styles.returnSubtitle
                                                }
                                            >
                                                Return all currently assigned components
                                            </Text>
                                        </View>

                                        <Ionicons
                                            name="chevron-forward"
                                            size={22}
                                            color="#fff"
                                        />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                <View
                    style={
                        styles.bottomSpace
                    }
                />
            </ScrollView>
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
        fontSize: 12.5,
        marginTop: 3,
    },

    section: {
        marginHorizontal: 20,
        marginTop: 22,
    },

    memberCard: {
        backgroundColor: '#fff',
        borderRadius: 21,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },

    memberAvatar: {
        width: 54,
        height: 54,
        borderRadius: 17,
        backgroundColor: '#F0EDFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    memberName: {
        color: '#16162E',
        fontSize: 17,
        fontWeight: '800',
    },

    memberMeta: {
        color: '#777',
        fontSize: 11,
        marginTop: 3,
    },

    memberInstrument: {
        color: '#6C4DFF',
        fontSize: 10.5,
        marginTop: 3,
        fontWeight: '700',
    },

    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 10,
        marginLeft: 8,
    },

    statusText: {
        fontSize: 8.5,
        fontWeight: '800',
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

    uniformCategory: {
        color: '#6C4DFF',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 3,
    },

    assignmentDate: {
        color: '#777',
        fontSize: 10.5,
        marginTop: 4,
    },

    sectionTitle: {
        color: '#16162E',
        fontSize: 20,
        fontWeight: '800',
    },

    sectionSubtitle: {
        color: '#777',
        fontSize: 12,
        marginTop: 3,
    },

    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 9,
        marginTop: 12,
    },

    summaryBox: {
        width: '48.5%',
        minHeight: 108,
        borderRadius: 19,
        padding: 13,
    },

    summaryValue: {
        fontSize: 21,
        fontWeight: '800',
        marginTop: 7,
    },

    summaryLabel: {
        color: '#696979',
        fontSize: 10.5,
        fontWeight: '600',
        marginTop: 1,
        textTransform: 'capitalize',
    },

    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    componentCard: {
        backgroundColor: '#fff',
        borderRadius: 21,
        padding: 15,
        marginTop: 11,
        elevation: 2,
    },

    componentTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    componentIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F0EDFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 11,
    },

    componentName: {
        color: '#16162E',
        fontSize: 15,
        fontWeight: '800',
    },

    componentMeta: {
        color: '#777',
        fontSize: 10.5,
        marginTop: 4,
    },

    componentStatus: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 9,
        marginLeft: 7,
    },

    componentStatusText: {
        fontSize: 8,
        fontWeight: '800',
    },

    componentInfoRow: {
        marginTop: 13,
        paddingTop: 11,
        borderTopWidth: 1,
        borderTopColor: '#F0EEF5',
        flexDirection: 'row',
    },

    componentInfoItem: {
        flex: 1,
    },

    componentInfoLabel: {
        color: '#999',
        fontSize: 9.5,
        fontWeight: '600',
    },

    componentInfoValue: {
        color: '#444',
        fontSize: 11.5,
        fontWeight: '700',
        marginTop: 3,
        textTransform: 'capitalize',
    },

    inventoryBox: {
        marginTop: 12,
        backgroundColor: '#F8F7FC',
        borderRadius: 13,
        padding: 11,
    },

    inventoryTitle: {
        color: '#555',
        fontSize: 10.5,
        fontWeight: '800',
    },

    inventoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },

    inventoryText: {
        color: '#777',
        fontSize: 10.5,
    },

    notesCard: {
        backgroundColor: '#fff',
        borderRadius: 19,
        padding: 15,
        marginTop: 11,
    },

    notesLabel: {
        color: '#6C4DFF',
        fontSize: 10.5,
        fontWeight: '800',
    },

    notesText: {
        color: '#555',
        fontSize: 12.5,
        lineHeight: 19,
        marginTop: 4,
    },

    returnButton: {
        backgroundColor: '#6C4DFF',
        borderRadius: 19,
        padding: 15,
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },

    returnTitle: {
        color: '#fff',
        fontSize: 14.5,
        fontWeight: '800',
    },

    returnSubtitle: {
        color: '#E5DEFF',
        fontSize: 10.5,
        marginTop: 3,
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