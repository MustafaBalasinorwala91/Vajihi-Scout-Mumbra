import { wp, hp } from '../../utils/responsive';
import { rf } from '../../utils/fonts';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

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
    const { theme } = useTheme();
    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                },
            ]}
        >
            <View
                style={[
                    styles.iconBox,
                    { backgroundColor: color },
                ]}
            >
                <Ionicons
                    name={icon as any}
                    size={rf(22)}
                    color="#fff"
                />
            </View>

            <Text style={[styles.value, { color: theme.title }]}>
                {value}
            </Text>

            <Text style={[styles.label, { color: theme.subtitle }]}>
                {label}
            </Text>
        </View>
    );
};

export default AttendanceCard;

const styles = StyleSheet.create({

    card: {
        width: wp('38%'),

        backgroundColor: '#fff',

        borderRadius: wp('6%'),

        borderWidth: 1,

        paddingVertical: hp('2.2%'),
        paddingHorizontal: wp('4%'),

        marginRight: wp('3.5%'),

        elevation: 5,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: hp('0.5%'),
        },
        shadowOpacity: 0.08,
        shadowRadius: wp('3%'),
    },

    iconBox: {
        width: wp('15%'),
        height: wp('15%'),

        borderRadius: wp('7.5%'),

        justifyContent: 'center',
        alignItems: 'center',

        marginBottom: hp('2%'),
    },

    value: {
        fontSize: rf(28),
        fontWeight: '800',
        color: '#16162E',
    },

    label: {
        marginTop: hp('1%'),

        fontSize: rf(15),
        fontWeight: '500',

        color: '#666',
    },

});