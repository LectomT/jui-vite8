# jui-grid 현대화 구조 분석 및 작업 계획

작성일: 2026-05-29

## 목표

`jui-grid`를 React 19 이상, Vite 8 이상 기반 애플리케이션에서 안정적으로 사용할 수 있게 만든다. 범위는 `jui-grid` 단독이 아니라 `jui-core`(`juijs`)와 `jui-ui`까지 포함한 전체 JUI 패키지군이다.

우선순위는 다음과 같이 둔다.

1. Webpack 기반 빌드를 먼저 제거하고 Vite 8 기반 빌드로 전환한다.
2. `jui-grid`, `jui-core`, `jui-ui`의 jQuery 의존을 전체 패키지군 기준으로 최대한 빠르게 제거한다.
3. React 19 adapter는 Vite 전환과 jQuery 제거가 회귀되지 않도록 검증하는 통합 사용 사례로 둔다.

현재 목표는 기존 JUI 방식의 공개 API를 즉시 폐기하는 것이 아니라, 공개 API를 가능한 한 유지하면서 빌드 체계와 DOM 의존 구조를 먼저 현대화하는 것이다.

## 현재 구조 요약

작업 대상 패키지는 `jui-grid`이며, npm 패키지명은 `juijs-grid`이다. 현재 소스는 ES module 문법을 쓰지만, 런타임 모델은 `juijs` 싱글턴에 컴포넌트를 등록하는 구조이다.

주요 파일:

- `src/main.js`: `juijs`를 가져와 다시 내보내는 진입점.
- `src/components/table.js`: `grid.table` 컴포넌트. 정렬, 컬럼 크기 변경, 선택, 체크, 행 편집, 확장 행, CSV 내보내기, 스크롤 처리 담당.
- `src/components/xtable.js`: `grid.xtable` 컴포넌트. 헤더와 본문 테이블을 나누고 페이징, 버퍼, 가상 스크롤을 처리한다.
- `src/base/core.js`: 행과 컬럼 컬렉션, 테이블 본문 갱신, 트리 행 조작의 중심 모듈.
- `src/base/row.js`, `src/base/column.js`: 행과 컬럼 모델.
- `src/base/binder.js`: `data-bind` 기반 바인더. jQuery 플러그인 형태로 `table.js`에서 `$.fn.jbinder`로 연결된다.
- `src/styles/**`: Less 기반 테마와 공통 스타일. `juijs-ui`의 스타일을 함께 가져온다.
- `bundles/**`: 개발 및 배포 번들 진입점.
- `examples/**`: 브라우저 전역 스크립트 방식 예제. 현재 jQuery와 JUI core CDN을 직접 로드한다.

관련 인접 패키지:

- `jui-core`: `juijs` 패키지. `jui-grid`의 런타임 등록, 이벤트, 유틸리티 기반이다. 자체적으로 jQuery 의존을 가진다.
- `jui-ui`: 드롭다운과 모달 컴포넌트, 스타일을 제공한다. `jui-grid`가 `DropdownComp`, `ModalComp`, Less 파일을 직접 가져온다. 이 패키지도 jQuery 의존을 가진다.

## 현재 기술 스택과 제약

초기 분석 시점의 `jui-grid` 빌드는 Webpack 4, Babel 6, Less 3,
`extract-text-webpack-plugin`, `uglifyjs-webpack-plugin`에 묶여 있었다. 2026-05-29
현재 모노레포 전환 후 명시적 Webpack, Babel, Jest 설정과 의존성은 제거했고,
Vite 8, Vitest 4, Less 4 기반으로 전체 워크스페이스 `test`, `build`, `ci`가 통과한다.
`jui-grid` 자체 테스트는 아직 없으므로 `--passWithNoTests`로 통과시키는 상태다.

현재 의존:

- 런타임: `jquery`, `lodash.throttle`, `juijs`, `juijs-ui`
- 개발 도구: Vite 8, Vitest 4, Less 4, Biome 2

확인한 최신 외부 기준:

- React 공식 문서 기준 최신 메이저는 React 19이며, 현재 문서는 React 19.2를 최신으로 안내한다. React 19 기반 앱에서는 `createRoot`, `root.unmount`, `StrictMode`의 추가 개발 검사를 고려해야 한다.
- Vite 8은 2026-03-12에 안정 버전으로 발표되었고, 공식 마이그레이션 문서는 Vite 8이 Rolldown과 Oxc 기반 도구를 사용한다고 안내한다.

참고:

