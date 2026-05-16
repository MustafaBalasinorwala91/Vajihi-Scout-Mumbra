import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeCard() {
    return (
        <LinearGradient
            colors={['rgba(255,255,255,0.95)', '#F5EDFF']}
            style={styles.card}
        >
            <View style={styles.left}>
                <Text style={styles.greeting}>
                    Good Morning!
                </Text>

                <Text style={styles.name}>
                    Vajihi Admin
                </Text>

                <Text style={styles.description}>
                    Welcome back! Have a productive day ahead.
                </Text>

                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        ADMIN
                    </Text>
                </View>
            </View>

            <Image
                source={require('../../assets/images/app-image.png')}
                style={styles.image}
                resizeMode="contain"
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 20,
        marginTop: -60,
        borderRadius: 30,
        padding: 24,

        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
    },

    left: {
        flex: 1,
    },

    greeting: {
        fontSize: 20,
        color: '#6C4DFF',
        fontWeight: '700',
    },

    name: {
        fontSize: 38,
        fontWeight: '800',
        color: '#16162E',
        marginVertical: 10,
    },

    description: {
        color: '#666',
        fontSize: 15,
        lineHeight: 22,
    },

    badge: {
        backgroundColor: '#FF6B8A',
        alignSelf: 'flex-start',
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 20,
    },

    badgeText: {
        color: '#fff',
        fontWeight: '700',
    },

    image: {
        width: 150,
        height: 150,
    },
});