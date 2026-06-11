import { wp, hp } from '../utils/responsive';
import { rf } from '../utils/fonts';
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
                    size={rf(24)}
                    color={iconColor}
                />
            );
        }

        if (type === 'material') {
            return (
                <MaterialCommunityIcons
                    name={icon}
                    size={rf(26)}
                    color={iconColor}
                />
            );
        }

        return (
            <FontAwesome5
                name={icon}
                size={rf(20)}
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
                            size={rf(12)}
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
        width: wp('27%'),

        backgroundColor: '#fff',

        borderRadius: wp('6%'),

        paddingVertical: hp('1.5%'),
        paddingHorizontal: wp('2.5%'),

        alignItems: 'center',

        marginRight: wp('3.5%'),

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: hp('0.5%'),
        },
        shadowOpacity: 0.08,
        shadowRadius: wp('2%'),
        elevation: 5,
    },

    lockedContainer: {
        opacity: 0.7,
    },

    iconWrapper: {
        width: wp('15%'),
        height: hp('8%'),

        borderRadius: wp('6%'),

        justifyContent: 'center',
        alignItems: 'center',

        marginBottom: hp('2%'),

        position: 'relative',
    },

    lockOverlay: {
        position: 'absolute',

        bottom: -hp('0.2%'),
        right: -wp('0.5%'),

        backgroundColor: '#666',

        width: wp('6%'),
        height: wp('6%'),

        borderRadius: wp('3%'),

        justifyContent: 'center',
        alignItems: 'center',

        borderWidth: 2,
        borderColor: '#fff',
    },

    title: {
        textAlign: 'center',

        fontSize: rf(11),

        fontWeight: '700',

        color: '#1a1a2e',

        lineHeight: rf(16),

        minHeight: hp('4%'),
    },
});