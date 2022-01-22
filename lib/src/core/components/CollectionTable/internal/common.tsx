import { useMemo } from "react";
import {
    ArrayProperty,
    EntityCollection,
    Properties,
    Property,
    ResolvedEntitySchema
} from "../../../../models";


export type Sort = "asc" | "desc" | undefined;


export function getCellAlignment(property: Property): "right" | "left" | "center" {
    if (property.dataType === "boolean") {
        return "center";
    } else if (property.dataType === "number") {
        if (property.enumValues)
            return "left";
        return "right";
    } else if (property.dataType === "timestamp") {
        return "right";
    } else {
        return "left";
    }
}

export function isPropertyFilterable(property: Property): boolean {
    if (property.dataType === "boolean") {
        return true;
    } else if (property.dataType === "number") {
        return true;
    } else if (property.dataType === "string") {
        return true;
    } else if (property.dataType === "timestamp") {
        return true;
    } else if (property.dataType === "array") {
        if (property.of)
            return isPropertyFilterable(property.of);
        else
            return false;
    } else {
        return false;
    }
}

export function getPropertyColumnWidth(property: Property): number {

    if (property.columnWidth) {
        return property.columnWidth;
    }

    if (property.dataType === "string") {
        if (property.url) {
            if (property.url === "video" || property.storage?.mediaType === "video")
                return 340;
            else if (property.url === "audio" || property.storage?.mediaType === "audio")
                return 300;
            return 240;
        } else if (property.storage) {
            return 220;
        } else if (property.enumValues) {
            return 200;
        } else if (property.multiline) {
            return 300;
        } else if (property.markdown) {
            return 300;
        } else if (property.email) {
            return 200;
        } else {
            return 200;
        }
    } else if (property.dataType === "array") {
        const arrayProperty = property as ArrayProperty;
        if (arrayProperty.of) {
            return getPropertyColumnWidth(arrayProperty.of as Property);
        } else {
            return 300;
        }
    } else if (property.dataType === "number") {
        if (property.enumValues) {
            return 200;
        }
        return 140;
    } else if (property.dataType === "map") {
        return 360;
    } else if (property.dataType === "timestamp") {
        return 160;
    } else if (property.dataType === "reference") {
        return 220;
    } else if (property.dataType === "boolean") {
        return 140;
    } else {
        return 200;
    }
}


export function getSubcollectionColumnId(collection: EntityCollection) {
    return `subcollection:${collection.path}`;
}

export function useColumnIds<M>(collection: EntityCollection<M>, resolvedSchema:ResolvedEntitySchema<M>, includeSubcollections: boolean): string[] {

    return useMemo(() => {
        const displayedProperties = Object.entries<Property>(resolvedSchema.properties as Record<keyof M, Property>)
            .filter(([_, property]) => !property.hideFromCollection)
            .map(([key, _]) => key);
        const additionalColumns = resolvedSchema.additionalColumns ?? [];
        const subCollections: EntityCollection[] = collection.subcollections ?? [];

        const properties: Properties = resolvedSchema.properties;

        const hiddenColumnIds: string[] = Object.entries(properties)
            .filter(([_, property]) => {
                return property.disabled && typeof property.disabled === "object" && property.disabled.hidden;
            })
            .map(([propertyKey, _]) => propertyKey);

        const columnIds: string[] = [
            ...Object.keys(resolvedSchema.properties) as string[],
            ...additionalColumns.map((column) => column.id)
        ];

        let result: string[];
        if (displayedProperties) {
            result = displayedProperties
                .map((p) => {
                    return columnIds.find(id => id === p);
                }).filter(c => !!c) as string[];
        } else {
            result = columnIds.filter((columnId) => !hiddenColumnIds.includes(columnId));
        }

        if (includeSubcollections) {
            const subCollectionIds = subCollections
                .map((collection) => getSubcollectionColumnId(collection));
            result.push(...subCollectionIds.filter((subColId) => !result.includes(subColId)));
        }

        return result;

    }, [resolvedSchema.additionalColumns, collection.subcollections, collection.schemaId, resolvedSchema.properties, includeSubcollections]);
}