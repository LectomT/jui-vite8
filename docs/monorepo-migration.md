# 모노레포 전환 기록

작성일: 2026-05-29

## 구조

워크스페이스는 다음 모노레포 구조로 정리했다.

```text
packages/
  core/       # juijs
  ui/         # juijs-ui
  grid/       # juijs-grid
  chart/      # juijs-chart
  vue-graph/  # existing vue-graph package
examples/
tests/e2e/
docs/
```

현재 현대화의 1차 범위는 `packages/core`, `packages/ui`, `packages/grid`,
`packages/chart`, `packages/vue-graph` 전체다. 각 패키지는 루트 npm workspaces에서
관리하며 빌드와 테스트는 루트 명령으로 실행한다.

## Git 메타데이터

기존 패키지별 `.git` 디렉터리는 로컬 백업 목적으로 `.legacy-git/`로 이동했다. 새 모노레포에
커밋하면 안 된다.

기존 패키지별 `node_modules` 디렉터리는 `.legacy-node_modules/`로 이동했다. 워크스페이스
명령은 루트 hoisted install을 통해 의존성을 해석한다.

이 환경의 루트 `.git` 디렉터리는 비어 있는 읽기 전용 디렉터리라서 일반 루트 Git 명령이
동작하지 않을 수 있다. 새 원격 저장소를 만들거나 해당 디렉터리를 교체할 수 있는 환경이
되기 전까지는 다음 명령으로 루트 상태를 확인한다.

```bash
git --git-dir=.monorepo.git --work-tree=. status --short
```

## 도구

루트 `package.json`은 npm workspaces를 사용한다. Biome은 2026-05-29 기준 npm registry에서
확인한 최신 버전인 `2.4.16`으로 고정했다.

초기 명령:

```bash
npm install
npm run check
npm run test
npm run build
```

`npm run check`는 새 워크스페이스 설정과 문서를 검사한다. `npm run check:all`은
기존 패키지 소스 전체를 대상으로 하므로 별도 코드 스타일 정리 단계에서 다룬다.

`npm run test`는 모든 워크스페이스의 Vitest 테스트를 실행한다. 테스트가 없는 패키지는
`--passWithNoTests`로 통과시키고, `vue-graph`의 기존 snapshot 테스트는 Vitest 포맷으로
갱신했다.

`npm run build`는 모든 워크스페이스의 Vite 기반 `dist` 스크립트를 실행한다.
Webpack, Babel, Jest, Rollup 설정 파일과 명시적 의존성은 제거했다.

## 2026-05-29 검증 결과

다음 명령을 통과했다.

```bash
npm run test
npm run build
npm run ci
```

빌드 산출물 크기도 확인했다. 특히 `packages/ui/dist/jui-ui.js`와
`packages/grid/dist/jui-grid.js`가 Vite/Rollup 트리쉐이킹으로 0바이트가 되지 않도록
해당 패키지 빌드 설정에서 `treeshake: false`를 지정했다. 두 패키지는 `jui.use(...)`
등록 부작용이 배포 번들의 핵심 동작이다.

추가 런타임 검증:

- jsdom에서 `packages/core/dist/jui-core.cjs.js` 로딩 및 `util.base` 등록 확인
- jsdom에서 `packages/core/dist/jui-core.esm.js` 로딩 및 `util.base` 등록 확인
- jsdom과 VM 컨텍스트에서 `packages/ui/dist/jui-ui.js`,
  `packages/grid/dist/jui-grid.js` 로딩 및 `ui.dropdown`, `grid.table` 등록 확인
- jsdom에서 `packages/chart/dist/jui-chart.esm.js`,
  `packages/vue-graph/dist/vue-graph.esm.js` 로딩 확인

남은 경고:

- `packages/ui`와 `packages/grid`의 CSS 이미지 및 폰트 URL 일부는 Vite가 빌드 시점에
  해석하지 못해 런타임 상대 경로로 남긴다. 현재는 기존 배포 구조와 호환되는 경고로
  유지했다.
- jsdom의 `HTMLCanvasElement.getContext()` 미구현 경고는 chart import 검증 중 출력되지만
  모듈 로딩과 등록 검증은 통과한다.
