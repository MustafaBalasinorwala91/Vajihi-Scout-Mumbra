import { wp, hp } from '../../utils/responsive';
import { rf } from '../../utils/fonts';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import NotificationBell from '../../components/common/NotificationBell';

export default function HeaderSection() {
    return (
        <LinearGradient
            colors={['#2B145A', '#5B3DF5']}
            style={styles.header}
        >
            <View style={styles.topBar}>

                <Text style={styles.homeTitle}>
                    Home
                </Text>

                <NotificationBell />

            </View>

            <Image
                source={require('../../assets/images/band-overlay.png')}
                style={styles.bandOverlay}
                resizeMode="cover"
            />
            {/* Logo */}
            <Image
                source={require('../../assets/logo/vajihi-scout-logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />

            <Text style={styles.title}>
                Vajihi Scout Mumbra
            </Text>

            <Text style={styles.subtitle}>
                BGMM - Long Live His Holiness
            </Text>

            <View style={styles.wave} />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: hp('8%'),
        paddingBottom: hp('10%'),
        minHeight: hp('42%'),

        alignItems: 'center',

        borderBottomLeftRadius: wp('10%'),
        borderBottomRightRadius: wp('10%'),

        position: 'relative',
        overflow: 'visible',
    },

    topBar: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        paddingHorizontal: wp('6%'),
        marginBottom: hp('3%'),

        zIndex: 5,
    },

    homeTitle: {
        color: '#fff',
        fontSize: rf(28),
        fontWeight: '800',
    },

    bandOverlay: {
        position: 'absolute',

        width: '120%',
        height: hp('32%'),

        top: hp('16%'),

        opacity: 0.55,
    },

    logo: {
        width: wp('25%'),
        height: wp('25%'),
        top: hp('-1%'),

        maxWidth: 120,
        maxHeight: 120,

        marginBottom: hp('3%'),

        zIndex: 5,
    },

    title: {
        color: '#FFD76A',

        fontSize: rf(30),
        fontWeight: '800',

        textAlign: 'center',
        marginTop: hp('2%'),

        width: '100%',
        paddingHorizontal: wp('3%'),

        zIndex: 5,
    },

    subtitle: {
        color: '#F5EFFF',

        fontSize: rf(16),

        textAlign: 'center',

        width: '100%',
        paddingHorizontal: wp('3%'),

        marginTop: hp('0.7%'),

        zIndex: 5,
    },

    wave: {
        position: 'absolute',

        bottom: -hp('4%'),

        width: '120%',

        height: hp('10%'),

        backgroundColor: '#F5F5F5',

        borderTopLeftRadius: wp('25%'),
        borderTopRightRadius: wp('25%'),
    },
});