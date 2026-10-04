import React, { useEffect, useState } from "react";

import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Switch,
    Alert,
} from "react-native";

import { UniformCatalog } from "../../types/uniform";

interface Props {

    visible: boolean;

    initialData?: UniformCatalog | null;

    onClose: () => void;

    onSave: (data: Partial<UniformCatalog>) => Promise<void>;

}

const categories = [
    "Head",
    "Upper Body",
    "Lower Body",
    "Footwear",
    "Accessories",
];

const sizeOptions = [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "Free",
];

export default function CatalogForm({

    visible,

    initialData,

    onClose,

    onSave,

}: Props) {

    const [name, setName] = useState("");

    const [category, setCategory] = useState("Head");

    const [description, setDescription] = useState("");

    const [image, setImage] = useState("");

    const [displayOrder, setDisplayOrder] = useState("1");

    const [mandatory, setMandatory] = useState(false);

    const [sizes, setSizes] = useState<string[]>([]);

    useEffect(() => {

        if (initialData) {

            setName(initialData.name);

            setCategory(initialData.category);

            setDescription(initialData.description ?? "");

            setImage(initialData.image ?? "");

            setMandatory(initialData.is_mandatory);

            setDisplayOrder(
                String(initialData.display_order)
            );

            setSizes(initialData.available_sizes);

        } else {

            setName("");

            setCategory("Head");

            setDescription("");

            setImage("");

            setMandatory(false);

            setDisplayOrder("1");

            setSizes([]);

        }

    }, [initialData, visible]);

    const toggleSize = (size: string) => {

        if (sizes.includes(size)) {

            setSizes(
                sizes.filter(s => s !== size)
            );

        } else {

            setSizes([...sizes, size]);

        }

    };

    const submit = async () => {

        if (name.trim() == "") {

            Alert.alert(
                "Validation",
                "Uniform name is required."
            );

            return;

        }

        if (category == "") {

            Alert.alert(
                "Validation",
                "Select category."
            );

            return;

        }

        if (sizes.length == 0) {

            Alert.alert(
                "Validation",
                "Select at least one size."
            );

            return;

        }
        await onSave({

            name,

            category,

            description,

            image,

            is_mandatory: mandatory,

            available_sizes: sizes,

            display_order: Number(displayOrder),

        });

        onClose();

    };

    return (

        <Modal

            visible={visible}

            animationType="slide"

        >

            <ScrollView
                style={styles.container}
            >

                <Text style={styles.title}>

                    {initialData
                        ? "Edit Catalog"
                        : "New Catalog"}

                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Uniform Name"
                    value={name}
                    onChangeText={setName}
                />

                <Text style={styles.label}>
                    Category
                </Text>

                <View style={styles.categoryRow}>

                    {categories.map(item => (

                        <TouchableOpacity

                            key={item}

                            style={[
                                styles.categoryChip,

                                category === item &&
                                styles.categoryChipActive,

                            ]}

                            onPress={() =>
                                setCategory(item)
                            }

                        >

                            <Text
                                style={[
                                    styles.categoryText,

                                    category === item &&
                                    styles.categoryTextActive,

                                ]}
                            >

                                {item}

                            </Text>

                        </TouchableOpacity>

                    ))}

                </View>

                <TextInput

                    style={[
                        styles.input,
                        {
                            height: 90,
                        },
                    ]}

                    multiline

                    placeholder="Description"

                    value={description}

                    onChangeText={setDescription}

                />

                <TextInput

                    style={styles.input}

                    placeholder="Image URL"

                    value={image}

                    onChangeText={setImage}

                />

                <TextInput

                    style={styles.input}

                    placeholder="Display Order"

                    keyboardType="numeric"

                    value={displayOrder}

                    onChangeText={setDisplayOrder}

                />

                <View style={styles.switchRow}>

                    <Text>

                        Mandatory Item

                    </Text>

                    <Switch

                        value={mandatory}

                        onValueChange={setMandatory}

                    />

                </View>

                <Text style={styles.label}>

                    Available Sizes

                </Text>

                <View style={styles.sizeContainer}>

                    {sizeOptions.map(size => (

                        <TouchableOpacity

                            key={size}

                            style={[
                                styles.sizeChip,

                                sizes.includes(size) &&
                                styles.sizeChipActive,

                            ]}

                            onPress={() =>
                                toggleSize(size)
                            }

                        >

                            <Text
                                style={[
                                    styles.sizeText,

                                    sizes.includes(size) &&
                                    styles.sizeTextActive,

                                ]}
                            >

                                {size}

                            </Text>

                        </TouchableOpacity>

                    ))}

                </View>

                <TouchableOpacity

                    style={styles.saveButton}

                    onPress={submit}

                >

                    <Text style={styles.saveText}>

                        Save Catalog

                    </Text>

                </TouchableOpacity>

                <TouchableOpacity

                    style={styles.cancelButton}

                    onPress={onClose}

                >

                    <Text>

                        Cancel

                    </Text>

                </TouchableOpacity>

            </ScrollView>

        </Modal>

    );

}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#FFF",
        padding: 20,
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 20,
    },

    input: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
    },

    label: {
        fontWeight: "700",
        marginBottom: 10,
    },

    categoryRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 20,
    },

    categoryChip: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 10,
        margin: 5,
    },

    categoryChipActive: {
        backgroundColor: "#5B3DF5",
        borderColor: "#5B3DF5",
    },

    categoryText: {},

    categoryTextActive: {
        color: "#FFF",
    },

    switchRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },

    sizeContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },

    sizeChip: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 10,
        margin: 5,
    },

    sizeChipActive: {
        backgroundColor: "#5B3DF5",
        borderColor: "#5B3DF5",
    },

    sizeText: {},

    sizeTextActive: {
        color: "#FFF",
    },

    saveButton: {
        backgroundColor: "#5B3DF5",
        padding: 16,
        borderRadius: 18,
        alignItems: "center",
        marginTop: 30,
    },

    saveText: {
        color: "#FFF",
        fontWeight: "700",
        fontSize: 16,
    },

    cancelButton: {
        alignItems: "center",
        padding: 20,
    },

});