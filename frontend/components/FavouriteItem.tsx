import { wp, hp } from '../utils/responsive';
import { rf } from '../utils/fonts';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';

import {
    Ionicons,
    MaterialCommunityIcons,
    FontAwesome5,
} from '@expo/vector-icons';

export default function FavouriteItem({
    title,
    icon,
    type,
    color,
}: any) {

    const renderIcon = () => {
        if (type === 'ionicons') {
            return (
                <Ionicons
                    name={icon}
                    size={rf(22)}
                    color={color}
                />
            );
        }

        if (type === 'material') {
            return (
                <MaterialCommunityIcons
                    name={icon}
                    size={rf(24)}
                    color={color}
                />
            );
        }

        return (
            <FontAwesome5
                name={icon}
                size={rf(18)}
                color={color}
            />
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.circle}>
                {renderIcon()}
            </View>

            <Text
                style={styles.title}
                numberOfLines={2}
                ellipsizeMode="tail"
            >
                {title}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',

        marginRight: wp('4%'),

        width: wp('24%'),
    },

    circle: {
        width: wp('16%'),
        height: wp('16%'),

        borderRadius: wp('8%'),

        backgroundColor: '#f2edff',

        justifyContent: 'center',
        alignItems: 'center',

        marginBottom: hp('1%'),

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: hp('0.5%'),
        },
        shadowOpacity: 0.06,
        shadowRadius: wp('1.5%'),
        elevation: 4,
    },

    title: {
        fontSize: rf(11),

        fontWeight: '700',

        color: '#1a1a2e',

        textAlign: 'center',

        width: '100%',

        lineHeight: rf(15),

        minHeight: hp('3%'),
    },
});