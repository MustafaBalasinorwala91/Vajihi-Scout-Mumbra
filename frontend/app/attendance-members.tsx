import React, {
    useEffect,
    useState,
} from 'react';
import { wp, hp } from '../utils/responsive';
import { rf } from '../utils/fonts';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import {
    Ionicons,
} from '@expo/vector-icons';

import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function AttendanceMembersScreen() {

    const BACKEND_URL =
        process.env.EXPO_PUBLIC_BACKEND_URL;

    const router = useRouter();
    const { user } = useAuth();
    const canManageAttendance =
        user?.role === 'admin' ||
        user?.permissions?.attendance;

    const [members, setMembers] =
        useState<any[]>([]);

    const [filteredMembers, setFilteredMembers] =
        useState<any[]>([]);

    const [loading, setLoading] =
        useState(false);
    const [saving, setSaving] =
        useState(false);

    const [search, setSearch] =
        useState('');

    const [attendanceMap, setAttendanceMap] =
        useState<any>({});
    const hasAttendance =
        Object.keys(attendanceMap).length > 0;

    const {
        attendanceType,
        selectedDate,
        editMode,
        eventName,
    } = useLocalSearchParams();

    // FETCH MEMBERS
    const loadExistingAttendance = async () => {

        try {

            const AsyncStorage =
                require('@react-native-async-storage/async-storage').default;

            const token =
                await AsyncStorage.getItem(
                    'session_token'
                );
            if (!token) return;

            const response = await fetch(
                `${BACKEND_URL}/api/attendance/history-details/${attendanceType}/${selectedDate}?event_name=${encodeURIComponent(
                    String(eventName || '')
                )}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();

            const map: any = {};

            data.forEach((record: any) => {

                map[record.user_id] =
                    record.status;

            });

            setAttendanceMap(map);

        } catch (error) {

            console.error(error);
        }
    };
    const fetchMembers = async () => {

        try {

            setLoading(true);

            const AsyncStorage =
                require('@react-native-async-storage/async-storage').default;

            const token =
                await AsyncStorage.getItem(
                    'session_token'
                );
            if (!token) return;

            const response = await fetch(
                `${BACKEND_URL}/api/attendance/members`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();

            // SORT ALPHABETICALLY
            if (!Array.isArray(data)) {
                return;
            }

            const sorted = data.sort(
                (a: any, b: any) =>
                    a.name.localeCompare(b.name)
            );

            setMembers(sorted);

            setFilteredMembers(sorted);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {

        if (!canManageAttendance) {

            Alert.alert(
                'Access Restricted',
                'You do not have permission to view members.'
            );

            router.back();

            return;
        }

        fetchMembers();

        if (editMode === 'true') {

            loadExistingAttendance();

        }

    }, []);
    // SEARCH
    useEffect(() => {

        const filtered = members.filter(
            (member) =>
                (member.name || '')
                    .toLowerCase()
                    .includes(search.toLowerCase())
        );

        setFilteredMembers(filtered);

    }, [search, members]);

    // MARK ATTENDANCE
    const updateAttendance = (
        userId: string,
        status: string
    ) => {

        setAttendanceMap((prev: any) => ({
            ...prev,
            [userId]: status,
        }));
    };

    // SAVE ATTENDANCE
    const saveAttendance = async () => {
        if (saving) {
            return;
        }

        try {
            setSaving(true);

            const AsyncStorage =
                require('@react-native-async-storage/async-storage').default;

            const token =
                await AsyncStorage.getItem(
                    'session_token'
                );

            if (!token) {

                Alert.alert(
                    'Error',
                    'Please login again'
                );

                return;
            }
            const markedCount = members.filter(
                member => attendanceMap[member.user_id]
            ).length;

            if (markedCount === 0) {

                Alert.alert(
                    'No Attendance Marked',
                    'Please mark attendance for at least one member.'
                );

                return;
            }

            const records = members.map((member) => ({
                user_id: member.user_id,
                status: attendanceMap[member.user_id] || 'absent',
            }));

            const response = await fetch(
                `${BACKEND_URL}/api/attendance/bulk`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        attendance_type: attendanceType,
                        event_name: eventName,
                        date: selectedDate,
                        records,
                    }),
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                Alert.alert(
                    'Success',
                    'Attendance saved successfully'
                );

                setAttendanceMap({});

                router.replace('/attendance');

            } else {

                Alert.alert(
                    'Error',
                    data.detail ||
                    'Save failed'
                );
            }

        } catch (error) {

            console.error(error);

            Alert.alert(
                'Error',
                'Attendance save failed'
            );
        }
        finally {

            setSaving(false);

        }
    };


    return (

        <View style={styles.container}>

            {/* HEADER */}
            <LinearGradient
                colors={['#2B145A', '#5B3DF5']}
                style={styles.header}
            >

                <View style={styles.headerTop}>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >

                        <Ionicons
                            name="arrow-back"
                            size={22}
                            color="#fff"
                        />

                    </TouchableOpacity>

                    <View style={styles.headerTextWrapper}>

                        <Text style={styles.title}>
                            Members Attendance
                        </Text>

                        <Text style={styles.subtitle}>
                            {eventName ||
                                (String(attendanceType)
                                    .charAt(0)
                                    .toUpperCase() +
                                    String(attendanceType).slice(1))}
                        </Text>

                    </View>

                </View>
            </LinearGradient>

            {/* SEARCH */}
            <View style={styles.searchWrapper}>

                <Ionicons
                    name="search"
                    size={20}
                    color="#777"
                />

                <TextInput
                    placeholder="Search members..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                />

            </View>
            <View style={styles.eventInfoCard}>

                <Ionicons
                    name="bookmark-outline"
                    size={22}
                    color="#5B3DF5"
                />

                <View style={{ marginLeft: 12, flex: 1 }}>

                    <Text style={styles.eventInfoLabel}>
                        Selected Event
                    </Text>

                    <Text style={styles.eventInfoValue}>
                        {eventName}
                    </Text>

                    <Text style={styles.eventInfoDate}>
                        {selectedDate}
                    </Text>

                </View>

            </View>

            {/* MEMBERS */}
            <ScrollView
                contentContainerStyle={{
                    paddingBottom: 30,
                }}
            >
                {loading ? (

                    <ActivityIndicator
                        size="large"
                        color="#5B3DF5"
                        style={{
                            marginTop: 40,
                        }}
                    />

                ) : (

                    <>

                        {filteredMembers.map(
                            (member: any) => (

                                <View
                                    key={member.user_id}
                                    style={styles.memberCard}
                                >

                                    <View style={styles.memberInfo}>

                                        <Text
                                            style={styles.memberName}
                                            numberOfLines={2}
                                        >
                                            {member.name}
                                        </Text>

                                        <Text style={styles.memberRole}>
                                            {`${(member.role || 'Member')
                                                .charAt(0)
                                                .toUpperCase() +
                                                (member.role || 'Member')
                                                    .slice(1)} • ${member.instrument || 'No Instrument'}`}
                                        </Text>

                                    </View>

                                    <View style={styles.actionsRow}>

                                        <TouchableOpacity

                                            disabled={!canManageAttendance}

                                            style={[
                                                styles.statusButton,
                                                attendanceMap[member.user_id] === 'present'
                                                    ? styles.presentBtn
                                                    : styles.inactiveBtn,

                                                !canManageAttendance && {
                                                    opacity: 0.55,
                                                },
                                            ]}

                                            onPress={() => {

                                                if (!canManageAttendance) {
                                                    return;
                                                }

                                                updateAttendance(
                                                    member.user_id,
                                                    'present'
                                                );

                                            }}
                                        >

                                            <Ionicons
                                                name="checkmark-circle"
                                                size={18}
                                                color={
                                                    attendanceMap[member.user_id] === 'present'
                                                        ? '#FFFFFF'
                                                        : '#37C978'
                                                }
                                            />

                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    attendanceMap[member.user_id] === 'present' && {
                                                        color: '#fff',
                                                    },
                                                ]}
                                            >
                                                Present
                                            </Text>

                                        </TouchableOpacity>

                                        <TouchableOpacity

                                            disabled={!canManageAttendance}

                                            style={[
                                                styles.statusButton,
                                                attendanceMap[member.user_id] === 'absent'
                                                    ? styles.absentBtn
                                                    : styles.inactiveBtn,

                                                !canManageAttendance && {
                                                    opacity: 0.55,
                                                },
                                            ]}

                                            onPress={() => {

                                                if (!canManageAttendance) {
                                                    return;
                                                }

                                                updateAttendance(
                                                    member.user_id,
                                                    'absent'
                                                );

                                            }}
                                        >

                                            <Ionicons
                                                name="close-circle"
                                                size={18}
                                                color={
                                                    attendanceMap[member.user_id] === 'absent'
                                                        ? '#FFFFFF'
                                                        : '#FF5B5B'
                                                }
                                            />

                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    attendanceMap[member.user_id] === 'absent' && {
                                                        color: '#fff',
                                                    },
                                                ]}
                                            >
                                                Absent
                                            </Text>

                                        </TouchableOpacity>

                                    </View>

                                </View>

                            )
                        )}

                        {filteredMembers.length === 0 && (

                            <View
                                style={{
                                    alignItems: 'center',
                                    marginTop: 60,
                                }}
                            >

                                <Ionicons
                                    name="people-outline"
                                    size={70}
                                    color="#C7C7C7"
                                />

                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontWeight: '700',
                                        color: '#16162E',
                                        marginTop: 12,
                                    }}
                                >
                                    No Members Found
                                </Text>

                                <Text
                                    style={{
                                        color: '#777',
                                        marginTop: 6,
                                    }}
                                >
                                    Try another search keyword.
                                </Text>

                            </View>

                        )}

                    </>

                )}

                <View
                    style={{
                        marginHorizontal: 18,
                        marginTop: 20,
                        backgroundColor: '#fff',
                        borderRadius: 18,
                        padding: 16,
                    }}
                >
                    <Text>
                        Present: {
                            Object.values(attendanceMap)
                                .filter(v => v === 'present')
                                .length
                        }
                    </Text>

                    <Text>
                        Absent: {
                            Object.values(attendanceMap)
                                .filter(v => v === 'absent')
                                .length
                        }
                    </Text>
                </View>
                <TouchableOpacity

                    disabled={
                        !canManageAttendance ||
                        saving ||
                        !hasAttendance
                    }

                    style={[
                        styles.saveButton,
                        (
                            !canManageAttendance ||
                            saving ||
                            !hasAttendance
                        ) && {
                            opacity: 0.55,
                        },
                    ]}

                    onPress={() => {

                        if (!canManageAttendance) {

                            Alert.alert(
                                'Access Restricted',
                                'You only have view access for attendance.'
                            );

                            return;
                        }

                        saveAttendance();

                    }}
                >

                    <LinearGradient
                        colors={
                            (!canManageAttendance || !hasAttendance)
                                ? ['#A8A8A8', '#8E8E8E']
                                : ['#6C4DFF', '#5B3DF5']
                        }
                        style={styles.saveGradient}
                    >

                        <Text style={styles.saveText}>

                            {saving
                                ? 'Saving Attendance...'
                                : canManageAttendance
                                    ? 'Save Attendance'
                                    : 'View Only Access'}

                        </Text>

                    </LinearGradient>

                </TouchableOpacity>

            </ScrollView >

            {/* SAVE BUTTON */}
        </View >
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },

    header: {
        paddingTop: 70,
        paddingBottom: 30,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 34,
        borderBottomRightRadius: 34,
    },
    headerTextWrapper: {
        flex: 1,
    },

    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#fff',
    },

    subtitle: {
        marginTop: 6,
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textTransform: 'capitalize',
    },

    searchWrapper: {
        marginHorizontal: 18,
        marginTop: 20,
        backgroundColor: '#fff',

        borderRadius: 18,

        paddingHorizontal: 16,
        height: 58,

        flexDirection: 'row',
        alignItems: 'center',

        gap: 10,
    },

    searchInput: {
        flex: 1,
        fontSize: 16,
    },

    memberCard: {
        backgroundColor: '#fff',

        marginHorizontal: 18,
        marginTop: 16,

        borderRadius: 22,

        padding: 18,

        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,

        elevation: 4,
    },

    memberName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#222',
    },
    memberInfo: {
        marginBottom: 14,
    },

    memberRole: {
        marginTop: 4,
        fontSize: 14,
        color: '#777',
    },

    actionsRow: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'space-between',
    },
    manageBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,

        backgroundColor: '#7B61FF',

        justifyContent: 'center',
        alignItems: 'center',
    },

    statusButton: {
        flex: 1,

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        height: 46,

        borderRadius: 14,
    },

    inactiveBtn: {
        backgroundColor: '#F1ECFF',
    },

    presentBtn: {
        backgroundColor: '#37C978',
    },

    absentBtn: {
        backgroundColor: '#FF5B5B',
    },

    statusText: {
        color: '#878787',
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 4,
    },

    saveButton: {
        marginHorizontal: 18,
        marginBottom: 30,
        marginTop: 10,
    },

    saveGradient: {
        height: 58,
        borderRadius: 18,

        justifyContent: 'center',
        alignItems: 'center',
    },

    saveText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },

    backButton: {
        width: 44,
        height: 44,

        borderRadius: 14,

        backgroundColor: 'rgba(255,255,255,0.18)',

        justifyContent: 'center',
        alignItems: 'center',

        marginTop: 2,
    },
    eventInfoCard: {
        marginHorizontal: wp(4.5),
        marginTop: hp(2),

        backgroundColor: '#FFFFFF',

        borderRadius: wp(5),

        paddingVertical: hp(2),
        paddingHorizontal: wp(4.5),

        flexDirection: 'row',
        alignItems: 'center',

        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,

        elevation: 4,
    },

    eventInfoLabel: {
        fontSize: rf(12),
        color: '#777',
    },

    eventInfoValue: {
        fontSize: rf(16),
        fontWeight: '700',
        color: '#16162E',
        marginTop: hp(0.2),
    },

    eventInfoDate: {
        fontSize: rf(12),
        color: '#5B3DF5',
        marginTop: hp(0.3),
    },

});