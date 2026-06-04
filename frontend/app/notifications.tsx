import React, { useEffect, useState } from 'react';
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

import axios from 'axios';
import { useRouter } from 'expo-router';
export default function NotificationsScreen() {

    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [refreshing, setRefreshing] =
        useState(false);
    const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

    useEffect(() => {

        loadNotifications();

    }, []);
    const loadNotifications = async () => {

        try {

            const response = await axios.get(
                `${BACKEND_URL}/api/notifications/my`,
                {
                    withCredentials: true,
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
        }
    };
    const onRefresh = async () => {

        setRefreshing(true);

        await loadNotifications();

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

                renderItem={({ item }) => (

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
                                {new Date(item.created_at).toLocaleDateString()}
                                {' • '}
                                {new Date(item.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </Text>

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
        transform: [{ scale: 1 }],
        overflow: 'hidden',
        marginHorizontal: 20,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#F1ECFF',

        borderRadius: 28,

        padding: 20,

        flexDirection: 'row',
        alignItems: 'flex-start',

        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,

        elevation: 4,
    },

    iconContainer: {
        width: 56,
        height: 56,

        borderRadius: 20,

        backgroundColor: '#EEE9FF',

        justifyContent: 'center',
        alignItems: 'center',

        marginRight: 16,
    },

    icon: {
        fontSize: 24,
    },

    content: {
        flex: 1,
    },
    emptyWrapper: {
        marginTop: 120,
        paddingHorizontal: 30,
        alignItems: 'center',
    },

    emptyTitle: {
        marginTop: 18,
        fontSize: 20,
        fontWeight: '700',
        color: '#444',
    },

    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
        color: '#888',
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#16162E',
    },

    message: {
        marginTop: 8,

        color: '#666',

        lineHeight: 24,
        fontSize: 15,
    },
    timeText: {
        marginTop: 8,
        fontSize: 12,
        color: '#999',
    },
});