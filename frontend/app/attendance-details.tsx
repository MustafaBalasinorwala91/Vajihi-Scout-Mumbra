import React, {
    useEffect,
    useState,
} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
export default function AttendanceDetailsScreen() {

    const router = useRouter();
    const { user } = useAuth();

    const { type, date, event_name } =
        useLocalSearchParams();
    const canManageAttendance =
        user?.role === 'admin' ||
        user?.permissions?.attendance;
    const formattedDate =
        new Date(String(date))
            .toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });

    const isAdmin =
        user?.role === 'admin';

    const [records, setRecords] =
        useState<any[]>([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        loadAttendanceDetails();

    }, []);

    const loadAttendanceDetails = async () => {

        try {

            const token = await AsyncStorage.getItem('session_token');
            if (!token) return;

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/attendance/history-details/${type}/${date}?event_name=${encodeURIComponent(
                    String(event_name || '')
                )}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response.json();

            if (Array.isArray(data)) {
                setRecords(data);
            } else {
                setRecords([]);
            }

        } catch (error) {

            console.log(
                'ATTENDANCE DETAILS ERROR:',
                error
            );

        } finally {

            setLoading(false);
        }
    };

    const presentMembers =
        records.filter(
            (r) => r.status === 'present'
        );

    const absentMembers =
        records.filter(
            (r) => r.status === 'absent'
        );

    const deleteSession = () => {

        Alert.alert(
            'Delete Attendance',
            'Delete this entire attendance session?',
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

                            const token = await AsyncStorage.getItem('session_token');
                            if (!token) return;

                            const response = await fetch(
                                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/attendance/session/${type}/${date}?event_name=${encodeURIComponent(
                                    String(event_name || '')
                                )}`,
                                {
                                    method: 'DELETE',
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );
                            const data =
                                await response.json();

                            Alert.alert(
                                'Success',
                                data.message
                            );

                            router.replace(
                                `/attendance-history?type=${type}`
                            );

                        } catch (error) {

                            console.error(error)
                            Alert.alert(
                                'Error',
                                'Unable to delete attendance'
                            );
                        }
                    },
                },
            ]
        );
    };

    return (

        <SafeAreaView
            style={styles.container}
            edges={['top']}
        >

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

                    <View>

                        <Text style={styles.headerTitle}
                            allowFontScaling={false}>
                            Attendance Details
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            {type} • {formattedDate}
                        </Text>

                        {event_name ? (
                            <Text
                                style={{
                                    color: 'rgba(255,255,255,0.8)',
                                    marginTop: 4,
                                    fontSize: 14,
                                }}
                            >
                                {event_name}
                            </Text>
                        ) : null}
                    </View>

                </View>

            </LinearGradient>

            {loading ? (

                <View style={styles.loaderContainer}>
                    <ActivityIndicator
                        size="large"
                        color="#5B3DF5"
                    />
                </View>

            ) : (

                <ScrollView
                    contentContainerStyle={{
                        padding: 20,
                        paddingBottom: 40,
                    }}
                >

                    <View style={styles.sectionCard}>

                        <Text style={styles.sectionTitle}
                            allowFontScaling={false}>
                            Present Members ({presentMembers.length})
                        </Text>

                        {presentMembers.length === 0 ? (

                            <Text
                                style={styles.emptyText}
                                allowFontScaling={false}
                            >
                                No present members found
                            </Text>

                        ) : (

                            presentMembers.map((member, index) => (

                                <View
                                    key={`${member.its_no || member.name}-${index}`}
                                    style={styles.memberRow}
                                >

                                    <View style={styles.presentDot} />

                                    <Text
                                        style={styles.memberName}
                                        numberOfLines={1}
                                        allowFontScaling={false}
                                    >
                                        {member.name}
                                    </Text>

                                </View>

                            ))

                        )}

                    </View>

                    <View style={styles.sectionCard}>

                        <Text style={styles.sectionTitle}
                            allowFontScaling={false}>
                            Absent Members ({absentMembers.length})
                        </Text>

                        {absentMembers.length === 0 ? (

                            <Text
                                style={styles.emptyText}
                                allowFontScaling={false}
                            >
                                No absent members found
                            </Text>

                        ) : (

                            absentMembers.map((member, index) => (

                                <View
                                    key={`${member.its_no || member.name}-${index}`}
                                    style={styles.memberRow}
                                >

                                    <View style={styles.absentDot} />

                                    <Text
                                        style={styles.memberName}
                                        numberOfLines={1}
                                        allowFontScaling={false}
                                    >
                                        {member.name}
                                    </Text>

                                </View>

                            ))

                        )}

                    </View>
                    {canManageAttendance && (

                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() =>
                                router.push({
                                    pathname: '/attendance-members',
                                    params: {
                                        attendanceType: type,
                                        selectedDate: date,
                                        eventName: event_name,
                                        editMode: 'true',
                                    },
                                })
                            }
                        >

                            <Text style={styles.editButtonText}
                                allowFontScaling={false}>
                                Edit Attendance
                            </Text>

                        </TouchableOpacity>

                    )}
                    {isAdmin && (

                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={deleteSession}
                        >

                            <Text style={styles.deleteButtonText}
                                allowFontScaling={false}>
                                Delete Session
                            </Text>

                        </TouchableOpacity>

                    )}
                </ScrollView>

            )}
        </SafeAreaView>

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

    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },

    backButton: {
        width: 44,
        height: 44,

        borderRadius: 14,

        backgroundColor:
            'rgba(255,255,255,0.18)',

        justifyContent: 'center',
        alignItems: 'center',
    },

    headerTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: '#fff',
    },

    headerSubtitle: {
        marginTop: 6,
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
    },

    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    sectionCard: {
        backgroundColor: '#fff',

        borderRadius: 24,

        padding: 20,

        marginBottom: 18,

        elevation: 4,

        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#16162E',

        marginBottom: 16,
    },

    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',

        paddingVertical: 12,
    },

    memberName: {
        flex: 1,
        fontSize: 16,
        color: '#16162E',
        marginLeft: 12,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        paddingVertical: 20,
    },

    presentDot: {
        width: 12,
        height: 12,

        borderRadius: 6,

        backgroundColor: '#37C978',
    },

    absentDot: {
        width: 12,
        height: 12,

        borderRadius: 6,

        backgroundColor: '#FF5B5B',
    },

    editButton: {
        backgroundColor: '#5B3DF5',
        height: 56,
        borderRadius: 18,

        justifyContent: 'center',
        alignItems: 'center',

        marginTop: 20,
    },

    editButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },

    deleteButton: {
        backgroundColor: '#FF5B5B',

        height: 56,

        borderRadius: 18,

        justifyContent: 'center',
        alignItems: 'center',

        marginTop: 14,
    },

    deleteButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },

});