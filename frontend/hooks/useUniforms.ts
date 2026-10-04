import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    UniformCatalog,
    UniformDashboard,
    UniformInventory,
} from "../types/uniform";

import {
    getUniformDashboard,
    getUniformCatalog,
    getUniformInventory,

    createUniformCatalog,
    updateUniformCatalog,
    deleteUniformCatalog,

    createUniformInventory,
    updateUniformInventory,
    deleteUniformInventory,
} from "../services/uniformService";

import { useAuth } from "../contexts/AuthContext";

export default function useUniforms() {

    // ==========================================
    // AUTH / PERMISSIONS
    // ==========================================

    const { user, hasPermission } = useAuth();

    const isAdmin =
        user?.role === "admin";

    const canManageUniforms =
        isAdmin ||
        hasPermission("uniforms");

    // ==========================================
    // LOADING
    // ==========================================

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    // ==========================================
    // DATA
    // ==========================================

    const [dashboard, setDashboard] =
        useState<UniformDashboard | null>(null);

    const [catalog, setCatalog] =
        useState<UniformCatalog[]>([]);

    const [inventory, setInventory] =
        useState<UniformInventory[]>([]);

    // ==========================================
    // SEARCH
    // ==========================================

    const [search, setSearch] =
        useState("");

    // ==========================================
    // CATEGORY
    // ==========================================

    const [category, setCategory] =
        useState("All Items");

    // ==========================================
    // INVENTORY FILTER
    // ==========================================

    const filteredInventory =
        useMemo(() => {

            let data = [...inventory];

            if (category !== "All Items") {

                data = data.filter(
                    item =>
                        item.category === category
                );

            }

            const keyword =
                search.trim().toLowerCase();

            if (keyword) {

                data = data.filter(item => {

                    return (
                        item.catalog_name
                            ?.toLowerCase()
                            .includes(keyword) ||

                        item.category
                            ?.toLowerCase()
                            .includes(keyword) ||

                        item.size
                            ?.toLowerCase()
                            .includes(keyword)
                    );

                });

            }

            return data;

        }, [
            inventory,
            category,
            search,
        ]);

    // ==========================================
    // DASHBOARD LOADER
    // ==========================================

    const loadDashboard =
        useCallback(async () => {

            if (!canManageUniforms) {

                setDashboard(null);

                return;

            }

            const data =
                await getUniformDashboard();

            setDashboard(data);

        }, [
            canManageUniforms,
        ]);

    // ==========================================
    // CATALOG LOADER
    // ==========================================

    const loadCatalog =
        useCallback(async () => {

            const data =
                await getUniformCatalog();

            setCatalog(data);

        }, []);

    // ==========================================
    // INVENTORY LOADER
    // ==========================================

    const loadInventory =
        useCallback(async () => {

            if (!canManageUniforms) {

                setInventory([]);

                return;

            }

            const data =
                await getUniformInventory();

            setInventory(data);

        }, [
            canManageUniforms,
        ]);

    // ==========================================
    // INITIAL LOADER
    // ==========================================

    const loadData =
        useCallback(async () => {

            try {

                setLoading(true);

                setError("");

                // Catalog is available
                // to every authenticated user.

                await loadCatalog();

                // Dashboard + inventory
                // are management-only.

                if (canManageUniforms) {

                    await Promise.all([
                        loadDashboard(),
                        loadInventory(),
                    ]);

                } else {

                    setDashboard(null);
                    setInventory([]);

                }

            } catch (err: any) {

                console.error(
                    "Failed to load uniforms:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Failed to load uniforms."
                );

            } finally {

                setLoading(false);

            }

        }, [
            loadCatalog,
            loadDashboard,
            loadInventory,
            canManageUniforms,
        ]);

    // ==========================================
    // REFRESH
    // ==========================================

    const onRefresh =
        useCallback(async () => {

            try {

                setRefreshing(true);

                setError("");

                await loadCatalog();

                if (canManageUniforms) {

                    await Promise.all([
                        loadDashboard(),
                        loadInventory(),
                    ]);

                }

            } catch (err: any) {

                console.error(
                    "Uniform refresh failed:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Failed to refresh uniforms."
                );

            } finally {

                setRefreshing(false);

            }

        }, [
            loadCatalog,
            loadDashboard,
            loadInventory,
            canManageUniforms,
        ]);

    // ==========================================
    // INITIAL EFFECT
    // ==========================================

    useEffect(() => {

        if (!user) {
            return;
        }

        loadData();

    }, [
        user,
        loadData,
    ]);

    // ==========================================
    // CATALOG ACTIONS
    // ==========================================

    const createCatalog =
        async (
            data: Partial<UniformCatalog>
        ) => {

            if (!canManageUniforms) {
                return false;
            }

            try {

                setError("");

                await createUniformCatalog(
                    data
                );

                await loadData();

                return true;

            } catch (err) {

                console.error(
                    "Create catalog failed:",
                    err
                );

                return false;

            }

        };

    const updateCatalog =
        async (
            catalogId: string,
            data: Partial<UniformCatalog>
        ) => {

            if (!canManageUniforms) {
                return false;
            }

            try {

                setError("");

                await updateUniformCatalog(
                    catalogId,
                    data
                );

                await loadData();

                return true;

            } catch (err) {

                console.error(
                    "Update catalog failed:",
                    err
                );

                return false;

            }

        };

    const deleteCatalog =
        async (
            catalogId: string
        ) => {

            if (!isAdmin) {
                return false;
            }

            try {

                setError("");

                await deleteUniformCatalog(
                    catalogId
                );

                await loadData();

                return true;

            } catch (err) {

                console.error(
                    "Delete catalog failed:",
                    err
                );

                return false;

            }

        };

    // ==========================================
    // INVENTORY ACTIONS
    // ==========================================

    const createInventoryItem =
        async (
            data: Partial<UniformInventory>
        ) => {

            if (!canManageUniforms) {
                return false;
            }

            try {

                setError("");

                await createUniformInventory(
                    data
                );

                await loadData();

                return true;

            } catch (err) {

                console.error(
                    "Create inventory failed:",
                    err
                );

                return false;

            }

        };

    const updateInventoryItem =
        async (
            inventoryId: string,
            data: Partial<UniformInventory>
        ) => {

            if (!canManageUniforms) {
                return false;
            }

            try {

                setError("");

                await updateUniformInventory(
                    inventoryId,
                    data
                );

                await loadData();

                return true;

            } catch (err) {

                console.error(
                    "Update inventory failed:",
                    err
                );

                return false;

            }

        };

    const deleteInventoryItem =
        async (
            inventoryId: string
        ) => {

            if (!isAdmin) {
                return false;
            }

            try {

                setError("");

                await deleteUniformInventory(
                    inventoryId
                );

                await loadData();

                return true;

            } catch (err) {

                console.error(
                    "Delete inventory failed:",
                    err
                );

                return false;

            }

        };

    // ==========================================
    // DASHBOARD HELPERS
    // ==========================================

    const lowStockItems =
        dashboard?.alerts?.low_stock ?? [];

    const outOfStockItems =
        dashboard?.alerts?.out_of_stock ?? [];

    const summary =
        dashboard?.summary;

    const totalInventoryValue =
        summary?.inventory_value ?? 0;

    const totalAvailable =
        summary?.available_stock ?? 0;

    const totalAssigned =
        summary?.assigned_stock ?? 0;

    const totalRepair =
        summary?.repair_stock ?? 0;

    const totalDamaged =
        summary?.damaged_stock ?? 0;

    // ==========================================
    // RETURN
    // ==========================================

    return {

        // Authentication
        user,
        isAdmin,
        canManageUniforms,

        // States
        loading,
        refreshing,
        error,

        // Data
        dashboard,
        summary,
        catalog,
        inventory,

        // Lists
        filteredInventory,
        lowStockItems,
        outOfStockItems,

        // Totals
        totalInventoryValue,
        totalAvailable,
        totalAssigned,
        totalRepair,
        totalDamaged,

        // Search
        search,
        setSearch,

        // Category
        category,
        setCategory,

        // Loaders
        loadData,
        loadCatalog,
        loadInventory,
        loadDashboard,
        onRefresh,

        // Catalog
        createCatalog,
        updateCatalog,
        deleteCatalog,

        // Inventory
        createInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,

        // Internal setters
        setDashboard,
        setCatalog,
        setInventory,
    };
}