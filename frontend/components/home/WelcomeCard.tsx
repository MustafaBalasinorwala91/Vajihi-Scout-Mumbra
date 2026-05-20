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
                    Member
                </Text>

                <Text style={styles.description}>
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
        marginHorizontal: 16,
        marginTop: -30,
        borderRadius: 40,
        padding: 12,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
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
        paddingRight: 120,
        zIndex: 2,
    },

    greeting: {
        fontSize: 20,
        color: '#6C4DFF',
        fontWeight: '700',
    },

    name: {
        fontSize: 34,
        fontWeight: '800',
        color: '#16162E',
        marginVertical: 5,
    },

    description: {
        color: '#666',
        fontSize: 17,
        lineHeight: 20,
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
        position: 'absolute',
        right: -4,
        bottom: 10,
        top: 0,

        width: 435,
        height: 210,

        opacity: 0.98,

        borderTopRightRadius: 35,
        borderBottomRightRadius: 40,
    },

});