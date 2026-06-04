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
                    size={26}
                    color={color}
                />
            );
        }

        if (type === 'material') {
            return (
                <MaterialCommunityIcons
                    name={icon}
                    size={28}
                    color={color}
                />
            );
        }

        return (
            <FontAwesome5
                name={icon}
                size={22}
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
                numberOfLines={1}
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
        marginRight: 18,
        width: 110,
    },

    circle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#f2edff',

        justifyContent: 'center',
        alignItems: 'center',

        marginBottom: 10,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 4,
    },

    title: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1a1a2e',
        textAlign: 'center',
        width: '100%',
    },
});