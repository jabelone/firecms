import React, { createElement } from "react";
import {
    ArrayProperty,
    CMSType,
    EntityReference,
    ResolvedArrayProperty,
    ResolvedBooleanProperty,
    ResolvedMapProperty,
    ResolvedNumberProperty,
    ResolvedReferenceProperty,
    ResolvedStringProperty,
    ResolvedTimestampProperty,
    StringProperty
} from "../models";

import {
    ArrayOfMapsPreview,
    ArrayOfReferencesPreview,
    ArrayOfStorageComponentsPreview,
    ArrayOfStringsPreview,
    ArrayOneOfPreview,
    ArrayPreview,
    ArrayPropertyEnumPreview,
    BooleanPreview,
    EmptyValue,
    MapPreview,
    NumberPreview,
    ReferencePreview,
    StorageThumbnail,
    StringPreview,
    TimestampPreview,
    UrlComponentPreview
} from "./internal";
import { ErrorView } from "../core/components";

import { PreviewComponentProps } from "./PreviewComponentProps";

import { Markdown } from "./components/Markdown";

/**
 * @category Preview components
 */
export function PreviewComponent<T extends CMSType>(props: PreviewComponentProps<T>) {
    let content: JSX.Element | any;
    const {
        property, name, value, size, height, width
    } = props;

    const fieldProps = { ...props };

    if (value === undefined) {
        content = <EmptyValue/>;
    } else if (property.Preview) {
        content = createElement(property.Preview as React.ComponentType<PreviewComponentProps>,
            {
                name,
                value,
                property,
                size,
                height,
                width,
                customProps: property.customProps
            });
    } else if (value === null) {
        content = <EmptyValue/>;
    } else if (property.dataType === "string") {
        const stringProperty = property as StringProperty;
        if (typeof value === "string") {
            if (stringProperty.url) {
                content = <UrlComponentPreview {...fieldProps}
                                               property={property as ResolvedStringProperty}
                                               value={value}/>;
            } else if (stringProperty.storage) {
                content = <StorageThumbnail {...fieldProps}
                                            property={property as ResolvedStringProperty}
                                            value={value}/>;
            } else if (stringProperty.markdown) {
                content = <Markdown source={value}/>;
            } else {
                content = <StringPreview {...fieldProps}
                                         property={property as ResolvedStringProperty}
                                         value={value}/>;
            }
        } else {
            content = buildWrongValueType(name, property.dataType, value);
        }
    } else if (property.dataType === "array") {
        if (value instanceof Array) {
            const arrayProperty = property as ArrayProperty;
            if (!arrayProperty.of && !arrayProperty.oneOf) {
                throw Error(`You need to specify an 'of' or 'oneOf' prop (or specify a custom field) in your array property ${name}`);
            }

            if (arrayProperty.of) {
                if (arrayProperty.of.dataType === "map") {
                    content =
                        <ArrayOfMapsPreview name={name}
                                            property={property as ResolvedArrayProperty}
                                            value={value as object[]}
                                            size={size}
                        />;
                } else if (arrayProperty.of.dataType === "reference") {
                    if (typeof arrayProperty.of.path === "string") {
                        content = <ArrayOfReferencesPreview {...fieldProps}
                                                            value={value}
                                                            property={property as ResolvedArrayProperty}/>;
                    } else {
                        content = <EmptyValue/>;
                    }
                } else if (arrayProperty.of.dataType === "string") {
                    if (arrayProperty.of.enumValues) {
                        content = <ArrayPropertyEnumPreview
                            {...fieldProps}
                            value={value as string[]}
                            property={property as ResolvedArrayProperty}/>;
                    } else if (arrayProperty.of.storage) {
                        content = <ArrayOfStorageComponentsPreview
                            {...fieldProps}
                            value={value}
                            property={property as ResolvedArrayProperty}/>;
                    } else {
                        content = <ArrayOfStringsPreview
                            {...fieldProps}
                            value={value as string[]}
                            property={property as ResolvedArrayProperty}/>;
                    }
                } else if (arrayProperty.of.dataType === "number") {
                    if (arrayProperty.of.enumValues) {
                        content = <ArrayPropertyEnumPreview
                            {...fieldProps}
                            value={value as string[]}
                            property={property as ResolvedArrayProperty}/>;
                    }
                } else {
                    content = <ArrayPreview {...fieldProps}
                                            value={value}
                                            property={property as ResolvedArrayProperty}/>;
                }
            } else if (arrayProperty.oneOf) {
                content = <ArrayOneOfPreview {...fieldProps}
                                             value={value}
                                             property={property as ResolvedArrayProperty}/>;
            }
        } else {
            content = buildWrongValueType(name, property.dataType, value);
        }
    } else if (property.dataType === "map") {
        if (typeof value === "object") {
            content =
                <MapPreview {...fieldProps}
                            property={property as ResolvedMapProperty}/>;
        } else {
            content = buildWrongValueType(name, property.dataType, value);
        }
    } else if (property.dataType === "timestamp") {
        if (value instanceof Date) {
            content = <TimestampPreview {...fieldProps}
                                        value={value}
                                        property={property as ResolvedTimestampProperty}/>;
        } else {
            content = buildWrongValueType(name, property.dataType, value);
        }
    } else if (property.dataType === "reference") {
        if (typeof property.path === "string") {
            if (value instanceof EntityReference) {
                content = <ReferencePreview
                    {...fieldProps}
                    value={value as EntityReference}
                    property={property as ResolvedReferenceProperty}
                />;
            } else {
                content = buildWrongValueType(name, property.dataType, value);
            }
        } else {
            content = <EmptyValue/>;
        }

    } else if (property.dataType === "boolean") {
        if (typeof value === "boolean") {
            content = <BooleanPreview {...fieldProps}
                                      value={value}
                                      property={property as ResolvedBooleanProperty}/>;
        } else {
            content = buildWrongValueType(name, property.dataType, value);
        }
    } else if (property.dataType === "number") {
        if (typeof value === "number") {
            content = <NumberPreview {...fieldProps}
                                     value={value}
                                     property={property as ResolvedNumberProperty}/>;
        } else {
            content = buildWrongValueType(name, property.dataType, value);
        }
    } else {
        content = JSON.stringify(value);
    }

    return content === undefined || content === null ? <EmptyValue/> : content;
}

function buildWrongValueType(name: string | undefined, dataType: string, value: any) {
    console.error(`Unexpected value for property ${name}, of type ${dataType}`, value);
    return (
        <ErrorView error={`Unexpected value: ${JSON.stringify(value)}`}/>
    );
}


// export const PreviewComponent = React.memo<PreviewComponentProps<any>>(PreviewComponentInternal, areEqual) as React.FunctionComponent<PreviewComponentProps<any>>;
//
// function areEqual(prevProps: PreviewComponentProps<any>, nextProps: PreviewComponentProps<any>) {
//     return prevProps.name === nextProps.name
//         && prevProps.size === nextProps.size
//         && prevProps.height === nextProps.height
//         && prevProps.width === nextProps.width
//         && isEqual(prevProps.value, nextProps.value)
//         ;
// }