- React versions: https://react.dev/versions
- React `createRoot`: https://react.dev/reference/react-dom/client/createRoot
- React `StrictMode`: https://react.dev/reference/react/StrictMode
- Vite 8 announcement: https://vite.dev/blog/announcing-vite8
- Vite migration from v7: https://vite.dev/guide/migration.html

## 주요 위험

1. React 생명주기와 명령형 DOM 변경 충돌

   `grid.table`과 `grid.xtable`은 내부에서 DOM을 직접 복제, 래핑, 삭제, 이동한다. React가 같은 DOM 하위 트리를 직접 관리하면 충돌할 수 있다. React 호환 계층은 React가 관리하는 루트 안에 독립 컨테이너를 만들고, JUI 인스턴스의 생성과 해제를 `useLayoutEffect` 또는 명확한 effect cleanup에서 처리해야 한다.

2. StrictMode 개발 중 중복 mount

   React `StrictMode`는 개발 중 effect와 ref callback을 추가로 실행한다. 현재 JUI 컴포넌트는 전역 resize 등록, body에 드롭다운 추가, 이벤트 바인딩, jQuery plugin 확장 같은 부작용이 있다. cleanup이 불완전하면 개발 모드에서 이벤트와 DOM 노드가 중복될 수 있다.

3. jQuery 의존 범위가 패키지 하나에만 있지 않음

   `jui-grid`는 모든 핵심 JS 파일에서 jQuery를 직접 사용한다. 또한 `juijs`와 `juijs-ui`도 jQuery 의존을 가진다. `jui-grid` 안의 `$()` 호출만 바꿔서는 패키지 전체에서 jQuery를 제거할 수 없다.

4. Vite 라이브러리 빌드와 기존 배포 산출물 차이

   현재 배포는 `dist/jui-grid.js`, `dist/jui-grid.min.js`, 테마 CSS를 Webpack 설정으로 만든다. Vite 라이브러리 빌드로 바꾸면 ESM, CJS, UMD/IIFE 산출물, CSS 분리, external 처리 정책을 새로 정의해야 한다.

5. Webpack 제거를 늦출 때 생기는 회귀 위험

   Webpack 4 설정을 장기간 병행하면 `~` Less import, Webpack 전용 loader/plugin, CommonJS 중심 production entry가 계속 기준점으로 남는다. 이후 Vite나 jQuery 제거 작업이 다시 Webpack 호환을 위해 되돌아갈 가능성이 높으므로, Webpack 제거를 초기 마이그레이션의 진입점으로 삼는다.

6. Less와 테마 import 경로

   스타일은 `~juijs-ui/...` Webpack 해석 규칙에 기대고 있다. Vite에서는 이 import 규칙이 그대로 동작하지 않을 수 있으므로 Less import 경로와 패키지 exports 정책을 함께 정리해야 한다.

## 현대화 원칙

- 먼저 최소 회귀 테스트를 만들고, Webpack 제거와 Vite 8 전환을 초기 진입점으로 삼는다.
- 기존 `grid.table`, `grid.xtable` JUI API는 1차 마일스톤에서 유지한다.
- React 컴포넌트는 기존 명령형 컴포넌트를 감싸는 adapter로 시작한다.
- jQuery 제거는 `jui-grid`, `jui-core`, `jui-ui` 전체 패키지군을 대상으로 진행한다.
- `juijs`와 `juijs-ui` 의존은 유지 여부를 나중에 판단하지 않고, 함께 현대화하는 전제로 계획한다.
- Webpack 호환 유지 때문에 Vite, React, jQuery 제거 작업이 후퇴하지 않도록 Webpack 설정은 빠르게 삭제한다.
- 각 기능 변경은 실패하는 테스트를 먼저 추가한 뒤 수정한다.

## 제안 작업 단계

### 0단계: 최소 기준선 테스트 고정

- 현재 Webpack 빌드는 장기 기준선이 아니라 제거 대상이다. 삭제 전 최소 동작만 테스트로 고정한다.
- 현재 예제 중 최소 2개를 브라우저 테스트 대상으로 고른다.
- `table` 기본 렌더링, 정렬, 컬럼 resize, row select, `xtable` 가상 스크롤을 스모크 테스트 후보로 잡는다.
- 현재 산출물 이름과 CSS 이름은 호환성 확인 자료로만 문서화한다.

완료 기준:

- Webpack 삭제 전에 `table`과 `xtable`의 최소 동작을 확인할 수 있는 자동 테스트가 있다.
- Webpack 설정 자체를 보존하기 위한 테스트는 만들지 않는다.

### 1단계: Vite 8 빌드 전환 및 Webpack 제거

