import { wp, hp } from '../../utils/responsive';
import { rf } from '../../utils/fonts';
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
                        size={rf(24)}
                        color="#6C4DFF"
                    />
                </View>

                <View style={{ flex: 1 }}>
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

        borderRadius: wp('7%'),

        padding: wp('5%'),

        marginTop: hp('3%'),

        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        elevation: 5,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: hp('0.5%'),
        },
        shadowOpacity: 0.08,
        shadowRadius: wp('3%'),
    },

    left: {
        flexDirection: 'row',
        alignItems: 'center',

        flex: 1,

        marginRight: wp('3%'),
    },

    iconBox: {
        width: wp('16%'),
        height: wp('16%'),

        borderRadius: wp('8%'),

        backgroundColor: '#F1ECFF',

        justifyContent: 'center',
        alignItems: 'center',

        marginRight: wp('4%'),
    },

    title: {
        fontSize: rf(17),
        fontWeight: '800',
        color: '#6C4DFF',
    },

    subtitle: {
        marginTop: hp('0.5%'),

        color: '#666',

        fontSize: rf(13),

        flexShrink: 1,
    },

});