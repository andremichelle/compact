import { defineConfig } from "vite"
import { resolve } from "path"
import inject from "@rollup/plugin-inject"

export default defineConfig({
    base: process.env.PROD ? "/compact/" : "./",
    plugins: [inject({ createElement: "@jsx/create-element.ts" })],
    resolve: {
        alias: {
            "@jsx": resolve(__dirname, "./src/jsx"),
            "@common": resolve(__dirname, "./src/common"),
            "@ui": resolve(__dirname, "./src/ui")
        }
    },
    build: {
        outDir: "dist",
        rollupOptions: {
            external: (source) => {
                return source.includes("service-worker.ts")
            }
        }
    },
    esbuild: {
        target: "esNext",
        supported: { bigint: true }
    },
    server: { port: 8081 }
})