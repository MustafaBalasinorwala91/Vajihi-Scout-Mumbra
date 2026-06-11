import { wp, hp } from '../utils/responsive';
import { rf } from '../utils/fonts';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import {
    Ionicons,
    MaterialCommunityIcons,
    FontAwesome,
} from '@expo/vector-icons';

import { useLocalSearchParams, useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function MemberProfileScreen() {
    const router = useRouter();
    const { user_id } = useLocalSearchParams();

    const [member, setMember] = useState<any>(null);
    const [attendance, setAttendance] = useState<any>(null);
    const [canViewPrivate, setCanViewPrivate] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        loadMember();
    }, [user_id]);
    const loadMember = async () => {
        try {
            const AsyncStorage =
                require('@react-native-async-storage/async-storage').default;

            const token =
                await AsyncStorage.getItem('session_token');
            if (!token) return;

            const response = await fetch(
                `${BACKEND_URL}/api/admin/user-profile/${user_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();
            console.log(
                'MEMBER PROFILE DATA:',
                JSON.stringify(data, null, 2)
            );

            setMember(data.user);
            setAttendance(data.attendance);
            setCanViewPrivate(data.can_view_private);
        } catch (error) {
            Alert.alert(
                'Error',
                'Failed to load member profile'
            );
        } finally {
            setLoading(false);
        }
    };
    const handleDeleteMember = async () => {
        if (!member?.user_id) {
            Alert.alert(
                'Error',
                'Member not found'
            );
            return;
        }
        Alert.alert(
            'Delete Member',
            'This will permanently remove this member and all related data.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const AsyncStorage =
                                require('@react-native-async-storage/async-storage').default;

                            const token =
                                await AsyncStorage.getItem('session_token');

                            const response = await fetch(
                                `${BACKEND_URL}/api/admin/delete-user/${member.user_id}`,
                                {
                                    method: 'DELETE',
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );

                            if (!response.ok) {
                                throw new Error();
                            }

                            Alert.alert(
                                'Success',
                                'Member deleted successfully'
                            );

                            router.replace('/manage-members');
                        } catch {
                            Alert.alert(
                                'Error',
                                'Failed to delete member'
                            );
                        }
                    },
                },
            ]
        );
    };

    const profileImage = member?.picture || null;

    const badges = [
        {
            id: '1',
            title: member?.role || 'Member',
            icon: 'shield-checkmark',
            type: 'ionicons',
            color: '#6C4DFF',
        },

        {
            id: '2',
            title: member?.permissions?.attendance
                ? 'Attendance Access'
                : 'Attendance View',
            icon: 'calendar',
            type: 'ionicons',
            color: '#31C7B7',
        },

        {
            id: '3',
            title: member?.permissions?.members
                ? 'Member Manager'
                : 'Member Access',
            icon: 'people',
            type: 'ionicons',
            color: '#FF6B6B',
        },
    ];
    const favourites = [
        {
            id: '1',
            title: member?.instrument || 'Instrument',
            icon: 'musical-notes',
            type: 'ionicons',
            color: '#6C4DFF',
        },

        {
            id: '2',
            title: member?.role || 'Member',
            icon: 'person',
            type: 'ionicons',
            color: '#31C7B7',
        },

        {
            id: '3',
            title: member?.joining_year || '--',
            icon: 'calendar',
            type: 'ionicons',
            color: '#FF5DA2',
        },

        {
            id: '4',
            title: member?.tag || 'Scout',
            icon: 'card',
            type: 'ionicons',
            color: '#FFA726',
        },
    ];
    const renderIcon = (
        type: string,
        icon: string,
        color: string
    ) => {
        if (type === 'ionicons') {
            return (
                <Ionicons
                    name={icon as any}
                    size={28}
                    color={color}
                />
            );
        }

        if (type === 'material') {
            return (
                <MaterialCommunityIcons
                    name={icon as any}
                    size={28}
                    color={color}
                />
            );
        }

        return (
            <FontAwesome
                name={icon as any}
                size={28}
                color={color}
            />
        );
    };

    const InfoField = ({
        icon,
        label,
        value,
    }: any) => (
        <View style={styles.infoItem}>
            <View style={styles.infoIconWrap}>
                <Ionicons
                    name={icon}
                    size={22}
                    color="#5B4FCE"
                />
            </View>

            <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>
                    {label}
                </Text>

                <Text style={styles.infoValue}>
                    {value || 'Not provided'}
                </Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator
                    size="large"
                    color="#5B4FCE"
                />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
                paddingBottom: 140,
            }}
        >
            <LinearGradient
                colors={['#2B145A', '#5B3DF5']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={28}
                        color="#fff"
                    />
                </TouchableOpacity>

                <View style={styles.profileSection}>
                    {profileImage ? (
                        <Image
                            source={{ uri: profileImage }}
                            style={styles.profileImage}
                        />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Ionicons
                                name="person"
                                size={70}
                                color="#bbb"
                            />
                        </View>
                    )}

                    <Text style={styles.userName}
                        numberOfLines={2}>
                        {member?.name || 'Member'}
                    </Text>

                    <View style={styles.memberBadge}>
                        <Text style={styles.memberBadgeText}>
                            {member?.role?.toUpperCase() || 'MEMBER'}
                        </Text>
                    </View>

                    <Text style={styles.bioText}>
                        {member?.instrument || 'No Instrument Assigned'}
                    </Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.statsContainer}
                >
                    <View style={styles.statCard}>
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={24}
                            color="#fff"
                        />

                        <Text style={styles.statLabel}>
                            Role
                        </Text>

                        <Text style={styles.statValue}>
                            {member?.role || 'Member'}
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <Ionicons
                            name="calendar-outline"
                            size={24}
                            color="#fff"
                        />

                        <Text style={styles.statLabel}>
                            Member Since
                        </Text>

                        <Text style={styles.statValue}>
                            {member?.joining_year || '--'}
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <Ionicons
                            name="musical-notes-outline"
                            size={24}
                            color="#fff"
                        />

                        <Text style={styles.statLabel}>
                            Instrument
                        </Text>

                        <Text style={styles.statValue}>
                            {member?.instrument || 'Not Set'}
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <Ionicons
                            name="happy-outline"
                            size={24}
                            color="#fff"
                        />

                        <Text style={styles.statLabel}>
                            Age
                        </Text>

                        <Text style={styles.statValue}>
                            {member?.age || '--'}
                        </Text>
                    </View>
                </ScrollView>
            </LinearGradient>

            {/* PERSONAL INFO */}
            <View style={styles.mainContent}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Personal Information
                    </Text>

                    {canViewPrivate && (
                        <>
                            <InfoField
                                icon="card-outline"
                                label="ITS Number"
                                value={member?.its_no}
                            />

                            <InfoField
                                icon="mail-outline"
                                label="Email"
                                value={member?.email_id}
                            />

                            <InfoField
                                icon="call-outline"
                                label="Phone"
                                value={member?.phone}
                            />

                            <InfoField
                                icon="people-outline"
                                label="Parent Contact"
                                value={member?.parent_contact}
                            />
                        </>
                    )}

                    <InfoField
                        icon="person-outline"
                        label="Name"
                        value={member?.name}
                    />

                    <InfoField
                        icon="calendar-outline"
                        label="Age"
                        value={member?.age}
                    />

                    <InfoField
                        icon="gift-outline"
                        label="Birth Date"
                        value={member?.birth_date}
                    />

                    <InfoField
                        icon="musical-notes-outline"
                        label="Instrument"
                        value={member?.instrument}
                    />

                    <InfoField
                        icon="time-outline"
                        label="Joining Year"
                        value={member?.joining_year}
                    />

                    <InfoField
                        icon="ribbon-outline"
                        label="Badge"
                        value={member?.badge || 'No badge'}
                    />
                </View>

                {/* ATTENDANCE */}

                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            Attendance
                        </Text>

                        <Text style={styles.monthText}>
                            This Month
                        </Text>
                    </View>

                    <View style={styles.attendanceRow}>
                        <View style={styles.attendanceCirclePurple}>
                            <Text style={styles.attendancePercent}>
                                {attendance?.duties?.percentage || 0}%
                            </Text>
                        </View>

                        <View>
                            <Text style={styles.attendanceTitle}>
                                Duties
                            </Text>

                            <Text style={styles.attendanceSub}>
                                {attendance?.duties?.present || 0} Present / {attendance?.duties?.total || 0} Total
                            </Text>
                        </View>
                    </View>

                    <View style={styles.attendanceRow}>
                        <View style={styles.attendanceCircleGreen}>
                            <Text style={styles.attendancePercent}>
                                {attendance?.practice?.percentage || 0}%
                            </Text>
                        </View>

                        <View>
                            <Text style={styles.attendanceTitle}>
                                Practices
                            </Text>

                            <Text style={styles.attendanceSub}>
                                {attendance?.practice?.present || 0} Present / {attendance?.practice?.total || 0} Total
                            </Text>
                        </View>
                    </View>

                    <View style={styles.attendanceRow}>
                        <View style={styles.attendanceCircleOrange}>
                            <Text style={styles.attendancePercent}>
                                {attendance?.khidmat?.percentage || 0}%
                            </Text>
                        </View>

                        <View>
                            <Text style={styles.attendanceTitle}>
                                Khidmat
                            </Text>

                            <Text style={styles.attendanceSub}>
                                {attendance?.khidmat?.present || 0} Present / {attendance?.khidmat?.total || 0} Total
                            </Text>
                        </View>
                    </View>
                </View>

                {/* PERMISSIONS */}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Organization Roles
                    </Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >

                        {member?.permissions?.attendance && (
                            <View style={styles.badgeCard}>
                                <View style={styles.badgeIcon}>
                                    <Ionicons
                                        name="calendar"
                                        size={28}
                                        color="#31C7B7"
                                    />
                                </View>

                                <Text style={styles.badgeText}>
                                    Attendance Team
                                </Text>
                            </View>
                        )}

                        {member?.permissions?.members && (
                            <View style={styles.badgeCard}>
                                <View style={styles.badgeIcon}>
                                    <Ionicons
                                        name="people"
                                        size={28}
                                        color="#6C4DFF"
                                    />
                                </View>

                                <Text style={styles.badgeText}>
                                    Member Manager
                                </Text>
                            </View>
                        )}

                        {member?.permissions?.fees && (
                            <View style={styles.badgeCard}>
                                <View style={styles.badgeIcon}>
                                    <Ionicons
                                        name="cash"
                                        size={28}
                                        color="#31C978"
                                    />
                                </View>

                                <Text style={styles.badgeText}>
                                    Fees Team
                                </Text>
                            </View>
                        )}

                        {member?.permissions?.inventory && (
                            <View style={styles.badgeCard}>
                                <View style={styles.badgeIcon}>
                                    <Ionicons
                                        name="cube"
                                        size={28}
                                        color="#FF8A34"
                                    />
                                </View>

                                <Text style={styles.badgeText}>
                                    Inventory Team
                                </Text>
                            </View>
                        )}

                        {member?.permissions?.uniforms && (
                            <View style={styles.badgeCard}>
                                <View style={styles.badgeIcon}>
                                    <Ionicons
                                        name="shirt"
                                        size={28}
                                        color="#FF5DA2"
                                    />
                                </View>

                                <Text style={styles.badgeText}>
                                    Uniform Team
                                </Text>
                            </View>
                        )}

                        {!member?.permissions?.attendance &&
                            !member?.permissions?.members &&
                            !member?.permissions?.fees &&
                            !member?.permissions?.inventory &&
                            !member?.permissions?.uniforms && (
                                <Text
                                    style={{
                                        color: '#777',
                                        fontSize: 16,
                                        paddingVertical: 10,
                                    }}
                                >
                                    No organization roles assigned
                                </Text>
                            )}
                    </ScrollView>
                </View>
                {/* BADGES */}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Badges
                    </Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {badges.map((badge) => (
                            <View
                                key={badge.id}
                                style={styles.badgeCard}
                            >
                                <View style={styles.badgeIcon}>
                                    {renderIcon(
                                        badge.type,
                                        badge.icon,
                                        badge.color
                                    )}
                                </View>

                                <Text style={styles.badgeText}>
                                    {badge.title}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* FAVORITES */}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Favorites
                    </Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {favourites.map((item) => (
                            <View
                                key={item.id}
                                style={styles.favoriteItem}
                            >
                                <View style={styles.favoriteCircle}>
                                    {renderIcon(
                                        item.type,
                                        item.icon,
                                        item.color
                                    )}
                                </View>

                                <Text style={styles.favoriteText}>
                                    {item.title}
                                </Text>
                            </View>
                        ))}

                    </ScrollView>
                </View>
                {currentUser?.role === 'admin' &&
                    member?.role !== 'admin' &&
                    member?.user_id !== currentUser?.user_id && (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={handleDeleteMember}
                        >
                            <Ionicons
                                name="warning-outline"
                                size={22}
                                color="#fff"
                            />

                            <Text style={styles.deleteButtonText}>
                                Delete Member
                            </Text>
                        </TouchableOpacity>
                    )}
            </View>
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
    },

    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    header: {
        paddingTop: 70,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },

    backButton: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },

    profileSection: {
        alignItems: 'center',
    },

    profileImage: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 4,
        borderColor: '#fff',
    },

    placeholderImage: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },

    userName: {
        color: '#fff',
        fontSize: rf(20),
        lineHeight: rf(28),
        fontWeight: '800',
        textAlign: 'center',
        paddingHorizontal: 20,
    },

    memberBadge: {
        marginTop: 10,
        backgroundColor: '#45d0c1',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 30,
    },

    memberBadgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    bioText: {
        marginTop: 14,
        color: '#eee',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 30,
    },

    statsContainer: {
        marginTop: 28,
        paddingRight: 20,
    },

    statCard: {
        width: 130,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: 22,
        padding: 18,
        marginRight: 14,
        alignItems: 'center',
    },

    statLabel: {
        color: '#ddd',
        fontSize: 12,
        marginTop: 10,
        textAlign: 'center',
    },

    statValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginTop: 8,
        textAlign: 'center',
    },

    mainContent: {
        marginTop: -28,
        paddingHorizontal: 16,
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 18,
        marginBottom: 18,

        borderWidth: 1,
        borderColor: '#F3F0FF',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },

    sectionTitle: {
        fontSize: rf(20),
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: 20,
    },

    infoItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },

    infoIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#f1edff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },

    infoLabel: {
        color: '#888',
        fontSize: 14,
        marginBottom: 5,
    },

    infoValue: {
        color: '#1a1a2e',
        fontSize: 18,
        fontWeight: '600',
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },

    monthText: {
        color: '#5B4FCE',
        fontWeight: '700',
    },

    attendanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 22,
    },

    attendanceCirclePurple: {
        width: 74,
        height: 74,
        borderRadius: 37,
        borderWidth: 6,
        borderColor: '#5B4FCE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },

    attendanceCircleGreen: {
        width: 74,
        height: 74,
        borderRadius: 37,
        borderWidth: 6,
        borderColor: '#31c7b7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },

    attendanceCircleOrange: {
        width: 74,
        height: 74,
        borderRadius: 37,
        borderWidth: 6,
        borderColor: '#ff8a34',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },

    attendancePercent: {
        fontWeight: '700',
        fontSize: 18,
        color: '#1a1a2e',
    },

    attendanceTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a2e',
    },

    attendanceSub: {
        color: '#777',
        marginTop: 5,
        flexShrink: 1,
    },

    permissionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },

    permissionText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1a1a2e',
    },

    badgeCard: {
        width: wp(28),
        alignItems: 'center',
        marginRight: 16,
    },

    badgeIcon: {
        width: wp(18),
        height: wp(18),
        borderRadius: wp(5),
        backgroundColor: '#f7f3ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },

    badgeText: {
        textAlign: 'center',
        fontWeight: '600',
        color: '#1a1a2e',
        fontSize: 14,
    },

    favoriteItem: {
        alignItems: 'center',
        marginRight: 20,
    },

    favoriteCircle: {
        width: 74,
        height: 74,
        borderRadius: 37,
        backgroundColor: '#f1edff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },

    favoriteText: {
        fontSize: 14,
        color: '#1a1a2e',
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#E53935',

        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 30,

        height: 62,

        borderRadius: 20,

        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',

        shadowColor: '#E53935',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },

    deleteButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: rf(16),
        marginLeft: wp(2),
    },
});