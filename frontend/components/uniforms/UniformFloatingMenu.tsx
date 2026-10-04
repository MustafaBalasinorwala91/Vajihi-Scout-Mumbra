import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
    UniformColors,
    Radius,
} from "../../constants/uniformColors";

interface Props {
    visible: boolean;
    onPress: () => void;
}

export default function UniformFloatingMenu({
    visible,
    onPress,
}: Props) {

    if (!visible) return null;

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            style={styles.button}
            onPress={onPress}
        >
            <MaterialCommunityIcons
                name="plus"
                color="#FFF"
                size={30}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({

    button: {
        position: "absolute",
        bottom: 30,
        right: 24,

        width: 62,
        height: 62,

        borderRadius: 31,

        justifyContent: "center",
        alignItems: "center",

        backgroundColor: UniformColors.primary,

        elevation: 10,
    }

});