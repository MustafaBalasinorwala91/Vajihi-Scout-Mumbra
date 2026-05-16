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
        paddingBottom: 110,
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
    },

    homeTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
    },

    logo: {
        width: 70,
        height: 70,
        marginBottom: 16,
    },

    title: {
        color: '#FFD76A',
        fontSize: 34,
        fontWeight: '800',
    },

    subtitle: {
        color: '#F5EFFF',
        fontSize: 17,
        marginTop: 10,
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