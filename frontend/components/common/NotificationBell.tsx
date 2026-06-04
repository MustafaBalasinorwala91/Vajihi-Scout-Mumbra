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
    const [animationStarted, setAnimationStarted] =
        useState(false);

    const shakeAnim =
        useRef(new Animated.Value(0))
            .current;
    const animationLoop =
        useRef<Animated.CompositeAnimation | null>(null);

    const [hasUnread, setHasUnread] =
        useState(false);

    useEffect(() => {

        loadNotifications();

        const interval = setInterval(() => {

            loadNotifications();

        }, 10000);

        return () => {

            clearInterval(interval);

            animationLoop.current?.stop();

        };
    }, []);
    const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

    const loadNotifications = async () => {

        try {

            const response =
                await axios.get(
                    `${BACKEND_URL}/api/notifications/my`
                );

            const unread =
                response.data.filter(
                    (item: any) => !item.is_read
                );

            if (unread.length > 0) {

                setHasUnread(true);

                if (!animationStarted) {

                    startBellAnimation();

                    setAnimationStarted(true);
                }

            } else {

                setHasUnread(false);

                setAnimationStarted(false);
            }

        } catch (error) {

            console.error(error);
        }
    };

    const startBellAnimation = () => {

        animationLoop.current = Animated.loop(

            Animated.sequence([

                Animated.timing(shakeAnim, {
                    toValue: 1,
                    duration: 120,
                    useNativeDriver: true,
                }),

                Animated.timing(shakeAnim, {
                    toValue: -1,
                    duration: 120,
                    useNativeDriver: true,
                }),

                Animated.timing(shakeAnim, {
                    toValue: 1,
                    duration: 120,
                    useNativeDriver: true,
                }),

                Animated.timing(shakeAnim, {
                    toValue: 0,
                    duration: 120,
                    useNativeDriver: true,
                }),

                Animated.delay(2500),

            ])

        );

        animationLoop.current.start();
    };

    const rotate = shakeAnim.interpolate({

        inputRange: [-1, 1],

        outputRange: ['-12deg', '12deg'],
    });

    return (

        <TouchableOpacity
            activeOpacity={0.8}
            style={styles.container}
            onPress={async () => {

                try {

                    await axios.put(
                        `${BACKEND_URL}/api/notifications/read-all`
                    );

                } catch (error) {

                    console.error(error);
                }

                setHasUnread(false);
                animationLoop.current?.stop();

                setAnimationStarted(false);

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