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
                    <Ionicons name={icon} size={30} color="#fff" />
                </View>

                <Text style={styles.title}>{title}</Text>

                <Text
                    style={styles.description}
                    numberOfLines={2}
                >
                    {description}
                </Text>

                <View style={styles.arrowButton}>
                    <Ionicons
                        name="arrow-forward"
                        size={22}
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
        height: 220,
        borderRadius: 28,
        marginBottom: 18,
        overflow: 'hidden',

        shadowColor: '#5B3DF5',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8,
    },

    gradient: {
        flex: 1,
        padding: 18,
        borderRadius: 28,
    },

    iconContainer: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    title: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        lineHeight: 24,
        marginTop: 14,
    },

    description: {
        color: 'rgba(255,255,255,0.82)',
        fontSize: 13,
        lineHeight: 19,
        marginTop: 8,
    },

    arrowButton: {
        position: 'absolute',
        bottom: 18,
        right: 18,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});