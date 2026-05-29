(function runSmoke(global) {
    const resultList = document.querySelector("[data-smoke-results]");
    const assetList = document.querySelector("[data-asset-results]");
    const rerunButton = document.querySelector("[data-smoke-rerun]");
    const fixtures = global.JuiSmokeFixtures || { modules: { ui: [], grid: [] }, tableRows: [], chartRows: [] };

    const results = [];

    function setProbe(name, value) {
        const target = document.querySelector(`[data-probe="${name}"]`);
        if (target) {
            target.textContent = value;
        }
    }

    function addResult(scope, status, message) {
        results.push({ scope, status, message });
    }

    function assertResult(scope, condition, passMessage, failMessage, warn) {
        if (condition) {
            addResult(scope, "pass", passMessage);
            return;
        }

        addResult(scope, warn ? "warn" : "fail", failMessage);
    }

    function paintResults() {
        const counts = { pass: 0, warn: 0, fail: 0 };
        resultList.innerHTML = "";

        for (const result of results) {
            counts[result.status] += 1;
            const item = document.createElement("div");
            item.className = `result-item ${result.status}`;
            item.innerHTML = `<strong>${result.status.toUpperCase()}</strong><span>${result.scope}</span><p>${result.message}</p>`;
            resultList.appendChild(item);
        }

        for (const status of Object.keys(counts)) {
            const target = document.querySelector(`[data-smoke-count="${status}"]`);
            if (target) {
                target.textContent = String(counts[status]);
            }
        }

        document.documentElement.dataset.smokeStatus = counts.fail > 0 ? "fail" : "pass";
    }

    function paintAssetResults() {
        const assetErrors = global.__juiSmokeAssetErrors || [];
        assetList.innerHTML = "";

        if (assetErrors.length === 0) {
            const item = document.createElement("li");
            item.textContent = "스크립트 asset 로딩 오류가 감지되지 않았습니다.";
            assetList.appendChild(item);
            return;
        }

        for (const path of assetErrors) {
            const item = document.createElement("li");
            item.textContent = `${path} 로딩 실패`;
            assetList.appendChild(item);
        }
    }

    function checkCore() {
        const hasJui = typeof global.jui === "object" && typeof global.jui.ready === "function";
        const hasUtilityApi = hasJui && (typeof global.jui.include === "function" || typeof global.jui.define === "function");

        setProbe("core-global", hasJui ? "jui 전역 객체 확인" : "jui 전역 객체 없음");
        setProbe("core-utils", hasUtilityApi ? "기본 module API 확인" : "기본 module API 없음");

        assertResult("core", hasJui, "jui 전역 객체를 확인했습니다.", "jui-core.js가 로드되지 않았습니다.");
        assertResult("core", hasUtilityApi, "jui module API를 확인했습니다.", "jui module API를 확인하지 못했습니다.");
    }

    function checkJuiModules(scope, moduleNames) {
        if (!global.jui || typeof global.jui.ready !== "function") {
            addResult(scope, "fail", "jui.ready가 없어 모듈 등록을 확인할 수 없습니다.");
            return;
        }

        try {
            global.jui.ready(moduleNames, function onReady() {
                addResult(scope, "pass", `${moduleNames.length}개 모듈 ready callback이 실행되었습니다.`);
            });
        } catch (error) {
            addResult(scope, "fail", `${scope} 모듈 확인 중 오류: ${error.message}`);
        }
    }

    function checkGridRendering() {
        if (!global.jui || typeof global.jui.ready !== "function") {
            return;
        }

        try {
            global.jui.ready(["grid.table"], function onGridReady(table) {
                const tableElement = document.querySelector("#smoke-table");
                table(tableElement, {
                    fields: ["id", "name", "status", "value"],
                    data: fixtures.tableRows,
                    sort: true
                });

                const renderedRows = tableElement.querySelectorAll("tbody tr").length;
                assertResult("grid", renderedRows > 0, `${renderedRows}개 table row가 렌더링되었습니다.`, "grid.table row 렌더링 실패");
            });
        } catch (error) {
            addResult("grid", "fail", `grid.table 렌더링 오류: ${error.message}`);
        }
    }

    function checkChartRendering() {
        const graph = global.graph;
        if (!graph || typeof graph.ready !== "function") {
            addResult("chart", "fail", "graph.ready가 없어 chart 모듈을 확인할 수 없습니다.");
            return;
        }

        try {
            graph.ready(["chart.builder"], function onChartReady(builder) {
                builder("#smoke-chart", {
                    width: 520,
                    height: 260,
                    theme: "classic",
                    axis: {
                        x: { type: "block", domain: "quarter" },
                        y: { type: "range", domain: function domain(d) { return [d.sales, d.profit]; }, step: 4 },
                        data: fixtures.chartRows
                    },
                    brush: [{ type: "column", target: ["sales", "profit"] }],
                    widget: [{ type: "title", text: "Quarter Smoke" }, { type: "tooltip" }]
                });

                const chartHost = document.querySelector("#smoke-chart");
                const hasRenderableNode = chartHost.querySelector("svg, canvas");
                assertResult("chart", Boolean(hasRenderableNode), "chart render node를 확인했습니다.", "chart render node를 찾지 못했습니다.");
            });
        } catch (error) {
            addResult("chart", "fail", `chart 렌더링 오류: ${error.message}`);
        }
    }

    function checkVueGraph() {
        const hasVueGraph = Boolean(global.VueGraph || global["vue-graph"]);
        assertResult("vue-graph", hasVueGraph, "Vue Graph 전역 객체를 확인했습니다.", "Vue Graph 전역 객체는 아직 확인되지 않았습니다.", true);
    }

    function checkRuntimeErrors() {
        const runtimeErrors = global.__juiSmokeRuntimeErrors || [];
        const assetErrors = global.__juiSmokeAssetErrors || [];

        assertResult("assets", assetErrors.length === 0, "스크립트 asset 오류가 없습니다.", `${assetErrors.length}개 script asset 로딩 실패`);
        assertResult("runtime", runtimeErrors.length === 0, "전역 runtime 오류가 없습니다.", `${runtimeErrors.length}개 runtime 오류 감지`);
    }

    function startSmoke() {
        results.length = 0;
        checkCore();
        checkJuiModules("ui", fixtures.modules.ui);
        checkJuiModules("grid", fixtures.modules.grid);
        checkGridRendering();
        checkChartRendering();
        checkVueGraph();
        checkRuntimeErrors();
        paintAssetResults();

        setTimeout(paintResults, 100);
    }

    rerunButton?.addEventListener("click", startSmoke);
    global.addEventListener("load", startSmoke);
})(window);
