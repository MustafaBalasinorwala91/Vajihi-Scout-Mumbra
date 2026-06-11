import { wp, hp } from '../../utils/responsive';
import { rf } from '../../utils/fonts';
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
                    size={rf(18)}
                    color="#fff"
                />

                <Text style={styles.label}
                    numberOfLines={1}>
                    {label}
                </Text>
            </LinearGradient>
        </TouchableOpacity>
    );
};

export default AttendanceTab;

const styles = StyleSheet.create({

    wrapper: {
        marginRight: wp('3%'),
    },

    container: {
        flexDirection: 'row',
        alignItems: 'center',

        paddingHorizontal: wp('5%'),

        minHeight: hp('6%'),

        borderRadius: wp('5%'),
    },

    label: {
        color: '#fff',

        marginLeft: wp('2%'),

        fontWeight: '700',

        fontSize: rf(14),
    },

});