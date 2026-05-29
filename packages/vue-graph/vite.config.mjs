import { defineConfig } from "vite"

export default defineConfig({
    resolve: {
        alias: {
            "@": new URL("./src", import.meta.url).pathname,
            "vue-test-utils": "@vue/test-utils",
        },
    },
    build: {
        lib: {
            entry: "src/main.js",
            name: "VueGraph",
            formats: ["es", "iife"],
            fileName: (format) => (format === "es" ? "vue-graph.esm.js" : "vue-graph.js"),
        },
        rollupOptions: {
            external: ["vue", "juijs-chart"],
            output: {
                globals: {
                    vue: "Vue",
                    "juijs-chart": "jui",
                },
            },
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["test/setup.js"],
    },
})
