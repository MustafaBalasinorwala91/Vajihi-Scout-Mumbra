import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

interface Props {
    icon: string;
    value: string;
    label: string;
    color: string;
}

const AttendanceCard = ({
    icon,
    value,
    label,
    color,
}: Props) => {
    return (
        <View style={styles.card}>
            <View
                style={[
                    styles.iconBox,
                    { backgroundColor: color },
                ]}
            >
                <Ionicons
                    name={icon as any}
                    size={22}
                    color="#fff"
                />
            </View>

            <Text style={styles.value}>
                {value}
            </Text>

            <Text style={styles.label}>
                {label}
            </Text>
        </View>
    );
};

export default AttendanceCard;

const styles = StyleSheet.create({

    card: {
        width: 150,

        backgroundColor: '#fff',

        borderRadius: 24,

        paddingVertical: 20,
        paddingHorizontal: 16,

        marginRight: 14,

        elevation: 5,

        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },

    iconBox: {
        width: 58,
        height: 58,

        borderRadius: 29,

        justifyContent: 'center',
        alignItems: 'center',

        marginBottom: 16,
    },

    value: {
        fontSize: 28,
        fontWeight: '800',
        color: '#16162E',
    },

    label: {
        marginTop: 8,

        fontSize: 16,
        fontWeight: '500',

        color: '#666',
    },

});