import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Ionicons,
    MaterialCommunityIcons,
    FontAwesome5,
} from '@expo/vector-icons';

export default function BadgeCard({
    title,
    icon,
    type,
    color,
    locked,
}: any) {

    const renderIcon = () => {
        const iconColor = locked ? '#999' : '#fff';

        if (type === 'ionicons') {
            return (
                <Ionicons
                    name={icon}
                    size={28}
                    color={iconColor}
                />
            );
        }

        if (type === 'material') {
            return (
                <MaterialCommunityIcons
                    name={icon}
                    size={30}
                    color={iconColor}
                />
            );
        }

        return (
            <FontAwesome5
                name={icon}
                size={24}
                color={iconColor}
            />
        );
    };

    return (
        <View
            style={[
                styles.container,
                locked && styles.lockedContainer,
            ]}
        >
            <LinearGradient
                colors={
                    locked
                        ? ['#cfcfcf', '#b5b5b5']
                        : [color, '#7B61FF']
                }
                style={styles.iconWrapper}
            >
                {renderIcon()}

                {locked && (
                    <View style={styles.lockOverlay}>
                        <Ionicons
                            name="lock-closed"
                            size={14}
                            color="#fff"
                        />
                    </View>
                )}
            </LinearGradient>

            <Text
                style={[
                    styles.title,
                    locked && { color: '#888' },
                ]}
                numberOfLines={2}
            >
                {title}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 105,
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 10,
        alignItems: 'center',
        marginRight: 14,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 5,
    },

    lockedContainer: {
        opacity: 0.7,
    },

    iconWrapper: {
        width: 60,
        height: 70,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },

    lockOverlay: {
        position: 'absolute',
        bottom: -2,
        right: -2,

        backgroundColor: '#666',

        width: 24,
        height: 24,
        borderRadius: 12,

        justifyContent: 'center',
        alignItems: 'center',

        borderWidth: 2,
        borderColor: '#fff',
    },

    title: {
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        color: '#1a1a2e',
        lineHeight: 18,
    },
});