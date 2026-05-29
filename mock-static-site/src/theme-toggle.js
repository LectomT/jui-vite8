(function setupThemeToggle() {
    const select = document.querySelector("[data-theme-select]");
    const uiTheme = document.querySelector("#jui-ui-theme");
    const gridTheme = document.querySelector("#jui-grid-theme");

    function applyTheme(theme) {
        if (uiTheme) {
            uiTheme.href = `./assets/jui/jui-ui.${theme}.css`;
        }

        if (gridTheme) {
            gridTheme.href = `./assets/jui/jui-grid.${theme}.css`;
        }

        document.documentElement.dataset.theme = theme;
    }

    select?.addEventListener("change", function onThemeChange(event) {
        applyTheme(event.target.value);
    });

    applyTheme(select?.value || "classic");
})();
