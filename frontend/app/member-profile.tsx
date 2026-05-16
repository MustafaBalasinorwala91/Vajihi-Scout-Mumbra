import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMember();
    }, []);

    const loadMember = async () => {
        try {
            const response = await fetch(
                `${BACKEND_URL}/api/members/${user_id}`,
                {
                    credentials: 'include',
                }
            );

            const data = await response.json();

            setMember(data);
        } catch (error) {
            console.log('LOAD MEMBER ERROR:', error);
        } finally {
            setLoading(false);
        }
    };

    const profileImage = member?.picture || null;

    const badges = [
        {
            id: '1',
            title: 'Active Member',
            icon: 'shield-checkmark',
            type: 'ionicons',
            color: '#6C4DFF',
        },

        {
            id: '2',
            title: 'Rhythm Master',
            icon: 'music',
            type: 'fontawesome',
            color: '#FF6B6B',
        },

        {
            id: '3',
            title: 'Team Player',
            icon: 'account-group',
            type: 'material',
            color: '#31C7B7',
        },
    ];

    const favourites = [
        {
            id: '1',
            title: 'Songs',
            icon: 'musical-notes',
            type: 'ionicons',
            color: '#6C4DFF',
        },

        {
            id: '2',
            title: 'Bands',
            icon: 'account-group',
            type: 'material',
            color: '#31C7B7',
        },

        {
            id: '3',
            title: 'Artists',
            icon: 'microphone',
            type: 'fontawesome',
            color: '#FF5DA2',
        },

        {
            id: '4',
            title: 'Albums',
            icon: 'disc',
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
                colors={['#4B2CCF', '#6C4DFF']}
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

                    <Text style={styles.userName}>
                        {member?.name || 'Member'}
                    </Text>

                    <View style={styles.memberBadge}>
                        <Text style={styles.memberBadgeText}>
                            {member?.role?.toUpperCase() || 'MEMBER'}
                        </Text>
                    </View>

                    <Text style={styles.bioText}>
                        Scout Member Profile
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
                            Performance
                        </Text>

                        <Text style={styles.statValue}>
                            Intermediate
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
                            {member?.joining_year || '2024'}
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
                            {member?.instrument || 'Member'}
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

            <View style={styles.mainContent}>
                {/* PERSONAL INFO */}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Personal Information
                    </Text>

                    <InfoField
                        icon="card-outline"
                        label="ITS Number"
                        value={member?.its_no}
                    />

                    <InfoField
                        icon="person-outline"
                        label="Name"
                        value={member?.name}
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
                        icon="people-outline"
                        label="Parent Contact"
                        value={member?.parent_contact}
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
                                92%
                            </Text>
                        </View>

                        <View>
                            <Text style={styles.attendanceTitle}>
                                Duties
                            </Text>

                            <Text style={styles.attendanceSub}>
                                12 / 13
                            </Text>
                        </View>
                    </View>

                    <View style={styles.attendanceRow}>
                        <View style={styles.attendanceCircleGreen}>
                            <Text style={styles.attendancePercent}>
                                88%
                            </Text>
                        </View>

                        <View>
                            <Text style={styles.attendanceTitle}>
                                Practices
                            </Text>

                            <Text style={styles.attendanceSub}>
                                7 / 8
                            </Text>
                        </View>
                    </View>

                    <View style={styles.attendanceRow}>
                        <View style={styles.attendanceCircleOrange}>
                            <Text style={styles.attendancePercent}>
                                85%
                            </Text>
                        </View>

                        <View>
                            <Text style={styles.attendanceTitle}>
                                Khidmat
                            </Text>

                            <Text style={styles.attendanceSub}>
                                17 / 20
                            </Text>
                        </View>
                    </View>
                </View>

                {/* PERMISSIONS */}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Permissions
                    </Text>

                    <View style={styles.permissionRow}>
                        <Text style={styles.permissionText}>
                            Attendance
                        </Text>

                        <Ionicons
                            name={
                                member?.permissions?.attendance
                                    ? 'checkmark-circle'
                                    : 'close-circle'
                            }
                            size={24}
                            color={
                                member?.permissions?.attendance
                                    ? '#31C978'
                                    : '#ff4d67'
                            }
                        />
                    </View>

                    <View style={styles.permissionRow}>
                        <Text style={styles.permissionText}>
                            Fees
                        </Text>

                        <Ionicons
                            name={
                                member?.permissions?.fees
                                    ? 'checkmark-circle'
                                    : 'close-circle'
                            }
                            size={24}
                            color={
                                member?.permissions?.fees
                                    ? '#31C978'
                                    : '#ff4d67'
                            }
                        />
                    </View>

                    <View style={styles.permissionRow}>
                        <Text style={styles.permissionText}>
                            Inventory
                        </Text>

                        <Ionicons
                            name={
                                member?.permissions?.inventory
                                    ? 'checkmark-circle'
                                    : 'close-circle'
                            }
                            size={24}
                            color={
                                member?.permissions?.inventory
                                    ? '#31C978'
                                    : '#ff4d67'
                            }
                        />
                    </View>

                    <View style={styles.permissionRow}>
                        <Text style={styles.permissionText}>
                            Uniforms
                        </Text>

                        <Ionicons
                            name={
                                member?.permissions?.uniforms
                                    ? 'checkmark-circle'
                                    : 'close-circle'
                            }
                            size={24}
                            color={
                                member?.permissions?.uniforms
                                    ? '#31C978'
                                    : '#ff4d67'
                            }
                        />
                    </View>
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
            </View>
        </ScrollView>
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
        paddingTop: 40,
        paddingBottom: 28,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },

    backButton: {
        width: 60,
        height: 60,
        borderRadius: 20,
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
        fontSize: 28,
        fontWeight: '700',
        marginTop: 18,
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
        fontSize: 16,
    },

    statsContainer: {
        marginTop: 26,
        paddingRight: 20,
    },

    statCard: {
        width: 120,
        backgroundColor: 'rgba(255,255,255,0.12)',
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
        fontSize: 18,
        fontWeight: '700',
        marginTop: 8,
        textAlign: 'center',
    },

    mainContent: {
        marginTop: -18,
        paddingHorizontal: 16,
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 18,
        marginBottom: 18,

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
        fontSize: 22,
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: 20,
    },

    infoItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },

    infoIconWrap: {
        width: 50,
        height: 50,
        borderRadius: 16,
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
        width: 120,
        alignItems: 'center',
        marginRight: 16,
    },

    badgeIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
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
});