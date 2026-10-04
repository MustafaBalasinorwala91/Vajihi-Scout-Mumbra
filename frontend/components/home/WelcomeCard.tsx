import { wp, hp } from '../../utils/responsive';
import { rf } from '../../utils/fonts';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

export default function WelcomeCard() {
    const { darkMode, theme } = useTheme();

    return (
        <LinearGradient
            colors={
                darkMode
                    ? ['rgba(27,27,39,0.96)', '#24203A']
                    : ['rgba(255,255,255,0.95)', '#F5EDFF']
            }
            style={styles.card}
        >
            <View style={styles.left}>
                <Text style={styles.greeting}>
                    Good Morning!
                </Text>

                <Text style={[styles.name, { color: theme.title }]}>
                    Members
                </Text>

                <Text style={[styles.description, { color: theme.subtitle }]}>
                    Welcome back! Have a productive day ahead.
                </Text>

                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        BY VAJIHI
                    </Text>
                </View>
            </View>

            <Image
                source={require('../../assets/images/welcome-image.png')}
                style={styles.image}
                resizeMode="cover"
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: wp('4%'),
        marginTop: -hp('3%'),

        borderRadius: wp('8%'),

        padding: wp('4%'),

        height: hp('22%'),

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',

        overflow: 'hidden',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
    },

    image: {
        position: 'absolute',
        right: 0,
        top: 0,

        width: wp('100%'),
        height: '120%',
    },

    left: {
        flex: 1,
        paddingRight: wp('38%'),
        zIndex: 2,
    },

    greeting: {
        fontSize: rf(20),
        color: '#6C4DFF',
        fontWeight: '700',
    },

    name: {
        fontSize: rf(25),
        fontWeight: '800',
        color: '#16162E',

        marginVertical: hp('0.5%'),
    },

    description: {
        color: '#0b0b0b',
        fontSize: rf(13),
        lineHeight: rf(20),
    },

    badge: {
        backgroundColor: '#FF6B8A',

        alignSelf: 'flex-start',

        paddingHorizontal: wp('4.5%'),
        paddingVertical: hp('0.8%'),

        borderRadius: wp('5%'),

        marginTop: hp('2%'),
    },

    badgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: rf(13),
    },

});