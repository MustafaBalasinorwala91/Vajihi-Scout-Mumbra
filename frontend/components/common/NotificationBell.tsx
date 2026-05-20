import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    TouchableOpacity,
    StyleSheet,
    Animated,
    View,
} from 'react-native';

import {
    Ionicons,
} from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import axios from 'axios';

interface Props {
    color?: string;
    size?: number;
}

export default function NotificationBell({
    color = '#fff',
    size = 30,
}: Props) {

    const router = useRouter();

    const shakeAnim =
        useRef(new Animated.Value(0))
            .current;

    const [hasUnread, setHasUnread] =
        useState(false);

    useEffect(() => {

        loadNotifications();

    }, []);
    const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

    const loadNotifications = async () => {

        try {

            const response =
                await axios.get(
                    `${BACKEND_URL}/api/notifications/my`
                );

            if (
                response.data &&
                response.data.length > 0
            ) {

                setHasUnread(true);

                startBellAnimation();
            }

        } catch (error) {

            console.log(error);
        }
    };

    const startBellAnimation = () => {

        Animated.sequence([

            Animated.timing(
                shakeAnim,
                {
                    toValue: 1,
                    duration: 120,
                    useNativeDriver: true,
                }
            ),

            Animated.timing(
                shakeAnim,
                {
                    toValue: -1,
                    duration: 120,
                    useNativeDriver: true,
                }
            ),

            Animated.timing(
                shakeAnim,
                {
                    toValue: 1,
                    duration: 120,
                    useNativeDriver: true,
                }
            ),

            Animated.timing(
                shakeAnim,
                {
                    toValue: 0,
                    duration: 120,
                    useNativeDriver: true,
                }
            ),

        ]).start();
    };

    const rotate = shakeAnim.interpolate({

        inputRange: [-1, 1],

        outputRange: ['-12deg', '12deg'],
    });

    return (

        <TouchableOpacity
            activeOpacity={0.8}
            style={styles.container}
            onPress={() => {

                setHasUnread(false);

                router.push('/notifications');
            }}
        >

            <Animated.View
                style={{
                    transform: [{ rotate }],
                }}
            >

                <Ionicons
                    name="notifications"
                    size={size}
                    color={color}
                />

            </Animated.View>

            {hasUnread && (

                <View style={styles.dot} />

            )}

        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({

    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    dot: {
        position: 'absolute',

        top: 2,
        right: 1,

        width: 12,
        height: 12,

        borderRadius: 20,

        backgroundColor: '#FF3B30',

        borderWidth: 2,
        borderColor: '#fff',
    },

});