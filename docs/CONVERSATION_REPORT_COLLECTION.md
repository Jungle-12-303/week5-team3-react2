# 대화 기반 보고서 모음집

이 문서는 현재 프로젝트를 이해하기 위해 진행한 대화 내용을 축적하는 작업 노트입니다.  
이후 대화에서 나온 설명, 설계 판단, 발표 포인트를 계속 이어서 정리하는 용도로 사용합니다.

## 1. 프로젝트 한 줄 요약

Week 3의 Virtual DOM 엔진을 기반으로, Week 5 과제 요구사항인 `FunctionComponent`, `useState`, `useEffect`, `useMemo`, 루트 상태 관리, diff/patch 기반 업데이트를 직접 얹어 만든 커스텀 React 코어 MVP입니다.

최종 시연 UI는 다음 3개 섹션으로 고정되어 있습니다.

- 카운트 1
- 카운트 2
- 시계

## 2. 현재 결과물 구조 요약

### 엔진 레이어

- `src/core/vdom.js`
  - 이전 프로젝트의 `core/vdom.js` 구조를 바탕으로 확장
  - VNode 생성
  - DOM 생성
  - Diff
  - Patch
  - 이벤트 리스너 연결

- `src/core/function-component.js`
  - `FunctionComponent` 클래스
  - `hooks[]` 배열 관리
  - `mount()`
  - `update()`
  - `scheduleUpdate()`를 통한 batching
  - `useState`, `useEffect`, `useMemo`

### 앱 레이어

- `src/app.js`
  - 루트 `App()`에서만 상태 관리
  - `CounterCard`, `TimerCard`는 props-only 자식 컴포넌트
  - 과제 요구사항인 lifting state up 패턴을 유지

### 테스트 레이어

- `tests/vdom.test.js`
  - diff/patch 검증
- `tests/function-component.test.js`
  - hooks 및 batching 검증
- `tests/app.test.js`
  - 실제 앱 흐름 검증

## 3. 과제 요구사항 체크 결과

### 구현 요구사항

- 함수형 컴포넌트 사용: 충족
- `FunctionComponent` 클래스 구현: 충족
- `hooks` 배열 보유: 충족
- `mount()` 구현: 충족
- `update()` 구현: 충족
- `useState` 구현: 충족
- `useEffect` 구현: 충족
- `useMemo` 구현: 충족
- Virtual DOM 생성: 충족
- 이전/현재 Virtual DOM diff: 충족
- patch를 통한 실제 DOM 최소 반영: 충족

### 설계 제약

- Hook은 최상위 컴포넌트에서만 사용: 현재 앱 기준 충족
- 상태는 루트에서만 관리: 충족
- 자식은 stateless props-only: 충족

### 품질

- 단위 테스트 존재: 충족
- 기능 테스트 존재: 충족
- batching 구현: 충족

## 4. 이전 프로젝트 활용 관점 정리

이 프로젝트는 이전 저장소를 "그대로 복붙"한 것이 아니라, **이전 저장소의 Virtual DOM 코어를 가져와 현재 구조에 맞게 확장한 형태**입니다.

발표용으로는 아래처럼 설명하는 것이 가장 정확합니다.

> Week 3에서 만든 Virtual DOM 엔진을 기반으로 diff/patch 코어를 재사용했고, 이번 과제에서는 그 위에 FunctionComponent와 Hooks 런타임을 추가해 React 형태로 확장했습니다.

즉,

- 이전 프로젝트의 핵심 재귀 diff 구조를 활용했고
- 현재 프로젝트의 hooks 런타임은 새로 구현했습니다.

## 5. 자료구조 관점 정리

### 핵심 자료구조

- `VNode 트리`
  - 각 노드는 `type`, `tag`, `attrs`, `children`, `text`, `key`, `path`, `depth`를 가짐
- `hooks 배열`
  - hook 호출 순서에 따라 상태를 저장
