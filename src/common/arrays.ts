import { Func, int, panic } from "./lang"

export class Arrays {
    static readonly clear = <T>(array: Array<T>): void => {array.splice(0, array.length)}
    static readonly create = <T>(factory: Func<int, T>, n: int): Array<T> => {
        const array: T[] = new Array<T>(n)
        for (let i: int = 0; i < n; i++) {array[i] = factory(i)}
        return array
    }
    static readonly remove = <T>(array: Array<T>, element: T): void => {
        const index: int = array.indexOf(element)
        if (index === -1) {return panic(`${element} not found in ${array}`)}
        array.splice(index, 1)
    }
}