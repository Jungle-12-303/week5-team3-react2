# Week 5 React Core Stopwatch MVP

React 없이 `FunctionComponent`, `useState`, `useEffect`, `useMemo`, `Virtual DOM diff + patch`를 직접 구현한 커스텀 React 코어 시연 프로젝트입니다.

현재 시연 화면은 갤럭시 시계 앱의 스톱워치에서 영감을 받은 `스톱워치 + 구간 기록(lap)` 구조입니다.

## 문서

- [중간 분석 보고서](./docs/INTERMEDIATE_REVIEW_REPORT.md)
- [마스터 다이어그램 아틀라스](./docs/MASTER_DIAGRAM_ATLAS.md)
- [과제 요구사항 · 구현 매핑 문서](./docs/REQUIREMENTS_IMPLEMENTATION_MAP.md)
- [컴포넌트 구현 시각화 문서](./docs/COMPONENT_IMPLEMENTATION_FLOW.md)
- [Hooks · Virtual DOM 연결 흐름도](./docs/HOOKS_VDOM_FLOW.md)
- [클래스 다이어그램 문서](./docs/CLASS_DIAGRAM.md)
- [시스템 구성도와 흐름도](./docs/FLOWCHARTS.md)
- [자료구조 · 알고리즘 시각화](./docs/DS_ALGO_DIAGRAMS.md)
- 브라우저용 문서
  - `docs/MASTER_DIAGRAM_ATLAS.html`
  - `docs/REQUIREMENTS_IMPLEMENTATION_MAP.html`
  - `docs/COMPONENT_IMPLEMENTATION_FLOW.html`
  - `docs/HOOKS_VDOM_FLOW.html`
  - `docs/CLASS_DIAGRAM.html`
  - `docs/FLOWCHARTS.html`
  - `docs/DS_ALGO_DIAGRAMS.html`

## 실행

```bash
npm install
npm test
python -m http.server 4173
```

브라우저에서 `http://127.0.0.1:4173` 접속

## 데모 구성

- `스톱워치`
  - `시작`, `정지`, `초기화`
  - `00:00.00` 형식의 메인 시간 표시
- `구간 기록`
  - 구간 버튼 클릭 시 랩 목록 누적
  - `구간 / 구간기록 / 전체 시간` 표시
  - 최신 랩, 빠른 랩, 느린 랩 강조
- `커스텀 React 코어 시연 포인트`
  - 루트 컴포넌트 상태 관리
  - hooks 배열 기반 상태 유지
  - `useEffect` interval 등록 / cleanup
  - `useMemo` 랩 요약 계산
  - VDOM diff / patch 기반 최소 DOM 갱신
  - `queueMicrotask` 기반 batching

## 요구사항 대응

- 함수형 컴포넌트
  - 모든 UI 조각을 함수형 컴포넌트로 구현
- `FunctionComponent` 클래스
  - `hooks` 배열 보유
  - `mount()` 구현
  - `update()` 구현
- Hooks
  - `useState`
  - `useEffect`
  - `useMemo`
- Virtual DOM
  - VNode 생성
  - 이전/현재 VDOM diff
  - patch만 실제 DOM 반영
- 상태 관리 제약
  - 상태는 루트 컴포넌트 `RootApp`에만 존재
  - 자식 컴포넌트 `StopwatchCard`는 stateless props-only 구조

## 핵심 파일

- `src/app.js`
  - 앱 mount 진입점
- `src/RootApp.js`
  - 루트 상태, 핸들러, effect, memo, 화면 조립
- `src/components/StopwatchCard.js`
  - props-only UI 컴포넌트
- `src/utils/formatStopwatch.js`
  - 시간 포맷 유틸
- `src/core/function-component/*`
  - `FunctionComponent`, hooks 런타임
- `src/core/vdom/*`
  - VNode 생성, diff, patch, DOM 변환
- `tests/*`
  - 엔진 단위 테스트 + 앱 통합 테스트

## 발표용 한 줄 설명

`setState`는 값만 바꾸는 것이 아니라, update를 microtask로 예약해 같은 동기 구간의 상태 변경을 묶고, 루트 컴포넌트를 다시 실행해 새 VDOM을 만든 뒤 이전 VDOM과 비교해서 바뀐 DOM만 patch합니다.
