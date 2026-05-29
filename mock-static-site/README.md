# JUI 정적 목 사이트

이 디렉터리는 빌드된 JUI 라이브러리를 별도 소비자 프로젝트처럼 로드해서 브라우저에서 확인하기 위한
정적 smoke site 초안입니다. 이후 별도 레포로 옮겨 운영하는 것을 전제로 합니다.

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

## 현재 범위

- 필수 파일 구조 검사: `npm run test:mock-static-site`
- 브라우저 smoke 보드: 라이브러리 로딩, 전역 객체, JUI 모듈 등록, 테마 토글, 콘솔 오류 수집
- 실제 컴포넌트 심화 상호작용과 Playwright E2E는 별도 레포 이동 후 추가하는 것을 권장합니다.
