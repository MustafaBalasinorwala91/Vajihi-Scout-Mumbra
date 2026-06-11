import { wp, hp } from '../utils/responsive';
import { rf } from '../utils/fonts';
import React, { useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    StatusBar,
    RefreshControl,
} from 'react-native';

import api from '../services/api';
import { useRouter } from 'expo-router';
export default function NotificationsScreen() {

    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [refreshing, setRefreshing] =
        useState(false);
    const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

    useEffect(() => {

        loadNotifications();

        markAllRead();

    }, []);
    const loadNotifications = async () => {

        try {

            setLoading(true);

            const token =
                await AsyncStorage.getItem(
                    'session_token'
                );
            if (!token) return;

            const response = await api.get(
                `${BACKEND_URL}/api/notifications/my`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const sortedNotifications =
                response.data.sort(
                    (a: any, b: any) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                );

            setNotifications(sortedNotifications);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }
    };
    const onRefresh = async () => {

        setRefreshing(true);

        await loadNotifications();

        setRefreshing(false);
    };
    const markAllRead = async () => {

        try {

            const token =
                await AsyncStorage.getItem(
                    'session_token'
                );
            if (!token) return;

            await api.put(
                `${BACKEND_URL}/api/notifications/read-all`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

        } catch (error) {

            console.error(error);

        }
    };
    if (loading) {

        return (

            <View style={styles.container}>

                <StatusBar barStyle="light-content" />

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
                                Notifications
                            </Text>

                            <Text style={styles.headerSubtitle}>
                                Latest updates and notifications
                            </Text>
                        </View>

                    </View>
                </LinearGradient>

                <View style={styles.loadingContainer}>
                    <Ionicons
                        name="notifications"
                        size={40}
                        color="#5B3DF5"
                    />
                </View>

            </View>

        );
    }

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
                            Notifications
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            Latest updates and notifications
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
                data={notifications}

                keyExtractor={(item) =>
                    item.notification_id.toString()
                }

                showsVerticalScrollIndicator={false}

                contentContainerStyle={{
                    paddingTop: 20,
                    paddingBottom: 40,
                }}
                ListEmptyComponent={
                    <View style={styles.emptyWrapper}>

                        <Ionicons
                            name="notifications-off-outline"
                            size={70}
                            color="#C7C7C7"
                        />

                        <Text style={styles.emptyTitle}>
                            No Notifications Yet
                        </Text>

                        <Text style={styles.emptySubtext}>
                            Organization updates will appear here
                        </Text>

                    </View>
                }

                renderItem={({ item }) => {

                    return (

                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.card}
                        >
                            <View style={styles.iconContainer}>

                                <Text style={styles.icon}>

                                    {
                                        item.title?.includes('Attendance')
                                            ? '📅'

                                            : item.title?.includes('Fee')
                                                ? '💰'

                                                : item.title?.includes('Permission')
                                                    ? '🛡'

                                                    : item.title?.includes('Profile')
                                                        ? '👤'

                                                        : '🔔'
                                    }

                                </Text>
                            </View>

                            <View style={styles.content}>

                                <Text style={styles.cardTitle}>
                                    {item.title}
                                </Text>

                                <Text style={styles.message}>
                                    {item.message}
                                </Text>
                                <Text style={styles.timeText}>
                                    {new Date(item.created_at).toLocaleString('en-IN', {
                                        timeZone: 'Asia/Kolkata',
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true,
                                    })}
                                </Text>
                            </View>

                        </TouchableOpacity>
                    )
                }
                }

            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },

    header: {
        paddingTop: hp(8),
        paddingBottom: hp(3.5),
        paddingHorizontal: wp(6),

        borderBottomLeftRadius: wp(8),
        borderBottomRightRadius: wp(8),
    },

    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    headerTextWrapper: {
        flex: 1,
        marginLeft: wp(4),
    },

    headerTitle: {
        fontSize: rf(26),
        fontWeight: '800',
        color: '#fff',
    },

    headerSubtitle: {
        marginTop: hp(0.5),
        fontSize: rf(14),
        color: 'rgba(255,255,255,0.8)',
    },

    backButton: {
        width: wp(11),
        height: wp(11),

        borderRadius: wp(3.5),

        backgroundColor: 'rgba(255,255,255,0.18)',

        justifyContent: 'center',
        alignItems: 'center',
    },

    card: {
        backgroundColor: '#fff',

        overflow: 'hidden',

        marginHorizontal: wp(5),
        marginBottom: hp(2),

        borderWidth: 1,
        borderColor: '#F1ECFF',

        borderRadius: wp(7),

        padding: wp(5),

        flexDirection: 'row',
        alignItems: 'flex-start',

        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,

        elevation: 4,
    },

    iconContainer: {
        width: wp(14),
        height: wp(14),

        borderRadius: wp(5),

        backgroundColor: '#EEE9FF',

        justifyContent: 'center',
        alignItems: 'center',

        marginRight: wp(4),
    },

    icon: {
        fontSize: rf(20),
    },

    content: {
        flex: 1,
    },

    emptyWrapper: {
        marginTop: hp(12),
        paddingHorizontal: wp(8),
        alignItems: 'center',
    },

    emptyTitle: {
        marginTop: hp(2),
        fontSize: rf(18),
        fontWeight: '700',
        color: '#444',
        textAlign: 'center',
    },

    emptySubtext: {
        marginTop: hp(1),
        fontSize: rf(13),
        textAlign: 'center',
        color: '#888',
    },

    cardTitle: {
        fontSize: rf(16),
        fontWeight: '800',
        color: '#16162E',
    },

    message: {
        marginTop: hp(1),

        color: '#666',

        fontSize: rf(14),
        lineHeight: rf(20),

        flexShrink: 1,
    },

    timeText: {
        marginTop: hp(1),
        fontSize: rf(11),
        color: '#999',
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});