import { wp, hp } from '../../utils/responsive';
import { rf } from '../../utils/fonts';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Props {
    title: string;
    description: string;
    icon: any;
    colors: [string, string];
    onPress?: () => void;
}

export default function QuickActionCard({
    title,
    description,
    icon,
    colors,
    onPress,
}: Props) {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={onPress}
        >
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={rf(26)} color="#fff" />
                </View>

                <Text style={styles.title}
                    numberOfLines={2}
                >{title}</Text>

                <Text
                    style={styles.description}
                    numberOfLines={3}
                >
                    {description}
                </Text>

                <View style={styles.arrowButton}>
                    <Ionicons
                        name="arrow-forward"
                        size={rf(18)}
                        color="#fff"
                    />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '48%',
        minHeight: hp('28%'),

        borderRadius: wp('7%'),
        marginBottom: hp('2%'),

        overflow: 'hidden',

        shadowColor: '#5B3DF5',
        shadowOffset: {
            width: 0,
            height: hp('1%'),
        },
        shadowOpacity: 0.18,
        shadowRadius: wp('3%'),
        elevation: 8,
    },

    gradient: {
        flex: 1,
        padding: wp('4.5%'),
        borderRadius: wp('7%'),
    },

    iconContainer: {
        width: wp('15%'),
        height: wp('15%'),
        borderRadius: wp('7.5%'),

        backgroundColor: 'rgba(255,255,255,0.12)',

        justifyContent: 'center',
        alignItems: 'center',
    },

    title: {
        color: '#fff',
        fontSize: rf(15),
        fontWeight: '700',

        lineHeight: rf(22),

        marginTop: hp('1.5%'),
    },

    description: {
        color: 'rgba(255,255,255,0.82)',

        fontSize: rf(11),

        lineHeight: rf(18),

        marginTop: hp('1%'),
    },

    arrowButton: {
        marginTop: 'auto',

        alignSelf: 'flex-end',

        width: wp('11%'),
        height: wp('11%'),
        borderRadius: wp('5.5%'),

        backgroundColor: 'rgba(255,255,255,0.12)',

        justifyContent: 'center',
        alignItems: 'center',
    },
});