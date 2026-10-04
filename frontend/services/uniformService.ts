import api from "./api";

import {
    UniformDashboard,
    UniformCatalog,
    UniformInventory,
    MemberUniform,
    UniformPurchase,
    UniformRepair,
} from "../types/uniform";

// ============================================
// DASHBOARD
// ============================================

export const getUniformDashboard = async (): Promise<UniformDashboard> => {
    const response = await api.get("/uniforms/dashboard");
    return response.data;
};

// ============================================
// CATALOG
// ============================================

export const getUniformCatalog = async (): Promise<UniformCatalog[]> => {
    const response = await api.get("/uniforms/catalog");
    return response.data;
};

export const getUniformCatalogItem = async (
    catalogId: string
): Promise<UniformCatalog> => {
    const response = await api.get(`/uniforms/catalog/${catalogId}`);
    return response.data;
};

export const createUniformCatalog = async (
    data: Partial<UniformCatalog>
): Promise<UniformCatalog> => {
    const response = await api.post("/uniforms/catalog", data);
    return response.data;
};

export const updateUniformCatalog = async (
    catalogId: string,
    data: Partial<UniformCatalog>
) => {
    const response = await api.put(
        `/uniforms/catalog/${catalogId}`,
        data
    );

    return response.data;
};

export const deleteUniformCatalog = async (
    catalogId: string
) => {
    const response = await api.delete(
        `/uniforms/catalog/${catalogId}`
    );

    return response.data;
};

// ============================================
// INVENTORY
// ============================================

export const getUniformInventory =
    async (): Promise<UniformInventory[]> => {
        const response = await api.get(
            "/uniforms/inventory"
        );

        return response.data;
    };

export const getUniformInventoryItem =
    async (
        inventoryId: string
    ): Promise<UniformInventory> => {
        const response = await api.get(
            `/uniforms/inventory/${inventoryId}`
        );

        return response.data;
    };

export const createUniformInventory = async (
    data: Partial<UniformInventory>
): Promise<UniformInventory> => {
    const response = await api.post(
        "/uniforms/inventory",
        data
    );

    return response.data;
};

export const updateUniformInventory = async (
    inventoryId: string,
    data: Partial<UniformInventory>
): Promise<UniformInventory> => {
    const response = await api.put(
        `/uniforms/inventory/${inventoryId}`,
        data
    );

    return response.data;
};

export const deleteUniformInventory = async (
    inventoryId: string
) => {
    const response = await api.delete(
        `/uniforms/inventory/${inventoryId}`
    );

    return response.data;
};

// ============================================
// HELPERS
// ============================================

export const getMandatoryUniforms =
    async (): Promise<UniformCatalog[]> => {
        const catalog = await getUniformCatalog();

        return catalog.filter(
            item => item.is_mandatory
        );
    };

export const getOptionalUniforms =
    async (): Promise<UniformCatalog[]> => {
        const catalog = await getUniformCatalog();

        return catalog.filter(
            item => !item.is_mandatory
        );
    };

export const getInventoryByCategory =
    async (
        category: string
    ): Promise<UniformInventory[]> => {
        const inventory =
            await getUniformInventory();

        return inventory.filter(
            item => item.category === category
        );
    };

export const getLowStockItems =
    async (): Promise<UniformInventory[]> => {
        const inventory =
            await getUniformInventory();

        return inventory.filter(
            item =>
                item.available_quantity <=
                item.minimum_stock
        );
    };

export const getOutOfStockItems =
    async (): Promise<UniformInventory[]> => {
        const inventory =
            await getUniformInventory();

        return inventory.filter(
            item =>
                item.available_quantity <= 0
        );
    };

// ============================================
// MEMBER ASSIGNMENT
// ============================================

export const assignUniform = async (
    data: Partial<MemberUniform>
): Promise<MemberUniform> => {
    const response = await api.post("/uniforms/assign", data);
    return response.data;
};

export const returnUniform = async (
    assignmentId: string,
    data: {
        condition_returned: string;
        return_date: string;
        remarks?: string;
    }
) => {
    const response = await api.put(
        `/uniforms/return/${assignmentId}`,
        data
    );

    return response.data;
};

export const getAssignedUniforms =
    async (): Promise<any[]> => {
        const response = await api.get(
            "/uniforms/assigned"
        );

        return response.data;
    };

export const getAssignmentDetails =
    async (assignmentId: string) => {
        const response = await api.get(
            `/uniforms/assignment/${assignmentId}`
        );

        return response.data;
    };

// ============================================
// MEMBER
// ============================================

export const getMyUniforms =
    async (): Promise<any[]> => {
        const response = await api.get(
            "/uniforms/my"
        );

        return response.data;
    };

export const getMyUniformHistory =
    async (): Promise<any[]> => {
        const response = await api.get(
            "/uniforms/my/history"
        );

        return response.data;
    };

// ============================================
// REPAIR
// ============================================

export const getRepairs =
    async (): Promise<any[]> => {
        const response = await api.get(
            "/uniforms/repairs"
        );

        return response.data;
    };

export const getRepairDetails =
    async (repairId: string) => {
        const response = await api.get(
            `/uniforms/repair/${repairId}`
        );

        return response.data;
    };

export const createRepair =
    async (
        data: Partial<UniformRepair>
    ): Promise<UniformRepair> => {
        const response = await api.post(
            "/uniforms/repair",
            data
        );

        return response.data;
    };

export const updateRepair =
    async (
        repairId: string,
        data: Partial<UniformRepair>
    ) => {
        const response = await api.put(
            `/uniforms/repair/${repairId}`,
            data
        );

        return response.data;
    };

export const completeRepair =
    async (repairId: string) => {
        const response = await api.put(
            `/uniforms/repair/complete/${repairId}`
        );

        return response.data;
    };

export const deleteRepair =
    async (repairId: string) => {
        const response = await api.delete(
            `/uniforms/repair/${repairId}`
        );

        return response.data;
    };

// ============================================
// PURCHASE
// ============================================

export const getPurchases =
    async (): Promise<any[]> => {
        const response = await api.get(
            "/uniforms/purchases"
        );

        return response.data;
    };

export const getPurchaseDetails =
    async (purchaseId: string) => {
        const response = await api.get(
            `/uniforms/purchase/${purchaseId}`
        );

        return response.data;
    };

export const createPurchase =
    async (
        data: Partial<UniformPurchase>
    ): Promise<any> => {
        const response = await api.post(
            "/uniforms/purchase",
            data
        );

        return response.data;
    };

export default {
    // Dashboard
    getUniformDashboard,

    // Catalog
    getUniformCatalog,
    getUniformCatalogItem,
    createUniformCatalog,
    updateUniformCatalog,
    deleteUniformCatalog,

    // Inventory
    getUniformInventory,
    getUniformInventoryItem,
    createUniformInventory,
    updateUniformInventory,
    deleteUniformInventory,

    // Assignment
    assignUniform,
    returnUniform,
    getAssignedUniforms,
    getAssignmentDetails,

    // Member
    getMyUniforms,
    getMyUniformHistory,

    // Repairs
    getRepairs,
    getRepairDetails,
    createRepair,
    updateRepair,
    completeRepair,
    deleteRepair,

    // Purchases
    getPurchases,
    getPurchaseDetails,
    createPurchase,

    // Helpers
    getMandatoryUniforms,
    getOptionalUniforms,
    getInventoryByCategory,
    getLowStockItems,
    getOutOfStockItems,
};