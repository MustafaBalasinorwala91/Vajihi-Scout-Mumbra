import React, { useState } from "react";

import {
    View,
    Text,
    StyleSheet,
    RefreshControl,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import {
    Ionicons,
    MaterialCommunityIcons,
} from "@expo/vector-icons";

import { useRouter } from "expo-router";

import { useAuth } from "../../contexts/AuthContext";

import useUniformCatalog from "../../hooks/useUniformCatelog";

import CatalogCard from "../../components/uniforms/UniformCatalogCard";
import CatalogForm from "../../components/uniforms/UniformCatalogForm";

import UniformFloatingMenu from "../../components/uniforms/UniformFloatingMenu";

export default function CatalogScreen() {

    const router = useRouter();

    const { user, hasPermission } = useAuth();

    const {

        loading,

        refreshing,

        error,

        filteredCatalog,

        search,

        setSearch,

        category,

        setCategory,

        onRefresh,

        addCatalog,

        editCatalog,

        removeCatalog,

    } = useUniformCatalog();

    const isAdmin = user?.role === "admin";

    const canEdit =
        isAdmin || hasPermission("uniforms");

    const [formVisible, setFormVisible] =
        useState(false);

    const [selectedItem, setSelectedItem] =
        useState<any>(null);

    if (loading) {

        return (

            <View style={styles.loadingContainer}>

                <MaterialCommunityIcons

                    name="tshirt-crew"

                    size={48}

                    color="#5B3DF5"

                />
                <ActivityIndicator
                    size="large"
                    color="#5B3DF5"
                />

                <Text style={styles.loadingText}>

                    Loading Catalog...

                </Text>

            </View>

        );

    }

    if (error) {

        return (

            <View style={styles.loadingContainer}>

                <MaterialCommunityIcons

                    name="alert-circle"

                    size={48}

                    color="red"

                />

                <Text style={styles.loadingText}>

                    {error}

                </Text>

            </View>

        );

    }

    return (

        <View style={styles.container}>

            <ScrollView

                refreshControl={

                    <RefreshControl

                        refreshing={refreshing}

                        onRefresh={onRefresh}

                        colors={["#5B3DF5"]}

                    />

                }

            >

                <LinearGradient

                    colors={["#2B145A", "#5B3DF5"]}

                    style={styles.header}

                >

                    <View style={styles.headerRow}>

                        <TouchableOpacity

                            onPress={() => router.back()}

                        >

                            <Ionicons

                                name="arrow-back"

                                size={28}

                                color="#FFF"

                            />

                        </TouchableOpacity>

                        <Text style={styles.title}>

                            Uniform Catalog

                        </Text>

                        <View style={{ width: 28 }} />

                    </View>

                    <Text style={styles.subtitle}>

                        Manage all uniform catalog items

                    </Text>

                </LinearGradient>

                {/* Search */}

                <View style={styles.searchBox}>

                    <Ionicons

                        name="search"

                        size={22}

                        color="#999"

                    />

                    <TextInput

                        value={search}

                        onChangeText={setSearch}

                        placeholder="Search by name, category or size..."

                        style={styles.searchInput}

                    />

                </View>

                {/* Categories */}

                <ScrollView

                    horizontal

                    showsHorizontalScrollIndicator={false}

                    contentContainerStyle={styles.categoryContainer}

                >

                    {[
                        "All",
                        "Head",
                        "Upper Body",
                        "Lower Body",
                        "Footwear",
                        "Accessories",
                    ].map((item) => (

                        <TouchableOpacity

                            key={item}

                            style={[

                                styles.categoryChip,

                                category === item &&
                                styles.categoryActive,

                            ]}

                            onPress={() => setCategory(item)}

                        >

                            <Text

                                style={[

                                    styles.categoryText,

                                    category === item &&
                                    styles.categoryActiveText,

                                ]}

                            >

                                {item}

                            </Text>

                        </TouchableOpacity>

                    ))}

                </ScrollView>
                <Text style={styles.sectionTitle}>
                    Catalog Items ({filteredCatalog.length})
                </Text>
                {filteredCatalog.length === 0 ? (

                    <View
                        style={{
                            alignItems: "center",
                            paddingVertical: 60,
                        }}
                    >

                        <MaterialCommunityIcons
                            name="package-variant"
                            size={70}
                            color="#BBB"
                        />

                        <Text
                            style={{
                                marginTop: 16,
                                fontSize: 18,
                                fontWeight: "700",
                            }}
                        >
                            No Catalog Found
                        </Text>

                        <Text
                            style={{
                                marginTop: 6,
                                color: "#888",
                            }}
                        >
                            Tap + to create first catalog item.
                        </Text>

                    </View>

                ) : (

                    filteredCatalog.map((item) => (

                        <CatalogCard

                            key={item.catalog_id}

                            item={item}

                            canEdit={canEdit}

                            canDelete={isAdmin}

                            onPress={(catalog) => {

                                setSelectedItem(catalog);

                                setFormVisible(true);

                            }}

                            onEdit={(catalog) => {

                                setSelectedItem(catalog);

                                setFormVisible(true);

                            }}

                            onDelete={(catalog) => {

                                if (!isAdmin) return;

                                Alert.alert(
                                    "Delete Catalog",
                                    `Delete "${catalog.name}"?`,
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
                                                    await removeCatalog(catalog.catalog_id);

                                                    Alert.alert(
                                                        "Success",
                                                        "Catalog deleted successfully."
                                                    );

                                                } catch (err: any) {

                                                    Alert.alert(
                                                        "Error",
                                                        err?.response?.data?.detail ??
                                                        "Failed to delete catalog."
                                                    );

                                                }
                                            },
                                        },
                                    ]
                                );

                            }}
                        />

                    ))
                )}

                <View style={{ height: 120 }} />

            </ScrollView>

            {/* Floating Button */}

            <UniformFloatingMenu

                visible={canEdit}

                onPress={() => {

                    setSelectedItem(null);

                    setFormVisible(true);

                }}

            />

            {/* Create / Edit */}

            <CatalogForm

                visible={formVisible}

                initialData={selectedItem}

                onClose={() => {

                    setFormVisible(false);

                    setSelectedItem(null);

                }}

                onSave={async (data) => {

                    try {

                        if (selectedItem) {

                            await editCatalog(
                                selectedItem.catalog_id,
                                data
                            );

                            Alert.alert(
                                "Success",
                                "Catalog updated successfully."
                            );

                        } else {

                            await addCatalog(data);

                            Alert.alert(
                                "Success",
                                "Catalog created successfully."
                            );

                        }

                    } catch (err: any) {

                        Alert.alert(
                            "Error",
                            err?.response?.data?.detail ??
                            "Failed to save catalog."
                        );

                    }

                }}
            />

        </View>

    );

}

