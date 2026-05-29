# JUI Modern Monorepo

JUI 패키지군을 React 19, Vite 8 이상 시대의 프런트엔드 도구 체인에서
구동할 수 있도록 현대화하는 모노레포입니다. 현재 1차 정리의 기준은 기존
Webpack, Babel, Jest 설정과 명시적 의존성을 제거하고 Vite, Vitest, Biome
기반으로 전체 패키지를 빌드 및 테스트할 수 있는 상태를 만드는 것입니다.

## 패키지 구조

```text
packages/
  core/       juijs
  ui/         juijs-ui
  grid/       juijs-grid
  chart/      juijs-chart
  vue-graph/  vue-graph
docs/
```

## Upstream

- `packages/core`: https://github.com/juijs/jui-core.git
- `packages/ui`: https://github.com/juijs/jui-ui.git
- `packages/grid`: https://github.com/juijs/jui-grid.git
- `packages/chart`: https://github.com/juijs/jui-chart.git
- `packages/vue-graph`: https://github.com/juijs/vue-graph.git

## 도구 체인

- 패키지 관리: npm workspaces
- 빌드: Vite `8.0.14`
- 테스트: Vitest `4.1.7`, jsdom `29.1.1`
- 스타일 빌드: Less `4.6.4`
- 포매팅 및 정적 검사: Biome `2.4.16`
- Node.js: `>=22`

명시적 Webpack, Babel, Jest 의존성과 설정 파일은 제거했습니다. 레거시
패키지별 Git 및 `node_modules` 백업은 `.legacy-git/`, `.legacy-node_modules/`에
보관되며 새 모노레포 커밋 대상이 아닙니다.

## 주요 명령

```bash
npm install
npm run check
npm run test
npm run build
npm run ci
```

`npm run ci`는 `check`, `test`, `build`를 순서대로 실행합니다.

## 현재 검증 상태

2026-05-29 기준 다음 명령을 통과했습니다.

- `npm run test`
- `npm run build`
- `npm run ci`

추가로 jsdom 환경에서 core CJS/ESM 번들, ui/grid IIFE 번들, chart/vue-graph ESM
번들의 기본 로딩을 확인했습니다.

## 알려진 빌드 경고

Vite 빌드 중 `packages/ui`와 `packages/grid`의 CSS에서 이미지 및 폰트 URL을
빌드 시점에 해석하지 못했다는 경고가 출력됩니다. 현재는 기존 배포 구조와
동일하게 런타임 상대 경로로 남기는 상태이며 빌드 실패는 아닙니다.
