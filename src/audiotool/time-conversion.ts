export const dateToString = (() => {
    const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const
    return (date: Date) => [date.getUTCDate().toString().padStart(2, "0"), month[date.getUTCMonth()], date.getUTCFullYear()].join(" ")
})()

export const timespanToString = (millis: number) => {
    const seconds = Math.floor(millis / 1000)
    const s = Math.floor(seconds) % 60
    const m = Math.floor(seconds / 60) % 60
    const h = Math.floor(seconds / 3600)
    return (h > 0 ? [h, m, s] : [m, s]).map(x => x.toString(10).padStart(2, "0")).join(":")
}