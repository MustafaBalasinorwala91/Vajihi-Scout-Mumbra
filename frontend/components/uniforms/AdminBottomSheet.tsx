import React from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
    Radius,
    UniformColors,
} from "../../constants/uniformColors";

interface Props {

    visible: boolean;

    onClose: () => void;

    onCatalog: () => void;

    onInventory: () => void;

    onAssign: () => void;

    onPurchase: () => void;

    onRepair: () => void;

}

const Row = ({

    title,

    icon,

    onPress,

}: any) => (

    <TouchableOpacity

        style={styles.row}

        onPress={onPress}

    >

        <MaterialCommunityIcons

            name={icon}

            size={24}

            color={UniformColors.primary}

        />

        <Text style={styles.text}>

            {title}

        </Text>

    </TouchableOpacity>

);

export default function AdminBottomSheet({

    visible,

    onClose,

    onCatalog,

    onInventory,

    onAssign,

    onPurchase,

    onRepair,

}: Props) {

    return (

        <Modal

            transparent

            visible={visible}

            animationType="slide"

        >

            <TouchableOpacity

                style={styles.overlay}

                activeOpacity={1}

                onPress={onClose}

            >

                <View style={styles.sheet}>

                    <Row

                        title="Manage Catalog"

                        icon="view-grid"

                        onPress={onCatalog}

                    />

                    <Row

                        title="Inventory"

                        icon="archive"

                        onPress={onInventory}

                    />

                    <Row

                        title="Assign Uniform"

                        icon="account-check"

                        onPress={onAssign}

                    />

                    <Row

                        title="Purchase"

                        icon="cart"

                        onPress={onPurchase}

                    />

                    <Row

                        title="Repair Center"

                        icon="tools"

                        onPress={onRepair}

                    />

                </View>

            </TouchableOpacity>

        </Modal>

    )

}

const styles = StyleSheet.create({

    overlay: {

        flex: 1,

        backgroundColor: "rgba(0,0,0,.4)",

        justifyContent: "flex-end",

    },

    sheet: {

        backgroundColor: "#FFF",

        borderTopLeftRadius: 24,

        borderTopRightRadius: 24,

        paddingVertical: 20,

        paddingHorizontal: 22,

    },

    row: {

        flexDirection: "row",

        alignItems: "center",

        paddingVertical: 18,

    },

    text: {

        marginLeft: 18,

        fontSize: 17,

        fontWeight: "600",

        color: "#222",

    }

});