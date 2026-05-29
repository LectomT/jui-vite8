import { defineConfig } from "vite"

export default defineConfig({
    build: {
        lib: {
            entry: "src/main.js",
            name: "jui",
            formats: ["es", "cjs", "iife"],
            fileName: (format) => {
                if (format === "es") return "jui-core.esm.js"
                if (format === "cjs") return "jui-core.cjs.js"
                return "jui-core.js"
            },
        },
        rollupOptions: {
            external: ["jquery"],
            output: {
                globals: {
                    jquery: "jQuery",
                },
            },
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
    },
})
