import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const ReminderCard = () => {
    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <View style={styles.iconBox}>
                    <Ionicons
                        name="notifications"
                        size={26}
                        color="#6C4DFF"
                    />
                </View>

                <View>
                    <Text style={styles.title}>
                        Reminder
                    </Text>

                    <Text style={styles.subtitle}>
                        Don't forget to mark attendance!
                    </Text>
                </View>
            </View>

            <Switch value />
        </View>
    );
};

export default ReminderCard;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 20,
        marginTop: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 5,
    },

    left: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F1ECFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },

    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#6C4DFF',
    },

    subtitle: {
        marginTop: 6,
        color: '#666',
        fontSize: 14,
        maxWidth: 220,
    },
});