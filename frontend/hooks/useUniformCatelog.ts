import { useCallback, useEffect, useMemo, useState } from "react";

import {
    UniformCatalog,
} from "../types/uniform";

import {
    getUniformCatalog,
    createUniformCatalog,
    updateUniformCatalog,
    deleteUniformCatalog,
} from "../services/uniformService";

export default function useUniformCatalog() {

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");

    const [catalog, setCatalog] = useState<UniformCatalog[]>([]);

    const [search, setSearch] = useState("");

    const [category, setCategory] = useState("All");

    // =====================================
    // Filtered Catalog
    // =====================================

    const filteredCatalog = useMemo(() => {

        let data = [...catalog];

        if (category !== "All") {
            data = data.filter(
                item => item.category === category
            );
        }

        if (search.trim()) {

            const keyword = search.toLowerCase();

            data = data.filter(item =>
                item.name.toLowerCase().includes(keyword) ||

                item.category.toLowerCase().includes(keyword) ||

                item.description
                    ?.toLowerCase()
                    .includes(keyword)
            );

        }

        return data;

    }, [catalog, search, category]);

    // =====================================
    // Loader
    // =====================================

    const loadCatalog = useCallback(async () => {

        try {

            setLoading(true);

            setError("");

            const response = await getUniformCatalog();

            setCatalog(response);

        } catch (err: any) {

            setError(
                err?.response?.data?.detail ??
                "Failed to load catalog."
            );

        } finally {

            setLoading(false);

        }

    }, []);

    useEffect(() => {

        loadCatalog();

    }, [loadCatalog]);

    // =====================================
    // Refresh
    // =====================================

    const onRefresh = async () => {

        try {

            setRefreshing(true);

            await loadCatalog();

        } finally {

            setRefreshing(false);

        }

    };

    // =====================================
    // CRUD
    // =====================================

    const addCatalog = async (
        data: Partial<UniformCatalog>
    ) => {

        await createUniformCatalog(data);

        await loadCatalog();

    };

    const editCatalog = async (
        catalogId: string,
        data: Partial<UniformCatalog>
    ) => {

        await updateUniformCatalog(
            catalogId,
            data
        );

        await loadCatalog();

    };

    const removeCatalog = async (
        catalogId: string
    ) => {

        await deleteUniformCatalog(catalogId);

        await loadCatalog();

    };

    return {

        loading,

        refreshing,

        error,

        catalog,

        filteredCatalog,

        search,

        setSearch,

        category,

        setCategory,

        onRefresh,

        addCatalog,

        editCatalog,

        removeCatalog,

    };

}