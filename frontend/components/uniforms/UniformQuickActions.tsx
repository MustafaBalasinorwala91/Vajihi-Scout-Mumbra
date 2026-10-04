import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
    UniformColors,
    Radius,
    Spacing,
    FontSizes,
} from "../../constants/uniformColors";

interface Props {
    isAdmin: boolean;
    onCatalog: () => void;
    onInventory: () => void;
    onAssign: () => void;
    onRepair: () => void;
}

const ActionCard = ({
    title,
    icon,
    color,
    onPress,
}: any) => (
    <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={onPress}
    >
        <View
            style={[
                styles.iconBox,
                { backgroundColor: color + "20" },
            ]}
        >
            <MaterialCommunityIcons
                name={icon}
                size={28}
                color={color}
            />
        </View>

        <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
);

export default function UniformQuickActions({
    isAdmin,
    onCatalog,
    onInventory,
    onAssign,
    onRepair,
}: Props) {
    if (!isAdmin) return null;

    return (
        <View style={styles.container}>
            <ActionCard
                title="Catalog"
                icon="view-grid"
                color={UniformColors.primary}
                onPress={onCatalog}
            />

            <ActionCard
                title="Inventory"
                icon="archive"
                color={UniformColors.info}
                onPress={onInventory}
            />

            <ActionCard
                title="Assign"
                icon="account-check"
                color={UniformColors.success}
                onPress={onAssign}
            />

            <ActionCard
                title="Repair"
                icon="tools"
                color={UniformColors.warning}
                onPress={onRepair}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
    },

    card: {
        width: "23%",
        backgroundColor: "#FFF",
        borderRadius: Radius.lg,
        paddingVertical: 16,
        alignItems: "center",
        elevation: 3,
    },

    iconBox: {
        height: 52,
        width: 52,
        borderRadius: 26,
        justifyContent: "center",
        alignItems: "center",
    },

    title: {
        marginTop: 10,
        fontSize: FontSizes.sm,
        fontWeight: "600",
        color: UniformColors.text,
    },
});