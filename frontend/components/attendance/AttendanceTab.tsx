import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    label: string;
    icon: string;
    active: boolean;
    onPress: () => void;
}

const AttendanceTab = ({
    label,
    icon,
    active,
    onPress,
}: Props) => {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={styles.wrapper}
        >
            <LinearGradient
                colors={
                    active
                        ? ['#7B4DFF', '#5B3DF5']
                        : ['transparent', 'transparent']
                }
                style={styles.container}
            >
                <Ionicons
                    name={icon as any}
                    size={18}
                    color="#fff"
                />

                <Text style={styles.label}>
                    {label}
                </Text>
            </LinearGradient>
        </TouchableOpacity>
    );
};

export default AttendanceTab;

const styles = StyleSheet.create({
    wrapper: {
        marginRight: 12,
    },

    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 52,
        borderRadius: 20,
    },

    label: {
        color: '#fff',
        marginLeft: 8,
        fontWeight: '700',
        fontSize: 14,
    },
});