const styles = StyleSheet.create({

    container: {

        flex: 1,

        backgroundColor: "#F6F4FF",

    },

    loadingContainer: {

        flex: 1,

        justifyContent: "center",

        alignItems: "center",

        backgroundColor: "#F6F4FF",

    },

    loadingText: {

        marginTop: 16,

        fontSize: 16,

        fontWeight: "600",

        color: "#5B3DF5",

    },

    header: {

        paddingTop: 65,

        paddingBottom: 32,

        paddingHorizontal: 22,

        borderBottomLeftRadius: 34,

        borderBottomRightRadius: 34,

    },

    headerRow: {

        flexDirection: "row",

        alignItems: "center",

        justifyContent: "space-between",

    },

    title: {

        fontSize: 28,

        fontWeight: "800",

        color: "#FFF",

    },

    subtitle: {

        marginTop: 14,

        fontSize: 15,

        color: "rgba(255,255,255,.85)",

    },

    searchBox: {

        marginHorizontal: 20,

        marginTop: 20,

        backgroundColor: "#FFF",

        borderRadius: 18,

        paddingHorizontal: 18,

        height: 58,

        flexDirection: "row",

        alignItems: "center",

        elevation: 2,

    },

    searchInput: {

        flex: 1,

        marginLeft: 10,

        fontSize: 16,

    },

    categoryContainer: {

        paddingHorizontal: 15,

        paddingVertical: 18,

    },

    categoryChip: {

        backgroundColor: "#FFF",

        paddingHorizontal: 18,

        paddingVertical: 12,

        borderRadius: 18,

        marginRight: 10,

    },

    categoryActive: {

        backgroundColor: "#5B3DF5",

    },

    categoryText: {

        fontWeight: "600",

        color: "#555",

    },

    categoryActiveText: {

        color: "#FFF",

    },

    sectionTitle: {

        fontSize: 24,

        fontWeight: "800",

        marginHorizontal: 22,

        marginBottom: 18,

        color: "#16162E",

    },

});