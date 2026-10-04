import React from "react";
import {
    Modal,
    View,
    TouchableOpacity,
    StyleSheet,
    Text,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {

    visible: boolean;

    onClose: () => void;

    onMyUniforms: () => void;

    onRepairRequest: () => void;

}

const Menu = ({

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

            color="#5B3DF5"

        />

        <Text style={styles.text}>

            {title}

        </Text>

    </TouchableOpacity>

);

export default function MemberBottomSheet({

    visible,

    onClose,

    onMyUniforms,

    onRepairRequest,

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

                    <Menu

                        title="My Uniforms"

                        icon="tshirt-crew"

                        onPress={onMyUniforms}

                    />

                    <Menu

                        title="Repair Request"

                        icon="tools"

                        onPress={onRepairRequest}

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

        padding: 22,

        borderTopLeftRadius: 24,

        borderTopRightRadius: 24,

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

    }

});