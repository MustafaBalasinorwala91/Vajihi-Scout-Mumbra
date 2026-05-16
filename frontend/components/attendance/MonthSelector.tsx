import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const MonthSelector = () => {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button}>
                <Ionicons
                    name="chevron-back"
                    size={22}
                    color="#fff"
                />
            </TouchableOpacity>

            <View style={styles.center}>
                <Ionicons
                    name="calendar"
                    size={22}
                    color="#5B3DF5"
                />

                <Text style={styles.month}>
                    May 2026
                </Text>
            </View>

            <TouchableOpacity style={styles.button}>
                <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#fff"
                />
            </TouchableOpacity>
        </View>
    );
};

export default MonthSelector;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 28,
        paddingHorizontal: 18,
        height: 88,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 14,
    },

    center: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    button: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#5B3DF5',
        justifyContent: 'center',
        alignItems: 'center',
    },

    month: {
        fontSize: 22,
        fontWeight: '800',
        marginLeft: 12,
        color: '#16162E',
    },
});