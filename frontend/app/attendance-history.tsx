import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    StatusBar,
    RefreshControl,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
export default function AttendanceHistoryScreen() {

    const [history, setHistory] = useState<any[]>([]);
    const [refreshing, setRefreshing] =
        useState(false);
    const router = useRouter();
    const { user } = useAuth();

    const canManageAttendance =
        user?.permissions?.attendance;
    const { type } = useLocalSearchParams();

    useEffect(() => {

        if (type) {

            loadHistory();

        }

    }, [type, canManageAttendance]);
    const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

    const loadHistory = async () => {

        try {

            const endpoint =
                canManageAttendance
                    ? `${BACKEND_URL}/api/attendance/history/${type}`
                    : `${BACKEND_URL}/api/attendance/my-history/${type}`;

            const response = await axios.get(
                endpoint,
                {
                    withCredentials: true,
                }
            );

            setHistory(response.data);

        } catch (error) {

            console.error(error);

        }
    };

    const onRefresh = async () => {

        setRefreshing(true);

        await loadHistory();

        setRefreshing(false);
    };

    return (

        <View style={styles.container}>

            <StatusBar
                barStyle="light-content"
            />

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

                        <Text style={styles.headerTitle}>
                            Attendance History
                        </Text>

                        <Text style={styles.headerSubtitle}>

                            {canManageAttendance
                                ? 'View all saved attendance records'
                                : 'View your attendance records'}

                        </Text>

                    </View>

                </View>

            </LinearGradient>

            <FlatList
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#5B3DF5']}
                        tintColor="#5B3DF5"
                    />
                }
                data={history}

                keyExtractor={(item) => item.date}

                contentContainerStyle={{
                    paddingTop: 22,
                    paddingBottom: 40,
                }}

                showsVerticalScrollIndicator={false}

                renderItem={({ item }) => (

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.card}
                        onPress={() =>
                            router.push({
                                pathname: '/attendance-details',
                                params: {
                                    type: item.attendance_type,
                                    date: item.date,
                                },
                            })
                        }
                    >

                        <View style={styles.topRow}>

                            <Text style={styles.date}>
                                {item.date}
                            </Text>

                            <View style={styles.typeBadge}>

                                <Text style={styles.typeText}>
                                    {item.attendance_type}
                                </Text>

                            </View>

                        </View>

                        <View style={styles.statsRow}>

                            <View style={styles.statBox}>

                                <View
                                    style={[
                                        styles.dot,
                                        {
                                            backgroundColor: '#37C978',
                                        },
                                    ]}
                                />

                                <Text style={styles.present}>
                                    Present: {item.present}
                                </Text>

                            </View>

                            <View style={styles.statBox}>

                                <View
                                    style={[
                                        styles.dot,
                                        {
                                            backgroundColor: '#FF5B5B',
                                        },
                                    ]}
                                />

                                <Text style={styles.absent}>
                                    Absent: {item.absent}
                                </Text>

                            </View>

                        </View>

                    </TouchableOpacity>
                )}
            />

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        flex: 1,
        backgroundColor: '#F5F5F5',

        marginTop: -20,

        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
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

    headerTextWrapper: {
        flex: 1,
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

    backButton: {
        width: 44,
        height: 44,

        borderRadius: 14,

        backgroundColor: 'rgba(255,255,255,0.18)',

        justifyContent: 'center',
        alignItems: 'center',

        marginTop: 2,
    },

    card: {
        backgroundColor: '#fff',

        marginHorizontal: 20,
        marginBottom: 18,

        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#F3F0FF',

        padding: 22,

        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,

        elevation: 4,
    },

    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    date: {
        fontSize: 22,
        fontWeight: '800',
        color: '#16162E',
    },

    typeBadge: {
        backgroundColor: '#EEE9FF',

        paddingHorizontal: 14,
        paddingVertical: 8,

        borderRadius: 16,
    },

    typeText: {
        color: '#5B3DF5',
        fontWeight: '700',
        textTransform: 'capitalize',
    },

    statsRow: {
        marginTop: 26,
        gap: 14,
    },

    statBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    dot: {
        width: 12,
        height: 12,
        borderRadius: 20,
        marginRight: 10,
    },

    present: {
        color: '#37C978',
        fontSize: 17,
        fontWeight: '700',
    },

    absent: {
        color: '#FF5B5B',
        fontSize: 17,
        fontWeight: '700',
    },
});