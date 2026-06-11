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
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function AttendanceHistoryScreen() {

    const [history, setHistory] = useState<any[]>([]);
    const [refreshing, setRefreshing] =
        useState(false);
    const router = useRouter();
    const { user } = useAuth();
    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString(
            'en-IN',
            {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }
        );

    const canManageAttendance =
        user?.role === 'admin' ||
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
                `${BACKEND_URL}/api/attendance/history/${type}`;
            const response = await api.get(
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
    const handleExport = async () => {
        try {

            const token =
                await AsyncStorage.getItem(
                    'session_token'
                );

            if (!token) {
                alert('Please login again');
                return;
            }

            const fileUri =
                `${FileSystem.documentDirectory}attendance_${type}.xlsx`;

            const downloadResumable =
                FileSystem.createDownloadResumable(
                    `${BACKEND_URL}/api/attendance/export?attendance_type=${type}`,
                    fileUri,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            const result =
                await downloadResumable.downloadAsync();

            if (result?.uri) {
                await Sharing.shareAsync(
                    result.uri
                );
            }

        } catch (error) {

            console.log(
                'Export error:',
                error
            );

            alert(
                'Failed to export attendance'
            );
        }
    };

    const onRefresh = async () => {

        setRefreshing(true);

        await loadHistory();

        setRefreshing(false);
    };

    return (
        <SafeAreaView
            style={styles.container}
            edges={['top']}
        >

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
                        <Text
                            style={styles.headerTitle}
                            allowFontScaling={false}
                        >
                            Attendance History
                        </Text>

                        <Text
                            style={styles.headerSubtitle}
                            allowFontScaling={false}
                        >
                            {canManageAttendance
                                ? 'View all saved attendance records'
                                : 'View your attendance records'}
                        </Text>
                    </View>

                    {canManageAttendance && (
                        <TouchableOpacity
                            style={styles.exportButton}
                            onPress={handleExport}
                        >
                            <Ionicons
                                name="download-outline"
                                size={22}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    )}

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
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="calendar-outline"
                            size={70}
                            color="#C7C7C7"
                        />

                        <Text style={styles.emptyTitle}>
                            No Attendance History
                        </Text>

                        <Text style={styles.emptySubtitle}>
                            No attendance records found.
                        </Text>
                    </View>
                }

                keyExtractor={(item) =>
                    `${item.attendance_type}-${item.date}-${item.event_name || "default"}`
                }

                contentContainerStyle={{
                    flexGrow: 1,
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
                                    event_name: item.event_name || '',
                                },
                            })
                        }
                    >

                        <View style={styles.topRow}>

                            <View>
                                <Text style={styles.date}>
                                    {formatDate(item.date)}
                                </Text>

                                {item.event_name ? (
                                    <Text
                                        style={{
                                            marginTop: 4,
                                            color: '#666',
                                            fontSize: 14,
                                        }}
                                    >
                                        {item.event_name}
                                    </Text>
                                ) : null}
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={styles.typeBadge}>
                                    <Text style={styles.typeText}
                                        allowFontScaling={false}>
                                        {item.attendance_type}
                                    </Text>
                                </View>

                                <Ionicons
                                    name="chevron-forward"
                                    size={22}
                                    color="#B0B0B0"
                                    style={{ marginLeft: 8 }}
                                />
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

                                <Text style={styles.present}
                                    allowFontScaling={false}>
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

                                <Text style={styles.absent}
                                    allowFontScaling={false}>
                                    Absent: {item.absent}
                                </Text>

                            </View>

                        </View>

                    </TouchableOpacity>
                )
                }
            />

        </SafeAreaView >
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
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#16162E',
        marginTop: 12,
    },

    emptySubtitle: {
        color: '#777',
        marginTop: 6,
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
    exportButton: {
        width: 44,
        height: 44,

        borderRadius: 14,

        backgroundColor: 'rgba(255,255,255,0.18)',

        justifyContent: 'center',
        alignItems: 'center',

        marginLeft: 12,
    },
});