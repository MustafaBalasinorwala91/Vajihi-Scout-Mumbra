import { wp, hp } from '../../utils/responsive';
import { rf } from '../../utils/fonts';
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
                    size={rf(20)}
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
        width: wp('38%'),

        backgroundColor: '#fff',

        borderRadius: wp('7%'),

        padding: wp('5.5%'),

        marginRight: wp('4%'),

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: hp('0.8%'),
        },
        shadowOpacity: 0.08,
        shadowRadius: wp('2.5%'),
        elevation: 5,
    },

    iconContainer: {
        width: wp('13%'),
        height: wp('13%'),
        borderRadius: wp('6.5%'),

        justifyContent: 'center',
        alignItems: 'center',

        marginBottom: hp('2%'),
    },

    value: {
        fontSize: rf(28),
        fontWeight: '800',
        color: '#16162E',
    },

    title: {
        fontSize: rf(14),
        fontWeight: '700',
        color: '#16162E',

        marginTop: hp('1%'),
    },

    subtitle: {
        color: '#777',

        fontSize: rf(11),

        marginTop: hp('0.5%'),
    },
});