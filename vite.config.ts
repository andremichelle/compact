import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
    base: process.env.PROD ? "/compact/" : "./",
    resolve: {
        alias: { "@": resolve(__dirname, "./src") }
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