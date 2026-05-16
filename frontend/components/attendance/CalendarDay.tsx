import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

interface Props {
    day: number;
    selected?: boolean;
    marked?: boolean;
    absent?: boolean;
    onPress?: () => void;
}

const CalendarDay = ({
    day,
    selected,
    marked,
    absent,
    onPress,
}: Props) => {

    let backgroundColor = '#F4F3F8';
    let textColor = '#16162E';

    if (marked) {
        backgroundColor = '#37C978';
        textColor = '#fff';
    }

    if (absent) {
        backgroundColor = '#FF5B5B';
        textColor = '#fff';
    }

    if (selected) {
        backgroundColor = '#5B3DF5';
        textColor = '#fff';
    }

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            style={[
                styles.dayContainer,
                { backgroundColor },
            ]}
            onPress={onPress}
        >
            <Text
                style={[
                    styles.text,
                    { color: textColor },
                ]}
            >
                {day}
            </Text>
        </TouchableOpacity>
    );
};

export default CalendarDay;

const styles = StyleSheet.create({
    dayContainer: {
        width: 44,
        height: 44,
        marginBottom: 12,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },

    text: {
        fontSize: 16,
        fontWeight: '700',
    },
});