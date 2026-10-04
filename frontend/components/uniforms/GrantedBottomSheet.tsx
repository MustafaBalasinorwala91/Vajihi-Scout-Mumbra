import React from "react";
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
    Text,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {

    visible: boolean;

    onClose: () => void;

    onAssign: () => void;

    onRepair: () => void;

    onReturn: () => void;

}

const Item = ({

    title,

    icon,

    onPress,

}: any) => (

    <TouchableOpacity

        style={styles.item}

        onPress={onPress}

    >

        <MaterialCommunityIcons

            name={icon}

            size={24}

            color="#5B3DF5"

        />

        <Text style={styles.text}>

            {title}

        </Text>

    </TouchableOpacity>

);

export default function GrantedBottomSheet({

    visible,

    onClose,

    onAssign,

    onRepair,

    onReturn,

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

                    <Item

                        title="Assign Uniform"

                        icon="account-check"

                        onPress={onAssign}

                    />

                    <Item

                        title="Repair"

                        icon="tools"

                        onPress={onRepair}

                    />

                    <Item

                        title="Return Uniform"

                        icon="backup-restore"

                        onPress={onReturn}

                    />

                </View>

            </TouchableOpacity>

        </Modal>

    )

}

const styles = StyleSheet.create({

    overlay: {

        flex: 1,

        justifyContent: "flex-end",

        backgroundColor: "rgba(0,0,0,.35)",

    },

    sheet: {

        backgroundColor: "#FFF",

        borderTopLeftRadius: 24,

        borderTopRightRadius: 24,

        padding: 22,

    },

    item: {

        flexDirection: "row",

        alignItems: "center",

        paddingVertical: 18,

    },

    text: {

        marginLeft: 18,

        fontSize: 17,

        fontWeight: "600",

    }

});