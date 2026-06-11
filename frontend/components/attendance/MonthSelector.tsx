import { wp, hp } from '../../utils/responsive';
import { rf } from '../../utils/fonts';
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
                    size={rf(20)}
                    color="#fff"
                />
            </TouchableOpacity>

            <View style={styles.center}>
                <Ionicons
                    name="calendar"
                    size={rf(20)}
                    color="#5B3DF5"
                />

                <Text style={styles.month}
                    numberOfLines={1}>
                    May 2026
                </Text>
            </View>

            <TouchableOpacity style={styles.button}>
                <Ionicons
                    name="chevron-forward"
                    size={rf(20)}
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

        borderRadius: wp('7%'),

        paddingHorizontal: wp('4.5%'),

        minHeight: hp('10%'),

        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        elevation: 6,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: hp('0.5%'),
        },
        shadowOpacity: 0.08,
        shadowRadius: wp('3.5%'),
    },

    center: {
        flexDirection: 'row',
        alignItems: 'center',

        flex: 1,
        justifyContent: 'center',

        paddingHorizontal: wp('2%'),
    },

    button: {
        width: wp('12%'),
        height: wp('12%'),

        borderRadius: wp('6%'),

        backgroundColor: '#5B3DF5',

        justifyContent: 'center',
        alignItems: 'center',
    },

    month: {
        fontSize: rf(20),

        fontWeight: '800',

        marginLeft: wp('3%'),

        color: '#16162E',
    },

});