(function exposeFixtures(global) {
    global.JuiSmokeFixtures = {
        tableRows: [
            { id: 1, name: "Core bundle", status: "loaded", value: 98 },
            { id: 2, name: "UI bundle", status: "loaded", value: 92 },
            { id: 3, name: "Grid bundle", status: "loaded", value: 88 },
            { id: 4, name: "Chart bundle", status: "loaded", value: 95 }
        ],
        chartRows: [
            { quarter: "1Q", sales: 12, profit: 4 },
            { quarter: "2Q", sales: 18, profit: 9 },
            { quarter: "3Q", sales: 9, profit: 3 },
            { quarter: "4Q", sales: 22, profit: 11 }
        ],
        modules: {
            ui: ["ui.dropdown", "ui.tab", "ui.tooltip", "ui.notify", "ui.modal", "ui.datepicker", "ui.tree"],
            grid: ["grid.table", "grid.xtable"]
        }
    };
})(window);
