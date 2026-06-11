import { wp, hp } from '../../utils/responsive';
import { rf } from '../../utils/fonts';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

interface Props {
    color?: string;
    size?: number;
}

export default function NotificationBell({
    color = '#fff',
    size = rf(28),
}: Props) {

    const router = useRouter();

    const [animationStarted, setAnimationStarted] =
        useState(false);

    const [hasUnread, setHasUnread] =
        useState(false);

    const shakeAnim =
        useRef(new Animated.Value(0)).current;

    const animationLoop =
        useRef<Animated.CompositeAnimation | null>(null);

    const mountedRef = useRef(true);

    useEffect(() => {

        mountedRef.current = true;

        loadNotifications();

        const interval = setInterval(() => {
            loadNotifications();
        }, 60000);

        return () => {

            mountedRef.current = false;

            clearInterval(interval);

            animationLoop.current?.stop();

        };

    }, []);

    async function loadNotifications() {

        try {

            const token =
                await AsyncStorage.getItem(
                    'session_token'
                );

            if (!token) {

                setHasUnread(false);

                return;
            }

            const response =
                await api.get('/notifications/my');

            if (!mountedRef.current) return;

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

                animationLoop.current?.stop();

                shakeAnim.setValue(0);

                setAnimationStarted(false);
            }

        } catch (error: any) {

            if (error?.response?.status === 401) {

                setHasUnread(false);

                return;
            }

            console.error(
                'Notification error:',
                error
            );
        }
    }

    function startBellAnimation() {

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
    }

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
                    size={size || rf(28)}
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

        minWidth: wp('10%'),
        minHeight: wp('10%'),
    },

    dot: {
        position: 'absolute',

        top: hp('0.3%'),
        right: wp('0.3%'),

        width: wp('3.2%'),
        height: wp('3.2%'),

        borderRadius: wp('5%'),

        backgroundColor: '#FF3B30',

        borderWidth: 2,
        borderColor: '#fff',
    },

});