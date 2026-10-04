import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { UniformInventory } from "../../types/uniform";

import {
    UniformColors,
} from "../../constants/uniformColors";

interface Props {
    item: UniformInventory;

    canEdit: boolean;

    canDelete: boolean;

    onPress: (
        item: UniformInventory
    ) => void;

    onEdit: (
        item: UniformInventory
    ) => void;

    onDelete: (
        item: UniformInventory
    ) => void;
}
export default function UniformInventoryCard({
    item,
    canEdit,
    canDelete,
    onPress,
    onEdit,
    onDelete,
}: Props) {

    const getStockColor = () => {
        if (item.available_quantity <= 0) {
            return UniformColors.danger;
        }

        if (
            item.available_quantity <=
            item.minimum_stock
        ) {
            return UniformColors.warning;
        }

        return UniformColors.success;
    };

    const getStockText = () => {
        if (item.available_quantity <= 0) {
            return "Out of Stock";
        }

        if (
            item.available_quantity <=
            item.minimum_stock
        ) {
            return "Low Stock";
        }

        return "Healthy";
    };

    const stockColor = getStockColor();

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => onPress(item)}
        >

            {/* ============================= */}
            {/* TOP */}
            {/* ============================= */}

            <View style={styles.topRow}>

                {item.image ? (
                    <Image
                        source={{
                            uri: item.image,
                        }}
                        style={styles.image}
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <MaterialCommunityIcons
                            name="tshirt-crew"
                            size={36}
                            color={UniformColors.primary}
                        />
                    </View>
                )}

                <View style={styles.info}>

                    <Text
                        numberOfLines={1}
                        style={styles.title}
                    >
                        {item.catalog_name ||
                            "Uniform Item"}
                    </Text>

                    <Text
                        numberOfLines={1}
                        style={styles.category}
                    >
                        {item.category ||
                            "Uncategorized"}
                    </Text>

                    <Text
                        numberOfLines={1}
                        style={styles.size}
                    >
                        Size: {item.size}
                    </Text>

                    <View
                        style={[
                            styles.badge,
                            {
                                backgroundColor:
                                    `${stockColor}20`,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.badgeText,
                                {
                                    color: stockColor,
                                },
                            ]}
                        >
                            {getStockText()}
                        </Text>
                    </View>

                </View>

                <MaterialCommunityIcons
                    name="chevron-right"
                    size={26}
                    color="#999"
                />

            </View>

            {/* ============================= */}
            {/* DIVIDER */}
            {/* ============================= */}

            <View style={styles.divider} />

            {/* ============================= */}
            {/* STATISTICS */}
            {/* ============================= */}

            <View style={styles.statsRow}>

                <View style={styles.stat}>
                    <Text style={styles.statValue}>
                        {item.total_quantity}
                    </Text>

                    <Text style={styles.statLabel}>
                        Total
                    </Text>
                </View>

                <View style={styles.stat}>
                    <Text
                        style={[
                            styles.statValue,
                            {
                                color:
                                    UniformColors.success,
                            },
                        ]}
                    >
                        {item.available_quantity}
                    </Text>

                    <Text style={styles.statLabel}>
                        Available
                    </Text>
                </View>

                <View style={styles.stat}>
                    <Text style={styles.statValue}>
                        {item.assigned_quantity}
                    </Text>

                    <Text style={styles.statLabel}>
                        Assigned
                    </Text>
                </View>

                <View style={styles.stat}>
                    <Text style={styles.statValue}>
                        {item.repair_quantity}
                    </Text>

                    <Text style={styles.statLabel}>
                        Repair
                    </Text>
                </View>

            </View>

            {/* ============================= */}
            {/* COST */}
            {/* ============================= */}

            <View style={styles.bottomRow}>

                <View>
                    <Text style={styles.bottomLabel}>
                        Purchase Price
                    </Text>

                    <Text style={styles.price}>
                        ₹{item.purchase_price}
                    </Text>
                </View>

                <View style={styles.actions}>

                    {canEdit && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={(event) => {
                                event.stopPropagation();
                                onEdit(item)
                            }
                            }
                        >
                            <MaterialCommunityIcons
                                name="pencil"
                                size={20}
                                color={
                                    UniformColors.primary
                                }
                            />
                        </TouchableOpacity>
                    )}

                    {canDelete && (
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                styles.deleteButton,
                            ]}
                            onPress={(event) => {
                                event.stopPropagation();
                                onDelete(item)
                            }
                            }
                        >
                            <MaterialCommunityIcons
                                name="delete-outline"
                                size={20}
                                color={
                                    UniformColors.danger
                                }
                            />
                        </TouchableOpacity>
                    )}

                </View>

            </View>

        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({

    card: {
        backgroundColor: "#FFF",
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        padding: 16,

        elevation: 3,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },

    topRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    image: {
        width: 76,
        height: 76,
        borderRadius: 18,
        backgroundColor: "#F1F1F1",
        marginRight: 16,
    },

    imagePlaceholder: {
        width: 76,
        height: 76,
        borderRadius: 18,

        backgroundColor: "#F0EBFF",

        justifyContent: "center",
        alignItems: "center",

        marginRight: 16,
    },

    info: {
        flex: 1,
        minWidth: 0,
    },

    title: {
        fontSize: 18,
        fontWeight: "700",
        color: UniformColors.text,
    },

    category: {
        color: "#777",
        marginTop: 4,
        fontSize: 14,
    },

    size: {
        color: "#666",
        marginTop: 4,
        fontSize: 13,
    },

    badge: {
        alignSelf: "flex-start",
        marginTop: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },

    badgeText: {
        fontWeight: "700",
        fontSize: 12,
    },

    divider: {
        height: 1,
        backgroundColor: "#EEE",
        marginVertical: 16,
    },

    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    stat: {
        alignItems: "center",
        flex: 1,
    },

    statValue: {
        fontWeight: "700",
        fontSize: 17,
        color: "#222",
    },

    statLabel: {
        color: "#777",
        marginTop: 4,
        fontSize: 11,
    },

    bottomRow: {
        marginTop: 16,
        paddingTop: 14,

        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    bottomLabel: {
        color: "#777",
        fontSize: 12,
    },

    price: {
        marginTop: 3,
        fontSize: 16,
        fontWeight: "700",
        color: "#222",
    },

    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    actionButton: {
        width: 42,
        height: 42,
        borderRadius: 14,

        backgroundColor: "#F0EBFF",

        justifyContent: "center",
        alignItems: "center",
    },

    deleteButton: {
        backgroundColor: "#FFF0F0",
    },

});