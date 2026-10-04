import React from "react";

import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { UniformCatalog } from "../../types/uniform";

interface Props {
    item: UniformCatalog;

    canEdit: boolean;

    canDelete: boolean;

    onEdit: (item: UniformCatalog) => void;

    onDelete: (item: UniformCatalog) => void;

    onPress: (item: UniformCatalog) => void;
}

export default function CatalogCard({

    item,

    canEdit,

    canDelete,

    onEdit,

    onDelete,

    onPress,

}: Props) {

    return (

        <TouchableOpacity

            activeOpacity={0.9}

            style={styles.card}

            onPress={() => onPress(item)}

        >

            <Image

                source={
                    item.image
                        ? { uri: item.image }
                        : require("../../assets/uniforms/shirt.webp")
                }

                style={styles.image}

            />

            <View style={styles.content}>

                <View style={styles.headerRow}>

                    <Text

                        style={styles.name}

                        numberOfLines={1}

                    >

                        {item.name}

                    </Text>

                    {item.is_mandatory && (

                        <View style={styles.badge}>

                            <Text style={styles.badgeText}>

                                Mandatory

                            </Text>

                        </View>

                    )}

                </View>

                <Text style={styles.category}>

                    {item.category}

                </Text>

                {!!item.description && (

                    <Text

                        numberOfLines={2}

                        style={styles.description}

                    >

                        {item.description}

                    </Text>

                )}

                <View style={styles.sizeRow}>

                    <MaterialCommunityIcons

                        name="ruler"

                        size={18}

                        color="#6C4DFF"

                    />

                    <Text

                        style={styles.sizeText}

                        numberOfLines={1}

                    >

                        {item.available_sizes.join(", ")}

                    </Text>

                </View>

            </View>

            {canEdit && (

                <View style={styles.actions}>

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => onEdit(item)}
                    >
                        <MaterialCommunityIcons
                            name="pencil"
                            size={22}
                            color="#5B3DF5"
                        />
                    </TouchableOpacity>

                    {canDelete && (

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => onDelete(item)}
                        >
                            <MaterialCommunityIcons
                                name="delete"
                                size={22}
                                color="#EF4444"
                            />
                        </TouchableOpacity>

                    )}

                </View>

            )}

        </TouchableOpacity>

    );

}

const styles = StyleSheet.create({

    card: {

        marginHorizontal: 20,

        marginBottom: 16,

        backgroundColor: "#FFF",

        borderRadius: 24,

        padding: 16,

        flexDirection: "row",

        elevation: 3,

        shadowColor: "#000",

        shadowOpacity: 0.08,

        shadowOffset: {

            width: 0,

            height: 3,

        },

        shadowRadius: 8,

    },

    image: {

        width: 82,

        height: 82,

        borderRadius: 18,

        backgroundColor: "#EEE",

    },

    content: {

        flex: 1,

        marginLeft: 16,

        justifyContent: "center",

    },

    headerRow: {

        flexDirection: "row",

        alignItems: "center",

    },

    name: {

        flex: 1,

        fontSize: 20,

        fontWeight: "700",

        color: "#18181B",

    },

    badge: {

        backgroundColor: "#E9DDFF",

        paddingHorizontal: 10,

        paddingVertical: 4,

        borderRadius: 12,

        marginLeft: 8,

    },

    badgeText: {

        color: "#5B3DF5",

        fontWeight: "700",

        fontSize: 11,

    },

    category: {

        color: "#6C4DFF",

        marginTop: 5,

        fontWeight: "600",

    },

    description: {

        color: "#666",

        marginTop: 6,

        fontSize: 13,

    },

    sizeRow: {

        flexDirection: "row",

        alignItems: "center",

        marginTop: 10,

    },

    sizeText: {

        marginLeft: 8,

        color: "#444",

        flex: 1,

    },

    actions: {

        justifyContent: "space-between",

        marginLeft: 12,

    },

    iconButton: {

        width: 42,

        height: 42,

        borderRadius: 21,

        justifyContent: "center",

        alignItems: "center",

        backgroundColor: "#F6F4FF",

    },

});