import React, {
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

    const {
        attendanceType,
        selectedDate,
        editMode,
    } = useLocalSearchParams();

    // FETCH MEMBERS
    const loadExistingAttendance = async () => {

        try {

            const response = await fetch(
                `${BACKEND_URL}/api/attendance/history-details/${attendanceType}/${selectedDate}`
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

            const response = await fetch(
                `${BACKEND_URL}/api/attendance/members`,
                {
                    credentials: 'include',
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

        fetchMembers();

        if (editMode === 'true') {

            loadExistingAttendance();

        }

    }, []);

    // SEARCH
    useEffect(() => {

        const filtered = members.filter(
            (member) =>
                member.name
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

            const records =
                filteredMembers
                    .filter(
                        (member) =>
                            attendanceMap[
                            member.user_id
                            ]
                    )
                    .map((member) => ({
                        user_id: member.user_id,

                        status:
                            attendanceMap[
                            member.user_id
                            ],
                    }));
            if (records.length === 0) {

                Alert.alert(
                    'No Attendance Marked',
                    'Please mark at least one member.'
                );

                return;
            }

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
                        attendance_type:
                            attendanceType,

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
                            {attendanceType}
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

                    filteredMembers.map(
                        (member: any) => (

                            <View
                                key={member.user_id}
                                style={styles.memberCard}
                            >

                                <View>

                                    <Text style={styles.memberName}>
                                        {member.name}
                                    </Text>

                                    <Text style={styles.memberRole}>
                                        {`${member.role || 'Member'} • ${member.instrument || 'No Instrument'}`}
                                    </Text>

                                </View>

                                <View style={styles.actionsRow}>

                                    {/* SETTINGS */}


                                    {/* PRESENT */}
                                    <View style={styles.actionsRow}>

                                        <TouchableOpacity

                                            disabled={!canManageAttendance}

                                            style={[
                                                styles.statusButton,

                                                attendanceMap[
                                                    member.user_id
                                                ] === 'present'
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

                                            <Text style={styles.statusText}>
                                                Present
                                            </Text>

                                        </TouchableOpacity>

                                        <TouchableOpacity

                                            disabled={!canManageAttendance}

                                            style={[
                                                styles.statusButton,

                                                attendanceMap[
                                                    member.user_id
                                                ] === 'absent'
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

                                            <Text style={styles.statusText}>
                                                Absent
                                            </Text>

                                        </TouchableOpacity>

                                    </View>
                                </View>

                            </View>
                        )
                    )
                )}
                <TouchableOpacity

                    disabled={!canManageAttendance || saving}

                    style={[
                        styles.saveButton,

                        (!canManageAttendance || saving) && {
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
                            canManageAttendance
                                ? ['#6C4DFF', '#5B3DF5']
                                : ['#A8A8A8', '#8E8E8E']
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

            </ScrollView>

            {/* SAVE BUTTON */}
        </View>
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

        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

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

    memberRole: {
        marginTop: 4,
        fontSize: 14,
        color: '#777',
    },

    actionsRow: {
        flexDirection: 'row',
        gap: 8,
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

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        height: 42,

        paddingHorizontal: 14,

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

});