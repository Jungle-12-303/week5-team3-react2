# Week 5 React Core MVP

React 없이 `FunctionComponent`, `useState`, `useEffect`, `useMemo`, `Virtual DOM diff + patch`를 직접 구현한 최소 시연 프로젝트입니다.

## 실행

```bash
npm install
npm test
python -m http.server 4173
```

브라우저에서 `http://127.0.0.1:4173` 접속

## 데모 구성

- `Alpha Counter`, `Beta Counter`
  - 상태는 모두 루트 컴포넌트에서만 관리
  - 자식 컴포넌트는 props만 받는 순수 함수
- `생명주기 타이머`
  - `useEffect`로 interval 생성 / cleanup
- `엔진 관찰 포인트`
  - `renderCount`로 batching 결과 확인
  - `useMemo`로 요약 정보 계산

## 요구사항 대응

- 함수형 컴포넌트: 모든 UI 조각을 함수로 분리
- `FunctionComponent` 클래스:
  - `hooks` 배열 보유
  - `mount()` 구현
  - `update()` 구현
- Hooks:
  - `useState`
  - `useEffect`
  - `useMemo`
- Virtual DOM:
  - VNode 생성
  - 이전/현재 VDOM diff
  - patch만 실제 DOM 반영
- 상태 관리 제약:
  - 상태는 루트 컴포넌트 `App`에만 존재
  - 자식 컴포넌트는 stateless props-only 구조

## 핵심 파일

- `src/core/vdom.js`
  - VNode 생성
  - DOM 생성
  - diff / patch
- `src/core/function-component.js`
  - `FunctionComponent`
  - `useState`, `useEffect`, `useMemo`
- `src/app.js`
  - 루트 상태 기반 시연 앱
- `tests/`
  - 엔진 단위 테스트 + 앱 통합 테스트

## 발표용 한 줄 설명

`setState`는 값만 바꾸는 것이 아니라, 같은 tick의 상태 변경을 모아 두고 루트 컴포넌트를 다시 실행한 뒤 이전 VDOM과 비교해서 바뀐 DOM만 patch합니다.
