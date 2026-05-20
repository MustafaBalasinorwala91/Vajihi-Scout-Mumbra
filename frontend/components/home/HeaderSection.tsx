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
        paddingTop: 70,
        paddingBottom: 140,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        position: 'relative',
        overflow: 'hidden',
    },

    topBar: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 30,
        zIndex: 5,
    },

    homeTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
    },

    bandOverlay: {
        position: 'absolute',
        width: '120%',
        height: 270,
        top: 180,
        opacity: 0.35,
    },

    logo: {
        width: 110,
        height: 110,
        marginBottom: 40,
        zIndex: 5,
    },

    title: {
        color: '#FFD76A',
        fontSize: 33,
        top: 65,
        fontWeight: '800',
        textAlign: 'center',
        zIndex: 5,
    },

    subtitle: {
        color: '#F5EFFF',
        fontSize: 17,
        top: 60,
        marginTop: 7,
        zIndex: 2,
    },

    wave: {
        position: 'absolute',
        bottom: -35,
        width: '120%',
        height: 90,
        backgroundColor: '#F5F5F5',
        borderTopLeftRadius: 100,
        borderTopRightRadius: 100,
    },
});