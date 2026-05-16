import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import {
    View,
    Text,
    FlatList,
    StyleSheet,
    StatusBar,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import axios from 'axios';

export default function AttendanceHistoryScreen() {

    const [history, setHistory] = useState<any[]>([]);

    const { type } = useLocalSearchParams();

    useEffect(() => {

        if (type) {

            loadHistory();

        }

    }, [type]);

    const loadHistory = async () => {

        try {

            const response = await axios.get(
                `http://192.168.0.110:8001/api/attendance/history/${type}`,
                {
                    withCredentials: true,
                }
            );

            setHistory(response.data);

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
                    Attendance History
                </Text>

                <Text style={styles.headerSubtitle}>
                    View all saved attendance records
                </Text>

            </View>

            <FlatList
                data={history}

                keyExtractor={(item) => item.date}

                contentContainerStyle={{
                    paddingTop: 20,
                    paddingBottom: 40,
                }}

                showsVerticalScrollIndicator={false}

                renderItem={({ item }) => (

                    <View style={styles.card}>

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