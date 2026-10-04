import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    UniformInventory,
} from "../types/uniform";

import {
    getUniformInventory,
    createUniformInventory,
    updateUniformInventory,
    deleteUniformInventory,
} from "../services/uniformService";

export default function useUniformInventory() {
    // ==========================================
    // STATE
    // ==========================================

    const [inventory, setInventory] =
        useState<UniformInventory[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    // ==========================================
    // SEARCH / FILTER
    // ==========================================

    const [search, setSearch] =
        useState("");

    const [category, setCategory] =
        useState("All");

    const [stockFilter, setStockFilter] =
        useState("All");

    // ==========================================
    // LOAD INVENTORY
    // ==========================================

    const loadInventory = useCallback(
        async () => {
            try {
                setError("");

                const data =
                    await getUniformInventory();

                setInventory(data);
            } catch (err: any) {
                console.error(
                    "Failed to load inventory:",
                    err
                );

                setError(
                    err?.response?.data?.detail ??
                    "Failed to load inventory."
                );
            }
        },
        []
    );

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    const loadData = useCallback(
        async () => {
            try {
                setLoading(true);

                setError("");

                await loadInventory();
            } finally {
                setLoading(false);
            }
        },
        [loadInventory]
    );

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ==========================================
    // REFRESH
    // ==========================================

    const onRefresh = useCallback(
        async () => {
            try {
                setRefreshing(true);

                await loadInventory();
            } finally {
                setRefreshing(false);
            }
        },
        [loadInventory]
    );

    // ==========================================
    // FILTERED INVENTORY
    // ==========================================

    const filteredInventory = useMemo(() => {
        let data = [...inventory];

        // Category
        if (category !== "All") {
            data = data.filter(
                (item) =>
                    item.category === category
            );
        }

        // Search
        const keyword =
            search.trim().toLowerCase();

        if (keyword) {
            data = data.filter((item) => {
                return (
                    item.catalog_name
                        ?.toLowerCase()
                        .includes(keyword) ||

                    item.category
                        ?.toLowerCase()
                        .includes(keyword) ||

                    item.size
                        ?.toLowerCase()
                        .includes(keyword) ||

                    item.supplier
                        ?.toLowerCase()
                        .includes(keyword)
                );
            });
        }

        // Stock filter
        if (stockFilter === "Low Stock") {
            data = data.filter(
                (item) =>
                    item.available_quantity <=
                    item.minimum_stock
            );
        }

        if (stockFilter === "Out of Stock") {
            data = data.filter(
                (item) =>
                    item.available_quantity <= 0
            );
        }

        if (stockFilter === "Available") {
            data = data.filter(
                (item) =>
                    item.available_quantity > 0
            );
        }

        return data;
    }, [
        inventory,
        category,
        search,
        stockFilter,
    ]);

    // ==========================================
    // CREATE
    // ==========================================

    const createInventoryItem = async (
        data: Partial<UniformInventory>
    ) => {
        try {
            setError("");

            await createUniformInventory(data);

            await loadInventory();

            return true;
        } catch (err: any) {
            console.error(
                "Create inventory failed:",
                err
            );

            setError(
                err?.response?.data?.detail ??
                "Failed to create inventory."
            );

            throw err;
        }
    };

    // ==========================================
    // UPDATE
    // ==========================================

    const updateInventoryItem = async (
        inventoryId: string,
        data: Partial<UniformInventory>
    ) => {
        try {
            setError("");

            await updateUniformInventory(
                inventoryId,
                data
            );

            await loadInventory();

            return true;
        } catch (err: any) {
            console.error(
                "Update inventory failed:",
                err
            );

            setError(
                err?.response?.data?.detail ??
                "Failed to update inventory."
            );

            throw err;
        }
    };

    // ==========================================
    // DELETE
    // ==========================================

    const deleteInventoryItem = async (
        inventoryId: string
    ) => {
        try {
            setError("");

            await deleteUniformInventory(
                inventoryId
            );

            await loadInventory();

            return true;
        } catch (err: any) {
            console.error(
                "Delete inventory failed:",
                err
            );

            setError(
                err?.response?.data?.detail ??
                "Failed to delete inventory."
            );

            throw err;
        }
    };

    // ==========================================
    // SUMMARY
    // ==========================================

    const totalItems =
        inventory.length;

    const totalQuantity =
        inventory.reduce(
            (total, item) =>
                total +
                (item.total_quantity ?? 0),
            0
        );

    const totalAvailable =
        inventory.reduce(
            (total, item) =>
                total +
                (item.available_quantity ?? 0),
            0
        );

    const totalAssigned =
        inventory.reduce(
            (total, item) =>
                total +
                (item.assigned_quantity ?? 0),
            0
        );

    const totalRepair =
        inventory.reduce(
            (total, item) =>
                total +
                (item.repair_quantity ?? 0),
            0
        );

    const totalDamaged =
        inventory.reduce(
            (total, item) =>
                total +
                (item.damaged_quantity ?? 0),
            0
        );

    const lowStockItems =
        inventory.filter(
            (item) =>
                item.available_quantity <=
                item.minimum_stock
        );

    const outOfStockItems =
        inventory.filter(
            (item) =>
                item.available_quantity <= 0
        );

    return {
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

        loadInventory,
        loadData,
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

        setInventory,
    };
}