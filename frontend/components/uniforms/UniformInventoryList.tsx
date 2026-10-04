import React from "react";
import {
    FlatList,
    ListRenderItem,
} from "react-native";

import { UniformInventory } from "../../types/uniform";

import UniformInventoryCard from "./UniformInventoryCard";

interface Props {
    data: UniformInventory[];

    canEdit: boolean;
    canDelete: boolean;

    onItemPress: (item: UniformInventory) => void;
    onEdit: (item: UniformInventory) => void;
    onDelete: (item: UniformInventory) => void;
}

export default function UniformInventoryList({
    data,
    canEdit,
    canDelete,
    onItemPress,
    onEdit,
    onDelete,
}: Props) {

    const renderItem: ListRenderItem<UniformInventory> = ({
        item,
    }) => (
        <UniformInventoryCard
            item={item}

            canEdit={canEdit}
            canDelete={canDelete}

            onPress={() => onItemPress(item)}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item)}
        />
    );

    return (
        <FlatList
            data={data}

            keyExtractor={(item) =>
                item.inventory_id
            }

            renderItem={renderItem}

            showsVerticalScrollIndicator={false}

            contentContainerStyle={{
                paddingBottom: 120,
            }}

            ListEmptyComponent={null}
        />
    );
}