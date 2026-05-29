import { defineConfig } from "vite"

export default defineConfig({
    build: {
        lib: {
            entry: "bundles/production.js",
            name: "jui",
            formats: ["es", "iife"],
            fileName: (format) => (format === "es" ? "jui-chart.esm.js" : "jui-chart.js"),
        },
        rollupOptions: {
            external: ["juijs-graph"],
            output: {
                globals: {
                    "juijs-graph": "graph",
                },
            },
        },
    },
    test: {
        globals: true,
    },
})