- `pendingEffects 배열`
  - 렌더 후 실행할 effect를 모음
- `patch 배열`
  - DOM에 반영할 연산 목록
- `Map(key -> index)`
  - 형제 노드 비교 및 reorder 계산에 사용

### 이 자료구조들이 중요한 이유

- 트리: UI 구조를 계층적으로 표현할 수 있음
- 배열: hooks를 호출 순서 기반으로 저장할 수 있음
- 맵: 자식 리스트 비교를 효율적으로 할 수 있음

## 6. 알고리즘 관점 정리

### 렌더링 파이프라인

1. 상태 변경
2. 컴포넌트 함수 재실행
3. 새 VDOM 생성
4. 이전 VDOM과 diff
5. patch만 실제 DOM에 반영

### 핵심 알고리즘

- `useState`
  - `hooks[index]` 기반 상태 저장
- `useEffect`
  - deps 비교 후 effect 큐 적재
- `useMemo`
  - deps 비교 후 계산 결과 재사용
- `diff`
  - 재귀적으로 old/new VNode 비교
- `diffChildren`
  - key 기반 자식 배열 비교
- `applyPatches`
  - remove/create/update/reorder 순으로 DOM 반영
- `scheduleUpdate`
  - `queueMicrotask` 기반 batching

## 7. 발표에서 강조할 좋은 점

- React 핵심 개념을 직접 구현했다는 점
- 상태 변경이 왜 다시 렌더링을 일으키는지 설명할 수 있다는 점
- hooks가 왜 호출 순서에 의존하는지 보여줄 수 있다는 점
- Virtual DOM이 왜 전체 DOM을 갈아엎지 않고 필요한 부분만 바꾸는지 설명 가능하다는 점
- batching까지 직접 구현해 본 점

## 8. 비판적으로 봐야 할 한계

- 루트 상태 구조라 작은 상태 변화도 `App` 전체 재실행으로 연결됨
- `diff()`가 VNode를 일부 직접 정규화하므로 완전한 순수 함수는 아님
- 이벤트 시스템은 실제 React보다 훨씬 단순함
- 컴포넌트별 독립 렌더링 컨텍스트(Fiber 수준)는 없음
- key reorder 로직은 있으나 현재 MVP에서 크게 활용되지는 않음

## 9. 실제 React와의 차이

- 실제 React는 Fiber 구조를 사용하지만 현재 구현은 단일 루트 중심 구조
- 실제 React는 더 정교한 스케줄링과 우선순위를 지원
- 실제 React는 synthetic event 시스템을 가짐
- 현재 구현은 교육용/과제용 원리 증명에 초점이 맞춰져 있음

## 10. 현재 발표용 핵심 문장

### 구현 관점

> setState는 값만 바꾸는 것이 아니라, 루트 컴포넌트를 다시 실행하고 새 Virtual DOM을 만든 뒤, 이전 Virtual DOM과 비교해서 바뀐 부분만 DOM에 반영합니다.

### 이전 프로젝트 활용 관점

> Week 3에서 만든 Virtual DOM 엔진의 diff/patch 코어를 재사용하고, 이번에는 그 위에 FunctionComponent와 Hooks를 추가해 React처럼 확장했습니다.

### 자료구조/알고리즘 관점

> 이 엔진은 트리(VNode), 배열(hooks, patches), 맵(key-index map)이라는 기본 자료구조 위에, 재귀 diff 알고리즘과 경로 기반 patch 알고리즘을 얹어서 React의 렌더링 원리를 단순화해 보여주는 구조입니다.

## 11. 진행 메모

- UI는 현재 원형 카드 디자인으로 고정
- 최종 결과물은 카운트 1, 카운트 2, 시계 3개 섹션 유지
- 이전 프로젝트의 코어 활용 사실은 발표 때 반드시 분명히 설명
- 이후 대화에서 나온 설명은 이 문서에 계속 추가
