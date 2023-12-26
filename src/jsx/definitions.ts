// noinspection JSUnusedGlobalSymbols

import { Inject } from "@jsx/inject.ts"

export type DomElement = HTMLElement | SVGElement

// These are all utility type to let jsx understand usual html and svg elements.
//

type AttributeMap = {
    className?: string | Inject.ClassList
    style?: Partial<CSSStyleDeclaration>
}

type ExtractProperties<T extends Element> = Partial<{
    [K in keyof T]:
    K extends keyof AttributeMap ? AttributeMap[K] :
        K extends keyof GlobalEventHandlers ? GlobalEventHandlers[K] :
            T[K] extends Function ? never :
                (T[K] extends SVGAnimatedBoolean ? boolean | string :
                    T[K] extends SVGAnimatedAngle ? number | string :
                        T[K] extends SVGAnimatedLength ? number | string :
                            T[K] extends number ? number | string :
                                T[K] extends boolean ? boolean | string :
                                    string) | Inject.Attribute
}> & {
    ref?: Inject.Ref<T>
} & Record<string, unknown>

declare global {
    namespace JSX {
        type IntrinsicElements =
            & { [K in keyof Omit<SVGElementTagNameMap, "a">]: ExtractProperties<Omit<SVGElementTagNameMap, "a">[K]> }
            & { [K in keyof Omit<HTMLElementTagNameMap, "a">]: ExtractProperties<Omit<HTMLElementTagNameMap, "a">[K]> }
            // TODO This guy is really fuzzy. For some reason I cannot type it properly
            & { a: any } // ExtractProperties<HTMLAnchorElement & HTMLElement & HTMLHyperlinkElementUtils>
    }
}

export {}