import React, { useEffect, useState } from 'react';

import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';

import { useRouter } from 'expo-router';

import PermissionModal from '../components/PermissionModal';

interface Member {

    user_id: string;

    name: string;

    role: string;

    instrument?: string;

    picture?: string;

    permissions?: {

        attendance?: boolean;

        inventory?: boolean;

        fees?: boolean;

        uniforms?: boolean;

        members?: boolean;
    };
}

export default function ManageMembersScreen() {
    const router = useRouter();

    const [members, setMembers] =
        useState<Member[]>([]);

    const [filteredMembers, setFilteredMembers] =
        useState<Member[]>([]);

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');

    const [selectedMember, setSelectedMember] =
        useState<Member | null>(null);

    const [permissionVisible, setPermissionVisible] = useState(false);

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {

        try {

            setLoading(true);

            const BACKEND_URL =
                process.env.EXPO_PUBLIC_BACKEND_URL;

            const response = await fetch(
                `${BACKEND_URL}/api/attendance/members`,
                {
                    credentials: 'include',
                }
            );

            const data = await response.json();

            const sortedMembers = data.sort(
                (a: any, b: any) =>
                    a.name.localeCompare(b.name)
            );

            setMembers(sortedMembers);

            setFilteredMembers(sortedMembers);

        } catch (error) {

            console.log(
                'LOAD MEMBERS ERROR:',
                error
            );

        } finally {

            setLoading(false);

        }
    };

    const handleSearch = (text: string) => {
        setSearch(text);

        const filtered = members.filter((member) =>
            member.name.toLowerCase().includes(text.toLowerCase())
        );

        setFilteredMembers(filtered);
    };

    const openPermissions = (
        member: Member
    ) => {
        setSelectedMember(member);

        setPermissionVisible(true);
    };

    const renderMember = ({
        item,
    }: {
        item: Member;
    }) => (
        <View style={styles.memberCard}>
            <View style={styles.leftSection}>
                {item.picture ? (
                    <Image
                        source={{ uri: item.picture }}
                        style={styles.avatar}
                    />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons
                            name="person"
                            size={26}
                            color="#6C4EFF"
                        />
                    </View>
                )}

                <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                        {item.name}
                    </Text>

                    <Text style={styles.memberDetails}>
                        {item.role} • {item.instrument || 'No Instrument'}
                    </Text>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() =>
                        router.push({
                            pathname: '/member-profile',
                            params: {
                                user_id: item.user_id,
                            },
                        })
                    }
                >
                    <Ionicons
                        name="eye-outline"
                        size={22}
                        color="#fff"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => openPermissions(item)}
                >
                    <Ionicons
                        name="settings-outline"
                        size={22}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator
                    size="large"
                    color="#6C4EFF"
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>

            <LinearGradient
                colors={['#2D1B69', '#6C4EFF']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={26}
                        color="#fff"
                    />
                </TouchableOpacity>

                <View>
                    <Text style={styles.headerTitle}>
                        Manage Members
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        View & manage scout members
                    </Text>
                </View>
            </LinearGradient>

            <View style={styles.searchContainer}>
                <Ionicons
                    name="search"
                    size={24}
                    color="#777"
                />

                <TextInput
                    placeholder="Search members..."
                    placeholderTextColor="#999"
                    style={styles.searchInput}
                    value={search}
                    onChangeText={handleSearch}
                />
            </View>

            <FlatList
                data={filteredMembers}
                keyExtractor={(item) => item.user_id}
                renderItem={renderMember}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: 120,
                }}
            />

            <PermissionModal
                visible={permissionVisible}
                user={selectedMember}
                onClose={() => setPermissionVisible(false)}
                onSave={loadMembers}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },

    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    header: {
        paddingTop: 70,
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        flexDirection: 'row',
        alignItems: 'center',
    },

    backButton: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },

    headerTitle: {
        color: '#fff',
        fontSize: 38,
        fontWeight: 'bold',
    },

    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 18,
        marginTop: 4,
    },

    searchContainer: {
        margin: 24,
        backgroundColor: '#fff',
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 72,
    },

    searchInput: {
        flex: 1,
        marginLeft: 14,
        fontSize: 18,
        color: '#000',
    },

    memberCard: {
        backgroundColor: '#fff',
        marginHorizontal: 24,
        marginBottom: 18,
        borderRadius: 28,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },

    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    avatar: {
        width: 78,
        height: 78,
        borderRadius: 39,
    },

    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EEE7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    memberInfo: {
        marginLeft: 16,
        flex: 1,
    },

    memberName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },

    memberDetails: {
        marginTop: 6,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },

    actions: {
        flexDirection: 'row',
        gap: 12,
    },

    profileButton: {
        width: 58,
        height: 58,
        borderRadius: 20,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },

    settingsButton: {
        width: 58,
        height: 58,
        borderRadius: 20,
        backgroundColor: '#6C4EFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
});