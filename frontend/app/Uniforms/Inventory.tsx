import React, { useCallback, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import NotificationBell from "../../components/common/NotificationBell";

import UniformInventoryCard from "../../components/uniforms/UniformInventoryCard";

import UniformInventoryForm from "../../components/uniforms/UniformInventoryForm";

import useUniformInventory from "../../hooks/useUniformInventory";

import { useAuth } from "../../contexts/AuthContext";

import { UniformCatalog, UniformInventory } from "../../types/uniform";

import { getUniformCatalog } from "../../services/uniformService";

// ======================================================
// SCREEN
// ======================================================

export default function UniformInventoryScreen() {

    // ==================================================
    // AUTH
    // ==================================================

    const { user, hasPermission } = useAuth();

    const canManageUniforms =
        hasPermission("uniforms");

    const isAdmin =
        user?.role === "admin";


    // ==================================================
    // INVENTORY HOOK
    // ==================================================

    const {
        inventory,
        filteredInventory,

        loading,
        refreshing,
        error,

        search,
        setSearch,

        category,
        setCategory,

        stockFilter,
        setStockFilter,

        onRefresh,

        createInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,

        totalItems,
        totalQuantity,
        totalAvailable,
        totalAssigned,
        totalRepair,
        totalDamaged,

        lowStockItems,
        outOfStockItems,

    } = useUniformInventory();

    const [catalog, setCatalog] = useState<UniformCatalog[]>([]);

    // ==================================================
    // LOCAL STATE
    // ==================================================

    const [formVisible, setFormVisible] =
        useState(false);

    const [editingItem, setEditingItem] =
        useState<UniformInventory | null>(null);

    const [selectedItem, setSelectedItem] =
        useState<UniformInventory | null>(null);


    // ==================================================
    // CATEGORY LIST
    // ==================================================

    const categories = [
        "All",
        ...Array.from(
            new Set(
                inventory
                    .map((item) => item.category)
                    .filter(
                        (value): value is string =>
                            Boolean(value)
                    )
            )
        ),
    ];

    const loadCatalog = useCallback(async () => {
        try {
            const data = await getUniformCatalog();
            setCatalog(data);
        } catch (err) {
            console.error("Failed to load uniform catalog:", err);
        }
    }, []);
    React.useEffect(() => {
        loadCatalog();
    }, [loadCatalog]);


    // ==================================================
    // OPEN ADD
    // ==================================================

    const handleAddInventory = useCallback(() => {

        if (!canManageUniforms) {
            Alert.alert(
                "Permission Denied",
                "You do not have permission to manage uniforms."
            );

            return;
        }

        setEditingItem(null);
        setFormVisible(true);

    }, [canManageUniforms]);


    // ==================================================
    // OPEN EDIT
    // ==================================================

    const handleEdit = useCallback(
        (item: UniformInventory) => {

            if (!canManageUniforms) {
                Alert.alert(
                    "Permission Denied",
                    "You do not have permission to edit inventory."
                );

                return;
            }

            setEditingItem(item);
            setFormVisible(true);

        },
        [canManageUniforms]
    );


    // ==================================================
    // DELETE
    // ==================================================

    const handleDelete = useCallback(
        (item: UniformInventory) => {

            if (!isAdmin) {
                Alert.alert(
                    "Permission Denied",
                    "Only administrators can delete inventory."
                );

                return;
            }

            Alert.alert(
                "Delete Inventory",
                `Are you sure you want to delete ${item.catalog_name || "this inventory item"} (${item.size})?`,
                [
                    {
                        text: "Cancel",
                        style: "cancel",
                    },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {

                            try {

                                await deleteInventoryItem(
                                    item.inventory_id
                                );

                                Alert.alert(
                                    "Deleted",
                                    "Inventory deleted successfully."
                                );

                            } catch (err: any) {

                                Alert.alert(
                                    "Unable to Delete",
                                    err?.response?.data?.detail ||
                                    "This inventory item could not be deleted."
                                );

                            }

                        },
                    },
                ]
            );

        },
        [
            deleteInventoryItem,
            isAdmin,
        ]
    );


    // ==================================================
    // CARD PRESS
    // ==================================================

    const handleCardPress = useCallback(
        (item: UniformInventory) => {

            setSelectedItem(item);

        },
        []
    );


    // ==================================================
    // SAVE FORM
    // ==================================================

    const handleSave = useCallback(
        async (
            data: Partial<UniformInventory>
        ) => {

            if (editingItem) {

                await updateInventoryItem(
                    editingItem.inventory_id,
                    data
                );

                Alert.alert(
                    "Success",
                    "Inventory updated successfully."
                );

            } else {

                await createInventoryItem(
                    data
                );

                Alert.alert(
                    "Success",
                    "Inventory added successfully."
                );
            }

            setFormVisible(false);
            setEditingItem(null);

        },
        [
            editingItem,
            updateInventoryItem,
            createInventoryItem,
        ]
    );


    // ==================================================
    // CLOSE FORM
    // ==================================================

    const handleCloseForm = useCallback(() => {

        setFormVisible(false);
        setEditingItem(null);

    }, []);


    // ==================================================
    // CLOSE DETAILS
    // ==================================================

    const closeDetails = useCallback(() => {

        setSelectedItem(null);

    }, []);


    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {

        return (
            <View style={styles.loadingContainer}>

                <ActivityIndicator
                    size="large"
                    color="#5B3DF5"
                />

                <Text style={styles.loadingText}>
                    Loading inventory...
                </Text>

            </View>
        );
    }


    // ==================================================
    // MAIN SCREEN
    // ==================================================

    return (
        <View style={styles.container}>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#5B3DF5"]}
                        tintColor="#5B3DF5"
                    />
                }
                contentContainerStyle={
                    styles.scrollContent
                }
            >

                {/* ======================================
                    HEADER
                ====================================== */}

                <LinearGradient
                    colors={[
                        "#2B145A",
                        "#5B3DF5",
                    ]}
                    style={styles.header}
                >

                    <View
                        style={
                            styles.headerTop
                        }
                    >

                        <View
                            style={
                                styles.headerTextContainer
                            }
                        >

                            <Text
                                style={
                                    styles.headerTitle
                                }
                                allowFontScaling={false}
                            >
                                Uniform Inventory
                            </Text>

                            <Text
                                style={
                                    styles.headerSubtitle
                                }
                                allowFontScaling={false}
                            >
                                Track stock, sizes and availability
                            </Text>

                        </View>

                        <NotificationBell />

                    </View>


                    {/* HEADER TOTAL */}

                    <View
                        style={
                            styles.headerSummary
                        }
                    >

                        <View>
                            <Text
                                style={
                                    styles.headerSummaryLabel
                                }
                            >
                                Total Stock
                            </Text>

                            <Text
                                style={
                                    styles.headerSummaryValue
                                }
                            >
                                {totalQuantity}
                            </Text>
                        </View>


                        <View
                            style={
                                styles.headerDivider
                            }
                        />


                        <View>
                            <Text
                                style={
                                    styles.headerSummaryLabel
                                }
                            >
                                Available
                            </Text>

                            <Text
                                style={
                                    styles.headerSummaryValue
                                }
                            >
                                {totalAvailable}
                            </Text>
                        </View>


                        <View
                            style={
                                styles.headerDivider
                            }
                        />


                        <View>
                            <Text
                                style={
                                    styles.headerSummaryLabel
                                }
                            >
                                Assigned
                            </Text>

                            <Text
                                style={
                                    styles.headerSummaryValue
                                }
                            >
                                {totalAssigned}
                            </Text>
                        </View>

                    </View>

                </LinearGradient>


                {/* ======================================
                    ERROR
                ====================================== */}

                {error ? (

                    <View
                        style={
                            styles.errorCard
                        }
                    >

                        <MaterialCommunityIcons
                            name="alert-circle-outline"
                            size={24}
                            color="#DC2626"
                        />

                        <View
                            style={
                                styles.errorContent
                            }
                        >

                            <Text
                                style={
                                    styles.errorTitle
                                }
                            >
                                Unable to load inventory
                            </Text>

                            <Text
                                style={
                                    styles.errorText
                                }
                            >
                                {error}
                            </Text>

                        </View>

                        <TouchableOpacity
                            style={
                                styles.retryButton
                            }
                            onPress={onRefresh}
                        >
                            <Text
                                style={
                                    styles.retryText
                                }
                            >
                                Retry
                            </Text>
                        </TouchableOpacity>

                    </View>

                ) : null}


                {/* ======================================
                    ADD INVENTORY
                ====================================== */}

                {canManageUniforms && (

                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={
                            handleAddInventory
                        }
                    >

                        <LinearGradient
                            colors={[
                                "#7B4DFF",
                                "#4B1DFF",
                            ]}
                            style={
                                styles.addCard
                            }
                        >

                            <View
                                style={
                                    styles.addIcon
                                }
                            >

                                <MaterialCommunityIcons
                                    name="package-variant-plus"
                                    size={30}
                                    color="#6C4DFF"
                                />

                            </View>


                            <View
                                style={
                                    styles.addTextContainer
                                }
                            >

                                <Text
                                    style={
                                        styles.addTitle
                                    }
                                    allowFontScaling={
                                        false
                                    }
                                >
                                    Add Inventory
                                </Text>

                                <Text
                                    style={
                                        styles.addSubtitle
                                    }
                                    allowFontScaling={
                                        false
                                    }
                                >
                                    Add stock for a uniform size
                                </Text>

                            </View>


                            <MaterialCommunityIcons
                                name="plus-circle"
                                size={32}
                                color="#FFFFFF"
                            />

                        </LinearGradient>

                    </TouchableOpacity>

                )}


                {/* ======================================
                    SUMMARY CARDS
                ====================================== */}

                <View
                    style={
                        styles.summaryContainer
                    }
                >

                    <SummaryCard
                        icon="package-variant"
                        label="Items"
                        value={totalItems}
                        iconColor="#6C4DFF"
                        iconBackground="#EEE7FF"
                    />

                    <SummaryCard
                        icon="check-circle"
                        label="Available"
                        value={totalAvailable}
                        iconColor="#22C55E"
                        iconBackground="#E7FFF0"
                    />

                    <SummaryCard
                        icon="account-check"
                        label="Assigned"
                        value={totalAssigned}
                        iconColor="#3B82F6"
                        iconBackground="#E8F2FF"
                    />

                    <SummaryCard
                        icon="tools"
                        label="Repair"
                        value={totalRepair}
                        iconColor="#F59E0B"
                        iconBackground="#FFF5E7"
                    />

                </View>


                {/* ======================================
                    ALERTS
                ====================================== */}

                {(lowStockItems.length > 0 ||
                    outOfStockItems.length > 0) && (

                        <View
                            style={
                                styles.alertContainer
                            }
                        >

                            {outOfStockItems.length > 0 && (

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    style={
                                        styles.outOfStockAlert
                                    }
                                    onPress={() =>
                                        setStockFilter(
                                            "Out of Stock"
                                        )
                                    }
                                >

                                    <View
                                        style={
                                            styles.alertIconDanger
                                        }
                                    >
                                        <MaterialCommunityIcons
                                            name="alert-circle"
                                            size={22}
                                            color="#DC2626"
                                        />
                                    </View>

                                    <View
                                        style={
                                            styles.alertTextContainer
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.alertTitleDanger
                                            }
                                        >
                                            Out of Stock
                                        </Text>

                                        <Text
                                            style={
                                                styles.alertSubtitle
                                            }
                                        >
                                            {outOfStockItems.length} item
                                            {outOfStockItems.length === 1
                                                ? ""
                                                : "s"} need attention
                                        </Text>

                                    </View>

                                    <MaterialCommunityIcons
                                        name="chevron-right"
                                        size={24}
                                        color="#DC2626"
                                    />

                                </TouchableOpacity>

                            )}


                            {lowStockItems.length > 0 && (

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    style={
                                        styles.lowStockAlert
                                    }
                                    onPress={() =>
                                        setStockFilter(
                                            "Low Stock"
                                        )
                                    }
                                >

                                    <View
                                        style={
                                            styles.alertIconWarning
                                        }
                                    >
                                        <MaterialCommunityIcons
                                            name="alert"
                                            size={22}
                                            color="#D97706"
                                        />
                                    </View>

                                    <View
                                        style={
                                            styles.alertTextContainer
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.alertTitleWarning
                                            }
                                        >
                                            Low Stock
                                        </Text>

                                        <Text
                                            style={
                                                styles.alertSubtitle
                                            }
                                        >
                                            {lowStockItems.length} item
                                            {lowStockItems.length === 1
                                                ? ""
                                                : "s"} below minimum
                                        </Text>

                                    </View>

                                    <MaterialCommunityIcons
                                        name="chevron-right"
                                        size={24}
                                        color="#D97706"
                                    />

                                </TouchableOpacity>

                            )}

                        </View>

                    )}


                {/* ======================================
                    SEARCH
                ====================================== */}

                <View
                    style={
                        styles.searchRow
                    }
                >

                    <View
                        style={
                            styles.searchBox
                        }
                    >

                        <MaterialCommunityIcons
                            name="magnify"
                            size={23}
                            color="#888"
                        />

                        <TextInput
                            placeholder="Search uniforms..."
                            placeholderTextColor="#999"
                            value={search}
                            onChangeText={setSearch}
                            style={
                                styles.searchInput
                            }
                            returnKeyType="search"
                        />

                        {search.length > 0 && (

                            <TouchableOpacity
                                onPress={() =>
                                    setSearch("")
                                }
                            >

                                <MaterialCommunityIcons
                                    name="close-circle"
                                    size={21}
                                    color="#AAA"
                                />

                            </TouchableOpacity>

                        )}

                    </View>

                </View>


                {/* ======================================
                    CATEGORY
                ====================================== */}

                <Text
                    style={
                        styles.filterTitle
                    }
                >
                    Category
                </Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                        false
                    }
                    contentContainerStyle={
                        styles.chipContainer
                    }
                >

                    {categories.map(
                        (item) => (

                            <TouchableOpacity
                                key={item}
                                activeOpacity={0.8}
                                style={[
                                    styles.chip,
                                    category === item &&
                                    styles.activeChip,
                                ]}
                                onPress={() =>
                                    setCategory(
                                        item
                                    )
                                }
                            >

                                <Text
                                    style={[
                                        styles.chipText,
                                        category === item &&
                                        styles.activeChipText,
                                    ]}
                                >
                                    {item}
                                </Text>

                            </TouchableOpacity>

                        )
                    )}

                </ScrollView>


                {/* ======================================
                    STOCK FILTER
                ====================================== */}

                <Text
                    style={
                        styles.filterTitle
                    }
                >
                    Stock Status
                </Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                        false
                    }
                    contentContainerStyle={
                        styles.chipContainer
                    }
                >

                    {[
                        "All",
                        "Available",
                        "Low Stock",
                        "Out of Stock",
                    ].map(
                        (item) => (

                            <TouchableOpacity
                                key={item}
                                activeOpacity={0.8}
                                style={[
                                    styles.stockChip,
                                    stockFilter === item &&
                                    styles.activeStockChip,
                                ]}
                                onPress={() =>
                                    setStockFilter(
                                        item
                                    )
                                }
                            >

                                <Text
                                    style={[
                                        styles.stockChipText,
                                        stockFilter === item &&
                                        styles.activeStockChipText,
                                    ]}
                                >
                                    {item}
                                </Text>

                            </TouchableOpacity>

                        )
                    )}

                </ScrollView>


                {/* ======================================
                    LIST HEADER
                ====================================== */}

                <View
                    style={
                        styles.listHeader
                    }
                >

                    <View>

                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Inventory
                        </Text>

                        <Text
                            style={
                                styles.resultText
                            }
                        >
                            {filteredInventory.length} item
                            {filteredInventory.length === 1
                                ? ""
                                : "s"} found
                        </Text>

                    </View>

                    {category !== "All" ||
                        stockFilter !== "All" ||
                        search.length > 0 ? (

                        <TouchableOpacity
                            onPress={() => {
                                setSearch("");
                                setCategory("All");
                                setStockFilter("All");
                            }}
                        >

                            <Text
                                style={
                                    styles.clearText
                                }
                            >
                                Clear Filters
                            </Text>

                        </TouchableOpacity>

                    ) : null}

                </View>


                {/* ======================================
                    EMPTY STATE
                ====================================== */}

                {filteredInventory.length === 0 ? (

                    <View
                        style={
                            styles.emptyCard
                        }
                    >

                        <View
                            style={
                                styles.emptyIcon
                            }
                        >

                            <MaterialCommunityIcons
                                name="package-variant"
                                size={42}
                                color="#6C4DFF"
                            />

                        </View>

                        <Text
                            style={
                                styles.emptyTitle
                            }
                        >
                            No inventory found
                        </Text>

                        <Text
                            style={
                                styles.emptyText
                            }
                        >
                            {inventory.length === 0
                                ? "There is no uniform inventory yet."
                                : "Try changing your search or filters."}
                        </Text>

                        {inventory.length === 0 &&
                            canManageUniforms && (

                                <TouchableOpacity
                                    style={
                                        styles.emptyButton
                                    }
                                    onPress={
                                        handleAddInventory
                                    }
                                >

                                    <Text
                                        style={
                                            styles.emptyButtonText
                                        }
                                    >
                                        Add First Inventory
                                    </Text>

                                </TouchableOpacity>

                            )}

                    </View>

                ) : (

                    /* ==================================
                       INVENTORY LIST
                    ================================== */

                    filteredInventory.map(
                        (item) => (

                            <UniformInventoryCard
                                key={
                                    item.inventory_id
                                }
                                item={item}

                                canEdit={
                                    canManageUniforms
                                }

                                canDelete={
                                    isAdmin
                                }

                                onPress={
                                    handleCardPress
                                }

                                onEdit={
                                    handleEdit
                                }

                                onDelete={
                                    handleDelete
                                }
                            />

                        )
                    )

                )}


                {/* ======================================
                    BOTTOM SPACE
                ====================================== */}

                <View
                    style={{
                        height: 120,
                    }}
                />

            </ScrollView>


            {/* ==========================================
                INVENTORY FORM
            ========================================== */}

            {canManageUniforms && (

                <UniformInventoryForm
                    visible={
                        formVisible
                    }

                    initialData={
                        editingItem
                    }

                    catalog={catalog}

                    onClose={
                        handleCloseForm
                    }

                    onSave={
                        handleSave
                    }
                />

            )}


            {/* ==========================================
                DETAIL MODAL
            ========================================== */}

            {selectedItem && (

                <InventoryDetails
                    item={selectedItem}
                    visible={true}
                    onClose={
                        closeDetails
                    }
                    onEdit={() => {

                        closeDetails();

                        handleEdit(
                            selectedItem
                        );

                    }}
                    onDelete={() => {

                        closeDetails();

                        handleDelete(
                            selectedItem
                        );

                    }}
                    canEdit={
                        canManageUniforms
                    }
                    canDelete={
                        isAdmin
                    }
                />

            )}

        </View>
    );
}


