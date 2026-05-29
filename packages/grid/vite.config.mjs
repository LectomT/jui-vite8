import { defineConfig } from "vite"

export default defineConfig(({ mode }) => {
    const theme = mode === "dark" ? "dark" : "classic"

    return {
        build: {
            emptyOutDir: theme === "classic",
            lib: {
                entry: `bundles/production.${theme}.js`,
                name: "jui",
                formats: ["iife"],
                fileName: () => "jui-grid.js",
                cssFileName: `jui-grid.${theme}`,
            },
            rollupOptions: {
                treeshake: false,
                external: ["jquery", "juijs"],
                output: {
                    globals: {
                        jquery: "jQuery",
                        juijs: "jui",
                    },
                },
            },
        },
        test: {
            globals: true,
            environment: "jsdom",
        },
    }
})
