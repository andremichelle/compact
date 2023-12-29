import { readdir, writeFile } from "fs/promises"
import { join, relative, resolve } from "path"

const targetDir = resolve("./dist")

async function collectFiles(dir: string): Promise<string[]> {
    const files: string[] = []
    const items = await readdir(dir, { withFileTypes: true })
    for (const item of items) {
        const fullPath = join(dir, item.name)
        if (item.isDirectory()) {
            files.push(...(await collectFiles(fullPath)))
        } else {
            files.push(relative(targetDir, fullPath))
        }
    }
    return files
}

const excludes = [".DS_Store", ".htaccess"]

;(async () => {
    const files = await collectFiles(targetDir)
    const data = JSON.stringify(files.filter(file => !excludes.some(exclude => file.endsWith(exclude))
        && !file.includes("service-worker")).concat(["./"]))
    await writeFile("./dist/cache.json", data)
    console.debug("cache files...")
    console.debug(data)
})()