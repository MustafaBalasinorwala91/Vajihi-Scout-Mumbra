import React from "react";

import {

    View,

    Text,

    StyleSheet,

} from "react-native";

import {

    MaterialCommunityIcons,

} from "@expo/vector-icons";

import {

    UniformColors,

} from "../../constants/uniformColors";

interface Props {

    count: number;

}

export default function LowStockBanner({

    count,

}: Props) {

    if (count === 0) return null;

    return (

        <View style={styles.container}>

            <MaterialCommunityIcons

                name="alert"

                size={24}

                color={UniformColors.warning}

            />

            <Text style={styles.text}>

                {count} uniforms are running low on stock.

            </Text>

        </View>

    )

}

const styles = StyleSheet.create({

    container: {

        marginHorizontal: 16,

        marginBottom: 18,

        padding: 14,

        borderRadius: 14,

        backgroundColor: "#FFF6E5",

        flexDirection: "row",

        alignItems: "center",

    },

    text: {

        marginLeft: 12,

        flex: 1,

        fontWeight: "600",

        color: "#8A5A00",

    }

})