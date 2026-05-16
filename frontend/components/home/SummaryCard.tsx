import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

export default function SummaryCard({
    icon,
    value,
    title,
    subtitle,
    color,
}: any) {
    return (
        <View style={styles.card}>
            <View
                style={[
                    styles.iconContainer,
                    { backgroundColor: color },
                ]}
            >
                <Ionicons
                    name={icon}
                    size={24}
                    color="#fff"
                />
            </View>

            <Text style={styles.value}>
                {value}
            </Text>

            <Text style={styles.title}>
                {title}
            </Text>

            <Text style={styles.subtitle}>
                {subtitle}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: 150,
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 22,
        marginRight: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5,
    },

    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,

        justifyContent: 'center',
        alignItems: 'center',

        marginBottom: 18,
    },

    value: {
        fontSize: 34,
        fontWeight: '800',
        color: '#16162E',
    },

    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#16162E',
        marginTop: 10,
    },

    subtitle: {
        color: '#777',
        marginTop: 4,
    },
});