# JUI 정적 목 사이트

이 디렉터리는 빌드된 JUI 라이브러리를 별도 소비자 프로젝트처럼 로드해서 브라우저에서 확인하기 위한
정적 smoke site 초안입니다. 이후 별도 레포로 옮겨 운영하는 것을 전제로 합니다.

별도 레포로 분리한 뒤에는 Playwright 기반 E2E를 필수 요건으로 둡니다. 목 사이트의 모든 페이지와
모든 공개 컴포넌트는 브라우저에서 로드, 렌더링, 기본 상호작용이 검증되어야 하며, 이 검증이
통과하지 않으면 목 사이트 변경을 완료한 것으로 보지 않습니다.

## 목적

- `packages/*/dist` 산출물이 모노레포 밖에서도 정상 로드되는지 확인합니다.
- `core`, `ui`, `grid`, `chart`, `vue-graph`의 기본 등록과 렌더링 표면을 한 화면에서 확인합니다.
- `classic`/`dark` CSS 테마와 이미지/폰트 상대 경로 문제를 빠르게 발견합니다.

## 사용 방법

먼저 루트에서 빌드합니다.

```bash
npm run build
```

그 다음 산출물을 이 디렉터리의 `assets/jui/` 아래로 복사합니다.

```bash
cp packages/core/dist/jui-core.js mock-static-site/assets/jui/
cp packages/ui/dist/jui-ui.js mock-static-site/assets/jui/
cp packages/ui/dist/jui-ui.classic.css mock-static-site/assets/jui/
cp packages/ui/dist/jui-ui.dark.css mock-static-site/assets/jui/
cp packages/grid/dist/jui-grid.js mock-static-site/assets/jui/
cp packages/grid/dist/jui-grid.classic.css mock-static-site/assets/jui/
cp packages/grid/dist/jui-grid.dark.css mock-static-site/assets/jui/
cp packages/chart/dist/jui-chart.js mock-static-site/assets/jui/
cp packages/vue-graph/dist/vue-graph.js mock-static-site/assets/jui/
```

정적 파일 서버로 실행합니다.

```bash
npx serve mock-static-site
```

또는 원하는 정적 서버에서 `mock-static-site/index.html`을 열면 됩니다.

## 필수 E2E 요건

별도 레포의 Playwright 테스트는 다음 항목을 필수로 검증해야 합니다.

- 모든 정적 페이지가 콘솔 오류와 unhandled rejection 없이 로드됩니다.
- 모든 smoke page가 화면의 status board에서 통과 상태를 표시합니다.
- 목 사이트에 노출된 모든 UI 컴포넌트는 최소 1개 이상의 상호작용 assertion을 가집니다.
- Grid 페이지는 렌더링, row count, 선택/정렬, virtual scroll 또는 paging 동작을 검증합니다.
- Chart 페이지는 render node, 데이터 기반 mark, tooltip/legend/widget, resize 안정성을 검증합니다.
- Vue Graph 페이지는 Vue mount와 실제 chart 출력 여부를 검증합니다.
- classic/dark 테마 전환 중 stylesheet 누락이나 깨진 asset 요청이 없어야 합니다.
- 필요한 로컬 asset은 404 없이 로드되어야 합니다.

## 현재 범위

- 필수 파일 구조 검사: `npm run test:mock-static-site`
- 브라우저 smoke 보드: 라이브러리 로딩, 전역 객체, JUI 모듈 등록, 테마 토글, 콘솔 오류 수집
- 실제 컴포넌트 심화 상호작용과 Playwright E2E는 별도 레포 이동 후 필수로 추가합니다.
