import React, {
    useEffect,
    useState,
} from "react";

import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from "react-native";

import {
    MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
    UniformCatalog,
    UniformInventory,
} from "../../types/uniform";

interface Props {
    visible: boolean;

    initialData?:
    | UniformInventory
    | null;

    catalog: UniformCatalog[];

    onClose: () => void;

    onSave: (
        data: Partial<UniformInventory>
    ) => Promise<void>;
}

export default function UniformInventoryForm({
    visible,
    initialData,
    catalog,
    onClose,
    onSave,
}: Props) {
    const [catalogId, setCatalogId] =
        useState("");

    const [size, setSize] =
        useState("");

    const [totalQuantity, setTotalQuantity] =
        useState("");

    const [minimumStock, setMinimumStock] =
        useState("");

    const [purchasePrice, setPurchasePrice] =
        useState("");

    const [supplier, setSupplier] =
        useState("");

    const [purchaseDate, setPurchaseDate] =
        useState("");

    const [notes, setNotes] =
        useState("");

    const [saving, setSaving] =
        useState(false);

    // ==========================================
    // RESET / LOAD
    // ==========================================

    useEffect(() => {
        if (initialData) {
            setCatalogId(
                initialData.catalog_id
            );

            setSize(initialData.size);

            setTotalQuantity(
                String(
                    initialData.total_quantity
                )
            );

            setMinimumStock(
                String(
                    initialData.minimum_stock
                )
            );

            setPurchasePrice(
                initialData.purchase_price != null
                    ? String(
                        initialData.purchase_price
                    )
                    : ""
            );

            setSupplier(
                initialData.supplier ?? ""
            );

            setPurchaseDate(
                initialData.purchase_date ?? ""
            );

            setNotes(
                initialData.notes ?? ""
            );
        } else {
            setCatalogId("");

            setSize("");

            setTotalQuantity("");

            setMinimumStock("1");

            setPurchasePrice("");

            setSupplier("");

            setPurchaseDate("");

            setNotes("");
        }
    }, [initialData, visible]);

    // ==========================================
    // SELECTED CATALOG
    // ==========================================

    const selectedCatalog =
        catalog.find(
            (item) =>
                item.catalog_id === catalogId
        );

    const availableSizes =
        selectedCatalog?.available_sizes ??
        [];

    // ==========================================
    // SAVE
    // ==========================================

    const handleSave = async () => {
        if (!initialData && !catalogId) {
            Alert.alert(
                "Validation",
                "Please select a uniform."
            );

            return;
        }

        if (!size) {
            Alert.alert(
                "Validation",
                "Please select a size."
            );

            return;
        }

        if (
            !initialData &&
            !availableSizes.includes(size)
        ) {
            Alert.alert(
                "Validation",
                "Selected size is not available for this uniform."
            );

            return;
        }

        const quantity =
            Number(totalQuantity);

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {
            Alert.alert(
                "Validation",
                "Enter a valid total quantity."
            );

            return;
        }

        const minimum =
            Number(minimumStock);

        if (
            !Number.isFinite(minimum) ||
            minimum < 0
        ) {
            Alert.alert(
                "Validation",
                "Enter a valid minimum stock."
            );

            return;
        }

        const price =
            purchasePrice.trim()
                ? Number(purchasePrice)
                : undefined;

        if (
            price !== undefined &&
            (!Number.isFinite(price) ||
                price < 0)
        ) {
            Alert.alert(
                "Validation",
                "Enter a valid purchase price."
            );

            return;
        }

        try {
            setSaving(true);

            await onSave({
                ...(initialData
                    ? {}
                    : {
                        catalog_id: catalogId,
                        size,
                    }),

                total_quantity: quantity,

                minimum_stock: minimum,

                purchase_price: price,

                supplier:
                    supplier.trim() || undefined,

                purchase_date:
                    purchaseDate.trim() || undefined,

                notes:
                    notes.trim() || undefined,
            });

            onClose();
        } catch {
            // Parent handles error message.
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>
                            {initialData
                                ? "Edit Inventory"
                                : "Add Inventory"}
                        </Text>

                        <Text style={styles.subtitle}>
                            {initialData
                                ? "Update inventory details"
                                : "Add stock for a uniform size"}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        disabled={saving}
                    >
                        <MaterialCommunityIcons
                            name="close"
                            size={24}
                            color="#444"
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={
                        styles.content
                    }
                >
                    {/* CATALOG */}

                    {!initialData && (
                        <>
                            <Text style={styles.label}>
                                Uniform
                            </Text>

                            <View style={styles.catalogContainer}>
                                {catalog.map((item) => {
                                    const selected =
                                        item.catalog_id ===
                                        catalogId;

                                    return (
                                        <TouchableOpacity
                                            key={
                                                item.catalog_id
                                            }
                                            style={[
                                                styles.catalogChip,
                                                selected &&
                                                styles.catalogChipActive,
                                            ]}
                                            onPress={() => {
                                                setCatalogId(
                                                    item.catalog_id
                                                );

                                                setSize("");
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.catalogText,
                                                    selected &&
                                                    styles.catalogTextActive,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {item.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {/* EDIT MODE INFO */}

                    {initialData && (
                        <View style={styles.infoCard}>
                            <MaterialCommunityIcons
                                name="tshirt-crew"
                                size={22}
                                color="#5B3DF5"
                            />

                            <View style={styles.infoContent}>
                                <Text style={styles.infoTitle}>
                                    {initialData.catalog_name}
                                </Text>

                                <Text style={styles.infoSubtitle}>
                                    Size: {initialData.size}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* SIZE */}

                    {!initialData && (
                        <>
                            <Text style={styles.label}>
                                Size
                            </Text>

                            {availableSizes.length ===
                                0 ? (
                                <Text style={styles.warning}>
                                    Select a uniform first to
                                    view available sizes.
                                </Text>
                            ) : (
                                <View style={styles.sizeContainer}>
                                    {availableSizes.map(
                                        (itemSize) => {
                                            const selected =
                                                size === itemSize;

                                            return (
                                                <TouchableOpacity
                                                    key={itemSize}
                                                    style={[
                                                        styles.sizeChip,
                                                        selected &&
                                                        styles.sizeChipActive,
                                                    ]}
                                                    onPress={() =>
                                                        setSize(
                                                            itemSize
                                                        )
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.sizeText,
                                                            selected &&
                                                            styles.sizeTextActive,
                                                        ]}
                                                    >
                                                        {itemSize}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        }
                                    )}
                                </View>
                            )}
                        </>
                    )}

                    {/* QUANTITY */}

                    <Text style={styles.label}>
                        Total Quantity
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 25"
                        keyboardType="numeric"
                        value={totalQuantity}
                        onChangeText={
                            setTotalQuantity
                        }
                    />

                    {/* MINIMUM STOCK */}

                    <Text style={styles.label}>
                        Minimum Stock
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 5"
                        keyboardType="numeric"
                        value={minimumStock}
                        onChangeText={
                            setMinimumStock
                        }
                    />

                    {/* PURCHASE PRICE */}

                    <Text style={styles.label}>
                        Purchase Price
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Optional"
                        keyboardType="decimal-pad"
                        value={purchasePrice}
                        onChangeText={
                            setPurchasePrice
                        }
                    />

                    {/* SUPPLIER */}

                    <Text style={styles.label}>
                        Supplier
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Optional"
                        value={supplier}
                        onChangeText={setSupplier}
                    />

                    {/* PURCHASE DATE */}

                    <Text style={styles.label}>
                        Purchase Date
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        value={purchaseDate}
                        onChangeText={
                            setPurchaseDate
                        }
                        autoCapitalize="none"
                    />

                    {/* NOTES */}

                    <Text style={styles.label}>
                        Notes
                    </Text>

                    <TextInput
                        style={[
                            styles.input,
                            styles.notesInput,
                        ]}
                        placeholder="Optional notes"
                        multiline
                        value={notes}
                        onChangeText={setNotes}
                    />

                    {/* SAVE */}

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            saving &&
                            styles.saveButtonDisabled,
                        ]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <Text style={styles.saveText}>
                            {saving
                                ? "Saving..."
                                : initialData
                                    ? "Update Inventory"
                                    : "Add Inventory"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                        disabled={saving}
                    >
                        <Text
                            style={styles.cancelText}
                        >
                            Cancel
                        </Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F7FC",
    },

    header: {
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 18,

        backgroundColor: "#FFFFFF",

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
    },

    title: {
        fontSize: 25,
        fontWeight: "800",
        color: "#16162E",
    },

    subtitle: {
        marginTop: 4,
        color: "#777",
        fontSize: 13,
    },

    closeButton: {
        width: 42,
        height: 42,

        borderRadius: 21,

        justifyContent: "center",
        alignItems: "center",

        backgroundColor: "#F1F0F5",
    },

    content: {
        padding: 20,
    },

    label: {
        marginBottom: 9,
        marginTop: 12,

        color: "#27272A",

        fontSize: 14,
        fontWeight: "700",
    },

    input: {
        height: 54,

        backgroundColor: "#FFFFFF",

        borderWidth: 1,
        borderColor: "#E3E1E8",

        borderRadius: 15,

        paddingHorizontal: 15,

        fontSize: 15,

        color: "#222",
    },

    notesInput: {
        height: 100,
        paddingTop: 15,
        textAlignVertical: "top",
    },

    catalogContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },

    catalogChip: {
        maxWidth: "100%",

        paddingHorizontal: 15,
        paddingVertical: 11,

        marginRight: 8,
        marginBottom: 8,

        borderRadius: 16,

        backgroundColor: "#FFFFFF",

        borderWidth: 1,
        borderColor: "#DDD",
    },

    catalogChipActive: {
        backgroundColor: "#5B3DF5",
        borderColor: "#5B3DF5",
    },

    catalogText: {
        color: "#555",
        fontWeight: "600",
    },

    catalogTextActive: {
        color: "#FFFFFF",
    },

    infoCard: {
        flexDirection: "row",
        alignItems: "center",

        padding: 16,

        borderRadius: 18,

        backgroundColor: "#EEE9FF",

        marginBottom: 10,
    },

    infoContent: {
        marginLeft: 12,
    },

    infoTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#27204A",
    },

    infoSubtitle: {
        marginTop: 3,
        color: "#665A8B",
    },

    sizeContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },

    sizeChip: {
        paddingHorizontal: 18,
        paddingVertical: 11,

        borderRadius: 18,

        backgroundColor: "#FFFFFF",

        borderWidth: 1,
        borderColor: "#DDD",

        marginRight: 8,
        marginBottom: 8,
    },

    sizeChipActive: {
        backgroundColor: "#5B3DF5",
        borderColor: "#5B3DF5",
    },

    sizeText: {
        color: "#555",
        fontWeight: "600",
    },

    sizeTextActive: {
        color: "#FFFFFF",
    },

    warning: {
        padding: 14,

        borderRadius: 14,

        backgroundColor: "#FFF4E5",

        color: "#B45309",
    },

    saveButton: {
        marginTop: 28,

        height: 56,

        borderRadius: 18,

        justifyContent: "center",
        alignItems: "center",

        backgroundColor: "#5B3DF5",
    },

    saveButtonDisabled: {
        opacity: 0.6,
    },

    saveText: {
        color: "#FFFFFF",

        fontSize: 16,
        fontWeight: "800",
    },

    cancelButton: {
        height: 52,

        justifyContent: "center",
        alignItems: "center",
    },

    cancelText: {
        color: "#555",
        fontWeight: "700",
    },
});