// ======================================================
// SUMMARY CARD
// ======================================================

interface SummaryCardProps {
    icon: string;
    label: string;
    value: number;
    iconColor: string;
    iconBackground: string;
}

function SummaryCard({
    icon,
    label,
    value,
    iconColor,
    iconBackground,
}: SummaryCardProps) {

    return (

        <View
            style={
                styles.summaryCard
            }
        >

            <View
                style={[
                    styles.summaryIcon,
                    {
                        backgroundColor:
                            iconBackground,
                    },
                ]}
            >

                <MaterialCommunityIcons
                    name={
                        icon as any
                    }
                    size={20}
                    color={
                        iconColor
                    }
                />

            </View>

            <Text
                style={
                    styles.summaryValue
                }
            >
                {value}
            </Text>

            <Text
                style={
                    styles.summaryLabel
                }
                numberOfLines={1}
            >
                {label}
            </Text>

        </View>
    );
}


// ======================================================
// INVENTORY DETAILS
// ======================================================

interface InventoryDetailsProps {
    item: UniformInventory;
    visible: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    canEdit: boolean;
    canDelete: boolean;
}

function InventoryDetails({
    item,
    visible,
    onClose,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: InventoryDetailsProps) {

    if (!visible) {
        return null;
    }

    const total =
        item.total_quantity ?? 0;

    const available =
        item.available_quantity ?? 0;

    const assigned =
        item.assigned_quantity ?? 0;

    const repair =
        item.repair_quantity ?? 0;

    const damaged =
        item.damaged_quantity ?? 0;

    return (

        <View
            style={
                styles.detailOverlay
            }
        >

            <TouchableOpacity
                activeOpacity={1}
                style={
                    styles.detailBackdrop
                }
                onPress={onClose}
            />

            <View
                style={
                    styles.detailSheet
                }
            >

                <View
                    style={
                        styles.detailHandle
                    }
                />


                <View
                    style={
                        styles.detailHeader
                    }
                >

                    <View
                        style={
                            styles.detailHeaderText
                        }
                    >

                        <Text
                            style={
                                styles.detailTitle
                            }
                            numberOfLines={1}
                        >
                            {item.catalog_name ||
                                "Uniform"}
                        </Text>

                        <Text
                            style={
                                styles.detailSubtitle
                            }
                        >
                            {item.category ||
                                "Uncategorized"}
                            {" • "}
                            Size {item.size}
                        </Text>

                    </View>

                    <TouchableOpacity
                        style={
                            styles.detailClose
                        }
                        onPress={
                            onClose
                        }
                    >

                        <MaterialCommunityIcons
                            name="close"
                            size={22}
                            color="#444"
                        />

                    </TouchableOpacity>

                </View>


                {/* DETAILS */}

                <View
                    style={
                        styles.detailGrid
                    }
                >

                    <DetailStat
                        label="Total"
                        value={total}
                        icon="package-variant"
                    />

                    <DetailStat
                        label="Available"
                        value={available}
                        icon="check-circle"
                    />

                    <DetailStat
                        label="Assigned"
                        value={assigned}
                        icon="account-check"
                    />

                    <DetailStat
                        label="Repair"
                        value={repair}
                        icon="tools"
                    />

                    <DetailStat
                        label="Damaged"
                        value={damaged}
                        icon="alert-circle"
                    />

                </View>


                <View
                    style={
                        styles.detailInfo
                    }
                >

                    <DetailRow
                        label="Minimum Stock"
                        value={
                            String(
                                item.minimum_stock ?? 0
                            )
                        }
                    />

                    <DetailRow
                        label="Purchase Price"
                        value={
                            `₹${(
                                item.purchase_price ?? 0
                            ).toLocaleString("en-IN")}`
                        }
                    />

                    <DetailRow
                        label="Supplier"
                        value={
                            item.supplier ||
                            "Not specified"
                        }
                    />

                    <DetailRow
                        label="Purchase Date"
                        value={
                            item.purchase_date ||
                            "Not specified"
                        }
                    />

                    {item.notes ? (

                        <DetailRow
                            label="Notes"
                            value={
                                item.notes
                            }
                        />

                    ) : null}

                </View>


                {(canEdit || canDelete) && (

                    <View
                        style={
                            styles.detailActions
                        }
                    >

                        {canEdit && (

                            <TouchableOpacity
                                style={
                                    styles.detailEditButton
                                }
                                onPress={
                                    onEdit
                                }
                            >

                                <MaterialCommunityIcons
                                    name="pencil-outline"
                                    size={20}
                                    color="#5B3DF5"
                                />

                                <Text
                                    style={
                                        styles.detailEditText
                                    }
                                >
                                    Edit
                                </Text>

                            </TouchableOpacity>

                        )}


                        {canDelete && (

                            <TouchableOpacity
                                style={
                                    styles.detailDeleteButton
                                }
                                onPress={
                                    onDelete
                                }
                            >

                                <MaterialCommunityIcons
                                    name="delete-outline"
                                    size={20}
                                    color="#EF4444"
                                />

                                <Text
                                    style={
                                        styles.detailDeleteText
                                    }
                                >
                                    Delete
                                </Text>

                            </TouchableOpacity>

                        )}

                    </View>

                )}

            </View>

        </View>
    );
}


// ======================================================
// DETAIL STAT
// ======================================================

interface DetailStatProps {
    label: string;
    value: number;
    icon: string;
}

function DetailStat({
    label,
    value,
    icon,
}: DetailStatProps) {

    return (

        <View
            style={
                styles.detailStat
            }
        >

            <MaterialCommunityIcons
                name={
                    icon as any
                }
                size={20}
                color="#5B3DF5"
            />

            <Text
                style={
                    styles.detailStatValue
                }
            >
                {value}
            </Text>

            <Text
                style={
                    styles.detailStatLabel
                }
            >
                {label}
            </Text>

        </View>
    );
}


// ======================================================
// DETAIL ROW
// ======================================================

interface DetailRowProps {
    label: string;
    value: string;
}

function DetailRow({
    label,
    value,
}: DetailRowProps) {

    return (

        <View
            style={
                styles.detailRow
            }
        >

            <Text
                style={
                    styles.detailRowLabel
                }
            >
                {label}
            </Text>

            <Text
                style={
                    styles.detailRowValue
                }
                numberOfLines={3}
            >
                {value}
            </Text>

        </View>
    );
}


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F6F4FF",
    },

    scrollContent: {
        paddingBottom: 20,
    },

    // ==================================================
    // LOADING
    // ==================================================

    loadingContainer: {
        flex: 1,
        backgroundColor: "#F6F4FF",
        justifyContent: "center",
        alignItems: "center",
    },

    loadingText: {
        marginTop: 12,
        color: "#666",
        fontSize: 15,
        fontWeight: "600",
    },

    // ==================================================
    // HEADER
    // ==================================================

    header: {
        paddingTop: 65,
        paddingHorizontal: 22,
        paddingBottom: 28,

        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,

        overflow: "hidden",
    },

    headerTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
    },

    headerTextContainer: {
        flex: 1,
        marginRight: 12,
    },

    headerTitle: {
        fontSize: 30,
        fontWeight: "800",
        color: "#FFFFFF",
    },

    headerSubtitle: {
        marginTop: 6,
        fontSize: 14,
        lineHeight: 20,
        color: "rgba(255,255,255,0.82)",
    },

    headerSummary: {
        marginTop: 24,
        padding: 18,

        borderRadius: 22,

        backgroundColor:
            "rgba(255,255,255,0.13)",

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
    },

    headerSummaryLabel: {
        color: "rgba(255,255,255,0.72)",
        fontSize: 11,
        fontWeight: "600",
        textAlign: "center",
    },

    headerSummaryValue: {
        marginTop: 4,
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "800",
        textAlign: "center",
    },

    headerDivider: {
        width: 1,
        height: 34,
        backgroundColor:
            "rgba(255,255,255,0.22)",
    },

    // ==================================================
    // ERROR
    // ==================================================

    errorCard: {
        marginHorizontal: 16,
        marginTop: 18,

        padding: 16,

        borderRadius: 18,

        backgroundColor: "#FFF1F2",

        flexDirection: "row",
        alignItems: "center",

        borderWidth: 1,
        borderColor: "#FECACA",
    },

    errorContent: {
        flex: 1,
        marginLeft: 12,
    },

    errorTitle: {
        color: "#991B1B",
        fontWeight: "800",
        fontSize: 14,
    },

    errorText: {
        marginTop: 3,
        color: "#B91C1C",
        fontSize: 12,
    },

    retryButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: "#DC2626",
        marginLeft: 8,
    },

    retryText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "800",
    },

    // ==================================================
    // ADD
    // ==================================================

    addCard: {
        marginHorizontal: 18,
        marginTop: -4,

        borderRadius: 25,

        padding: 18,

        flexDirection: "row",
        alignItems: "center",

        shadowColor: "#5B3DF5",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.28,
        shadowRadius: 14,

        elevation: 9,
    },

    addIcon: {
        width: 58,
        height: 58,
        borderRadius: 29,

        backgroundColor: "#FFFFFF",

        justifyContent: "center",
        alignItems: "center",

        marginRight: 14,
    },

    addTextContainer: {
        flex: 1,
    },

    addTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "800",
    },

    addSubtitle: {
        color: "#E9DDFF",
        fontSize: 12,
        marginTop: 4,
    },

    // ==================================================
    // SUMMARY
    // ==================================================

    summaryContainer: {
        marginHorizontal: 14,
        marginTop: 18,

        backgroundColor: "#FFFFFF",

        borderRadius: 24,

        padding: 14,

        flexDirection: "row",
        justifyContent: "space-between",

        elevation: 3,
    },

    summaryCard: {
        flex: 1,
        alignItems: "center",
    },

    summaryIcon: {
        width: 40,
        height: 40,

        borderRadius: 20,

        justifyContent: "center",
        alignItems: "center",
    },

    summaryValue: {
        marginTop: 7,
        fontSize: 19,
        fontWeight: "800",
        color: "#16162E",
    },

    summaryLabel: {
        marginTop: 2,
        color: "#777",
        fontSize: 10,
        fontWeight: "600",
    },

    // ==================================================
    // ALERTS
    // ==================================================

    alertContainer: {
        marginHorizontal: 16,
        marginTop: 16,
    },

    outOfStockAlert: {
        backgroundColor: "#FFF1F2",

        borderRadius: 18,

        padding: 14,

        flexDirection: "row",
        alignItems: "center",

        borderWidth: 1,
        borderColor: "#FECACA",

        marginBottom: 9,
    },

    lowStockAlert: {
        backgroundColor: "#FFF8EB",

        borderRadius: 18,

        padding: 14,

        flexDirection: "row",
        alignItems: "center",

        borderWidth: 1,
        borderColor: "#FED7AA",
    },

    alertIconDanger: {
        width: 42,
        height: 42,

        borderRadius: 21,

        justifyContent: "center",
        alignItems: "center",

        backgroundColor: "#FFE4E6",
    },

    alertIconWarning: {
        width: 42,
        height: 42,

        borderRadius: 21,

        justifyContent: "center",
        alignItems: "center",

        backgroundColor: "#FFEDD5",
    },

    alertTextContainer: {
        flex: 1,
        marginLeft: 11,
    },

    alertTitleDanger: {
        color: "#B91C1C",
        fontSize: 14,
        fontWeight: "800",
    },

    alertTitleWarning: {
        color: "#B45309",
        fontSize: 14,
        fontWeight: "800",
    },

    alertSubtitle: {
        color: "#777",
        fontSize: 12,
        marginTop: 2,
    },

    // ==================================================
    // SEARCH
    // ==================================================

    searchRow: {
        marginHorizontal: 18,
        marginTop: 20,
    },

    searchBox: {
        height: 56,

        borderRadius: 18,

        backgroundColor: "#FFFFFF",

        flexDirection: "row",
        alignItems: "center",

        paddingHorizontal: 16,

        elevation: 2,
    },

    searchInput: {
        flex: 1,
        marginLeft: 9,

        color: "#222",

        fontSize: 15,
    },

    // ==================================================
    // FILTERS
    // ==================================================

    filterTitle: {
        marginTop: 19,
        marginLeft: 20,
        marginBottom: 8,

        color: "#333",

        fontSize: 14,
        fontWeight: "800",
    },

    chipContainer: {
        paddingHorizontal: 14,
    },

    chip: {
        paddingHorizontal: 17,
        paddingVertical: 10,

        borderRadius: 20,

        backgroundColor: "#FFFFFF",

        borderWidth: 1,
        borderColor: "#E3E0EA",

        marginHorizontal: 4,
    },

    activeChip: {
        backgroundColor: "#6C4DFF",
        borderColor: "#6C4DFF",
    },

    chipText: {
        color: "#555",
        fontSize: 13,
        fontWeight: "700",
    },

    activeChipText: {
        color: "#FFFFFF",
    },

    stockChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,

        borderRadius: 20,

        backgroundColor: "#FFFFFF",

        borderWidth: 1,
        borderColor: "#E3E0EA",

        marginHorizontal: 4,
    },

    activeStockChip: {
        backgroundColor: "#5B3DF5",
        borderColor: "#5B3DF5",
    },

    stockChipText: {
        color: "#555",
        fontSize: 13,
        fontWeight: "700",
    },

    activeStockChipText: {
        color: "#FFFFFF",
    },

    // ==================================================
    // LIST HEADER
    // ==================================================

    listHeader: {
        marginHorizontal: 20,
        marginTop: 25,
        marginBottom: 13,

        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
    },

    sectionTitle: {
        fontSize: 23,
        fontWeight: "800",
        color: "#16162E",
    },

    resultText: {
        marginTop: 3,
        color: "#888",
        fontSize: 12,
    },

    clearText: {
        color: "#5B3DF5",
        fontSize: 12,
        fontWeight: "800",
        marginBottom: 2,
    },

    // ==================================================
    // EMPTY
    // ==================================================

    emptyCard: {
        marginHorizontal: 18,

        paddingVertical: 45,
        paddingHorizontal: 25,

        borderRadius: 24,

        backgroundColor: "#FFFFFF",

        alignItems: "center",

        elevation: 2,
    },

    emptyIcon: {
        width: 80,
        height: 80,

        borderRadius: 40,

        justifyContent: "center",
        alignItems: "center",

        backgroundColor: "#EEE7FF",
    },

    emptyTitle: {
        marginTop: 17,

        color: "#222",
        fontSize: 18,
        fontWeight: "800",
    },

    emptyText: {
        marginTop: 7,

        color: "#777",
        fontSize: 13,

        textAlign: "center",
        lineHeight: 20,
    },

    emptyButton: {
        marginTop: 18,

        paddingHorizontal: 20,
        paddingVertical: 12,

        borderRadius: 14,

        backgroundColor: "#5B3DF5",
    },

    emptyButtonText: {
        color: "#FFFFFF",
        fontWeight: "800",
    },

    // ==================================================
    // DETAIL SHEET
    // ==================================================

    detailOverlay: {
        position: "absolute",

        left: 0,
        right: 0,
        top: 0,
        bottom: 0,

        justifyContent: "flex-end",

        zIndex: 100,
    },

    detailBackdrop: {
        position: "absolute",

        left: 0,
        right: 0,
        top: 0,
        bottom: 0,

        backgroundColor:
            "rgba(0,0,0,0.42)",
    },

    detailSheet: {
        backgroundColor: "#FFFFFF",

        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,

        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 28,

        maxHeight: "78%",
    },

    detailHandle: {
        alignSelf: "center",

        width: 42,
        height: 5,

        borderRadius: 5,

        backgroundColor: "#DDD",

        marginBottom: 16,
    },

    detailHeader: {
        flexDirection: "row",
        alignItems: "center",

        justifyContent: "space-between",
    },

    detailHeaderText: {
        flex: 1,
        marginRight: 12,
    },

    detailTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#16162E",
    },

    detailSubtitle: {
        marginTop: 5,
        color: "#777",
        fontSize: 13,
    },

    detailClose: {
        width: 42,
        height: 42,

        borderRadius: 21,

        justifyContent: "center",
        alignItems: "center",

        backgroundColor: "#F1F0F5",
    },

    detailGrid: {
        marginTop: 20,

        flexDirection: "row",
        flexWrap: "wrap",

        backgroundColor: "#F8F7FC",

        borderRadius: 20,

        paddingVertical: 14,
    },

    detailStat: {
        width: "33.33%",

        alignItems: "center",

        paddingVertical: 9,
    },

    detailStatValue: {
        marginTop: 4,

        fontSize: 18,
        fontWeight: "800",

        color: "#222",
    },

    detailStatLabel: {
        marginTop: 2,

        fontSize: 10,

        color: "#777",
    },

    detailInfo: {
        marginTop: 17,

        backgroundColor: "#FAFAFC",

        borderRadius: 18,

        paddingHorizontal: 15,
    },

    detailRow: {
        minHeight: 45,

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        borderBottomWidth: 1,
        borderBottomColor: "#EEEEF2",
    },

    detailRowLabel: {
        color: "#777",
        fontSize: 12,
        fontWeight: "600",

        flex: 1,
    },

    detailRowValue: {
        color: "#222",
        fontSize: 13,
        fontWeight: "700",

        flex: 1,

        textAlign: "right",
    },

    detailActions: {
        flexDirection: "row",

        gap: 10,

        marginTop: 18,
    },

    detailEditButton: {
        flex: 1,

        height: 48,

        borderRadius: 14,

        backgroundColor: "#F1EEFF",

        flexDirection: "row",

        alignItems: "center",
        justifyContent: "center",
    },

    detailEditText: {
        marginLeft: 7,

        color: "#5B3DF5",

        fontWeight: "800",
    },

    detailDeleteButton: {
        flex: 1,

        height: 48,

        borderRadius: 14,

        backgroundColor: "#FFF0F0",

        flexDirection: "row",

        alignItems: "center",
        justifyContent: "center",
    },

    detailDeleteText: {
        marginLeft: 7,

        color: "#EF4444",

        fontWeight: "800",
    },

});