- `jui-grid`, `jui-core`, `jui-ui` 각각에 Vite 8 기반 build/dev/test 설정을 추가한다.
- 기존 Webpack 설정과 Webpack 전용 플러그인, loader, npm scripts를 제거한다.
- Babel 6 기반 transpile 경로를 제거하고 Vite/Rolldown/Oxc 또는 필요한 최소 TypeScript/JavaScript 빌드 설정으로 대체한다.
- `~juijs-ui/...` Less import를 Vite 호환 경로 또는 명시적 alias로 정리한다.
- library build 산출물을 ESM 우선으로 정의하고, 필요한 경우 CJS/UMD 호환 산출물은 별도 결정한다.
- `package.json`의 `main`, `module`, `exports`, `sideEffects`, CSS export 정책을 함께 정리한다.

완료 기준:

- Webpack 관련 설정 파일과 scripts가 `jui-grid`, `jui-core`, `jui-ui`의 기본 빌드 경로에서 제거되어 있다.
- Vite 8로 세 패키지를 빌드할 수 있다.
- React 19 + Vite 8 샘플 앱에서 `juijs-grid`를 import할 수 있다.

### 2단계: 테스트 인프라 확장

- Vitest 또는 동등한 단위 테스트 러너를 추가한다.
- DOM 테스트 환경은 `jsdom` 또는 `happy-dom`으로 시작한다.
- 실제 스크롤, layout, resize가 필요한 동작은 Playwright 테스트로 분리한다.
- 테스트 fixture로 최소 HTML 테이블 마크업과 데이터 세트를 만든다.

필수 테스트 후보:

- `jui-core`: component registry, event lifecycle, utility functions used by grid/ui.
- `jui-ui`: dropdown, modal, shared DOM/event behavior used by grid.
- `jui-grid/src/base/binder.js`: `data-bind` 파싱, 값 설정, 이벤트 자동 바인딩, destroy 동작.
- `jui-grid/src/base/row.js`: 행 생성, 자식 행 추가, reload, remove 동작.
- `jui-grid/src/base/core.js`: append, insert, update, remove, tree row 동작.
- `jui-grid/grid.table`: 초기화, update, sort, select, check, resize, expand.
- `jui-grid/grid.xtable`: split table 생성, paging, virtual scroll, scroll sync.

완료 기준:

- `npm test` 또는 새 표준 테스트 명령이 존재한다.
- 최소 렌더링 테스트와 핵심 DOM 변경 테스트가 자동화되어 있다.

### 3단계: React 19 adapter 추가

제안 API:

```jsx
import { JuiTable, JuiXTable } from "juijs-grid/react";

<JuiTable
  fields={["name", "count"]}
  data={rows}
  options={{ sort: true, resize: true }}
/>
```

adapter 원칙:

- React는 wrapper 컨테이너만 렌더링한다.
- 내부 table 마크업과 JUI 인스턴스는 effect에서 생성한다.
- cleanup에서 JUI destroy, 이벤트 해제, 추가 DOM 제거를 반드시 수행한다.
- `StrictMode`에서 mount, cleanup, remount가 반복되어도 중복 이벤트와 중복 DOM이 없어야 한다.
- props 변경 시 전체 재생성할 항목과 인스턴스 메서드로 갱신할 항목을 구분한다.

완료 기준:

- React 19 `StrictMode` 샘플에서 경고 없이 mount와 unmount가 반복된다.
- 같은 데이터를 두 번 렌더링해도 DOM이 중복되지 않는다.
- adapter 단위 테스트와 Playwright 통합 테스트가 있다.

### 4단계: jQuery 사용 격리 및 제거

- `jui-grid`, `jui-core`, `jui-ui`의 `$()` 직접 사용을 먼저 목록화한다.
- jQuery 대체를 위한 DOM/event helper를 패키지 공용 유틸로 둘지, 각 패키지 내부에 둘지 결정한다.
- 새 코드에서는 jQuery를 금지하고, 기존 코드는 테스트가 붙은 단위부터 빠르게 치환한다.

초기 adapter 후보:

- selector query: `find`, `children`, `parent`
- class 조작: `addClass`, `removeClass`, `hasClass`
- 속성 및 스타일: `attr`, `css`, `outerWidth`, `outerHeight`
- DOM 변경: `append`, `remove`, `wrap`, `clone`, `html`
- 이벤트: `on`, `off`, `scroll`
- collection helper: `each`, `inArray`

완료 기준:

- `jui-grid`, `jui-core`, `jui-ui` 새 코드에서 jQuery import가 없다.
- `jui-grid` 직접 jQuery 의존이 제거되어 있다.
- `jui-ui`의 dropdown/modal 경로에서 jQuery 의존이 제거되어 있다.
- `jui-core`의 grid/ui 사용 경로에서 jQuery 의존이 제거되어 있다.

