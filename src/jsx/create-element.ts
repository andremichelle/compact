// noinspection JSUnusedGlobalSymbols

import { SupportedSvgTags } from "@jsx/supported-svg-tags"
import { Inject } from "@jsx/inject.ts"
import { canWrite, safeWrite } from "@common/lang.ts"
import { DomElement } from "@jsx/definitions.ts"

type FactoryProduct = false | null | undefined | DomElement | Array<DomElement>
type Factory = (attributes: Readonly<Record<string, any>>) => FactoryProduct
type TagOrFactory = string | Factory

const EmptyAttributes = Object.freeze({})

/**
 * This method must be exposed as the "createElement" method
 * to be passively called on each html element defined in jsx files.
 * This is secured by injection defined in vite.config.ts
 */
export default function(tagOrFactory: TagOrFactory,
                        attributes: Readonly<Record<string, any>> | null,
                        ...children: ReadonlyArray<string | DomElement>): FactoryProduct {
    const isFactory = typeof tagOrFactory === "function"
    let element
    if (isFactory) {
        element = tagOrFactory(attributes ?? EmptyAttributes)
        if (element === false || element === null || element === undefined || Array.isArray(element)) {
            return element
        }
        // factories must have consumed all attributes
        attributes = null
    } else {
        element = SupportedSvgTags.has(tagOrFactory)
            ? document.createElementNS("http://www.w3.org/2000/svg", tagOrFactory)
            : document.createElement(tagOrFactory)
    }
    if (attributes !== null) {
        transferAttributes(element, attributes)
    }
    if (children.length > 0) {
        transferChildren(element, children)
    }
    return element
}

const transferAttributes = (element: DomElement, attributes: Readonly<Record<string, any>>) => {
    Object.entries(attributes).forEach(([key, value]: [string, unknown]) => {
        if (key === "class" || key === "className") {
            if (value instanceof Inject.ClassList) {
                value.addTarget(element)
            } else {
                element.classList.add(...(<string>value).split(" "))
            }
        } else if (key === "style") {
            Object.assign(element.style, <CSSStyleDeclaration>value)
        } else if (key === "ref") {
            if (value instanceof Inject.Ref) {
                value.addTarget(element)
            } else {
                throw new Error("value of 'ref' must be of type '_Ref'")
            }
        } else if (value instanceof Inject.Attribute) {
            value.addTarget(element, key)
        } else {
            if (canWrite(element, key)) {
                safeWrite(element, key, value)
            } else {
                element.setAttribute(key, String(value))
            }
        }
    })
}

const transferChildren = (element: DomElement, children: ReadonlyArray<string | DomElement>) => {
    children.flat().forEach((value: null | undefined | false | string | DomElement | Inject.TextValue) => {
        if (value instanceof Inject.TextValue) {
            const text: Text = document.createTextNode(String(value.value))
            value.addTarget(text)
            element.append(text)
        } else if (value !== null && value !== undefined && value !== false) {
            element.append(value)
        }
    })
}