import { wp, hp } from '../../utils/responsive';
import { rf } from '../../utils/fonts';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

interface Props {
    day: number;
    size: number;
    selected?: boolean;

    presentCount?: number;
    absentCount?: number;

    onPress?: () => void;
}
const CalendarDay = ({
    day,
    size,
    selected,
    presentCount = 0,
    absentCount = 0,
    onPress,
}: Props) => {

    let backgroundColor = '#F4F3F8';
    let textColor = '#16162E';

    const mixed =
        presentCount > 0 &&
        absentCount > 0;

    const onlyPresent =
        presentCount > 0 &&
        absentCount === 0;

    const onlyAbsent =
        absentCount > 0 &&
        presentCount === 0;

    if (onlyPresent) {
        backgroundColor = '#37C978';
        textColor = '#fff';
    }

    if (onlyAbsent) {
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
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor,
                }]}
            onPress={onPress}
        >
            <>
                {mixed && !selected && (
                    <>
                        <View
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: '50%',
                                backgroundColor: '#37C978',
                            }}
                        />

                        <View
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: '50%',
                                backgroundColor: '#FF5B5B',
                            }}
                        />
                    </>
                )}

                <Text
                    style={[
                        styles.text,
                        {
                            color:
                                mixed || selected
                                    ? '#fff'
                                    : textColor,
                        },
                    ]}
                >
                    {day}
                </Text>
            </>
        </TouchableOpacity>
    );
};

export default CalendarDay;

const styles = StyleSheet.create({

    dayContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        overflow: 'hidden',
    },

    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    text: {
        fontSize: rf(15),
        fontWeight: '700',
    },

});