### 5단계: 전체 JUI 패키지군 jQuery dependency 제거

선택지:

- 기본 방향: `jquery`를 dependency와 peer dependency 어디에도 남기지 않는다.
- 임시 peer dependency는 외부 호환성 때문에 반드시 필요한 경우에만 짧은 기간 허용한다.
- jQuery plugin 형태 API는 유지 가치가 낮으면 제거하고, 필요하면 별도 compatibility package로 분리한다.

권장 순서:

1. `jui-core`의 core runtime에서 jQuery 사용을 제거한다.
2. `jui-ui`의 dropdown/modal과 shared style/runtime 경로에서 jQuery 사용을 제거한다.
3. `jui-grid`의 table/xtable/base/binder 경로에서 jQuery 사용을 제거한다.
4. 세 패키지의 `package.json`에서 `jquery`를 제거한다.
5. examples와 docs에서 jQuery CDN 안내를 제거한다.

## 테스트 전략

기능 추가 또는 버그 수정 시에는 다음 순서를 기본으로 한다.

1. 재현 테스트 작성.
2. 테스트 실패 확인.
3. 구현 방법을 이슈 또는 `docs` 문서에 업데이트.
4. 코드 수정.
5. 테스트 통과 확인.
6. 실패하면 새 가설을 세우고 반복한다. 두 번 이상 다른 방법을 시도할 때는 이전 접근과 겹치지 않는 새 원인을 명시한다.

테스트 계층:

- 단위 테스트: binder, row, column, base core의 순수 로직과 DOM 조작.
- 통합 테스트: `grid.table`, `grid.xtable` 초기화와 옵션 조합.
- E2E 테스트: React 19 + Vite 8 샘플 앱에서 실제 browser layout, scroll, resize, unmount 검증.
- 빌드 테스트: 세 패키지의 Vite library build, 타입 선언 생성 여부, CSS 산출물 확인.

## 이슈 업데이트 초안

제목:

`Modernize jui-grid for React 19 and Vite 8`

본문 초안:

```md
## Goal

Make `juijs-grid` usable in React 19+ and Vite 8+ applications while preserving the existing JUI component API during the first migration phase.

## Current Findings

- `jui-grid` was migrated from Webpack 4, Babel 6, and Less 3 to Vite 8, Vitest 4, and Less 4 in the monorepo baseline.
- Runtime registration is based on the `juijs` singleton and component descriptors such as `grid.table` and `grid.xtable`.
- `jui-grid`, `juijs`, and `juijs-ui` all include jQuery dependencies, so jQuery removal must be staged.
- `jui-grid` has a Vitest script, but no package-local behavior tests yet.

## Proposed Plan

1. Establish minimum baseline tests for current `table` and `xtable` behavior.
2. Add and expand test infrastructure before behavior changes.
3. Add React 19 adapter components with strict cleanup semantics.
4. Remove jQuery usage across `jui-grid`, `jui-core`, and `jui-ui`.
5. Remove jQuery dependencies and jQuery CDN examples from the package family.

## Acceptance Criteria

- React 19 StrictMode sample mounts and unmounts without duplicate DOM or event handlers.
- Vite 8 sample app imports the package successfully.
- `grid.table` and `grid.xtable` core behavior remains covered by automated tests.
- jQuery is removed from the package family or every remaining compatibility exception is explicitly isolated.
```

상태 제안:

- 새 이슈라면 `Open` 상태로 만들고 `modernization`, `vite`, `jquery-removal`, `react` 라벨을 붙인다.
- 이미 연결된 이슈가 있다면 현재 단계는 `Vite baseline complete / jQuery removal next`로 업데이트해도 된다.
- 다음 구현 이슈는 `grid.table`과 `grid.xtable`의 최소 기준선 테스트 작성 후 jQuery 제거를 시작하는 흐름으로 잡는다.

## 다음 결정 필요 사항

- React adapter를 같은 패키지의 subpath export로 둘지, 별도 패키지로 분리할지 결정해야 한다.
- Vite 전환 후 legacy UMD/IIFE 산출물을 유지할지, ESM 중심으로 정리할지 결정해야 한다.
- `jui-core`, `jui-ui`, `jui-grid`를 npm dependency가 아니라 workspace/local path 기준으로 함께 빌드하도록 묶을지 결정해야 한다.
- jQuery plugin compatibility를 완전히 제거할지, 별도 compatibility package로 분리할지 결정해야 한다.
