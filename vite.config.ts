import { defineConfig } from "vite"
import { resolve } from "path"
import inject from "@rollup/plugin-inject"

export default defineConfig({
    base: "./",
    plugins: [inject({ createElement: "@jsx/create-element.ts" })],
    resolve: {
        alias: {
            "@jsx": resolve(__dirname, "./src/jsx"),
            "@common": resolve(__dirname, "./src/common"),
            "@ui": resolve(__dirname, "./src/ui")
        }
    },
    esbuild: {
        target: "esNext",
        supported: { bigint: true }
    },
    server: { port: 8081 }
})