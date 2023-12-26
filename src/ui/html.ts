// noinspection JSUnusedGlobalSymbols

import { asDefined, int, panic } from "@common/lang"

export namespace Html {
    export const parse = (source: string): HTMLOrSVGElement & Element => {
        const template = document.createElement("div")
        template.innerHTML = source
        if (template.childElementCount !== 1) {
            return panic(`Source html has more than one root elements: '${source}'`)
        }
        const child = template.firstChild
        return child instanceof HTMLElement || child instanceof SVGSVGElement
            ? child
            : panic(`Cannot parse to HTMLOrSVGElement from '${source}'`)
    }

    export const empty = (element: Element): void => {while (element.firstChild) {element.firstChild.remove()}}

    export const replace = (element: Element, ...elements: ReadonlyArray<string | Element>): void => {
        Html.empty(element)
        element.append(...elements)
    }

    export const query = <E extends Element>(selectors: string, parent: ParentNode = document): E =>
        asDefined(parent.querySelector(selectors)) as E

    export const queryAll = <E extends Element>(selectors: string, parent: ParentNode = document): ReadonlyArray<E> =>
        Array.from(parent.querySelectorAll(selectors))

    export const nextID = (() => {
        let id: int = 0 | 0
        return () => (++id).toString(16).padStart(4, "0")
    })()

    export const adoptStyleSheet = (classDefinition: string, prefix?: string): string => {
        if (!classDefinition.includes("component")) {
            return panic(`No 'component' found in: ${classDefinition}`)
        }
        const className = `${prefix ?? "C"}${Html.nextID()}`
        const sheet = new CSSStyleSheet()
        sheet.replaceSync(classDefinition.replaceAll("component", `.${className}`))
        if (sheet.cssRules.length === 0) {
            return panic(`No cssRules found in: ${classDefinition}`)
        }
        document.adoptedStyleSheets.push(sheet)
        return className
    }

    export const EmptyGif = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" as const
}