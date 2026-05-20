import React, { useEffect, useState } from 'react';

import {
    View,
    Text,
    FlatList,
    StyleSheet,
    StatusBar,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import axios from 'axios';

export default function NotificationsScreen() {

    const [notifications, setNotifications] = useState<any[]>([]);
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

            setNotifications(response.data);

        } catch (error) {

            console.log(error);
        }
    };

    return (

        <SafeAreaView style={styles.container}>

            <StatusBar
                barStyle="light-content"
            />

            <View style={styles.header}>

                <Text style={styles.headerTitle}>
                    Notifications
                </Text>

                <Text style={styles.headerSubtitle}>
                    Latest attendance updates
                </Text>

            </View>

            <FlatList
                data={notifications}

                keyExtractor={(item) =>
                    item.notification_id.toString()
                }

                showsVerticalScrollIndicator={false}

                contentContainerStyle={{
                    paddingTop: 20,
                    paddingBottom: 40,
                }}

                renderItem={({ item }) => (

                    <View style={styles.card}>

                        <View style={styles.iconContainer}>

                            <Text style={styles.icon}>
                                🔔
                            </Text>

                        </View>

                        <View style={styles.content}>

                            <Text style={styles.cardTitle}>
                                {item.title}
                            </Text>

                            <Text style={styles.message}>
                                {item.message}
                            </Text>

                        </View>

                    </View>
                )}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F4F3F8',
    },

    header: {
        backgroundColor: '#5B3DF5',

        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 30,

        borderBottomLeftRadius: 34,
        borderBottomRightRadius: 34,
    },

    headerTitle: {
        color: '#fff',
        fontSize: 34,
        fontWeight: '800',
    },

    headerSubtitle: {
        color: '#DDD6FF',
        fontSize: 17,
        marginTop: 8,
    },

    card: {
        backgroundColor: '#fff',

        marginHorizontal: 20,
        marginBottom: 18,

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
});