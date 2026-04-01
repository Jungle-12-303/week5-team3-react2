# 시스템 구성도와 흐름도

현재 저장소의 최신 스톱워치 시연 버전을 기준으로 정리한 문서입니다.  
이 문서는 `파일이 어떻게 나뉘어 있는지`, `실행 흐름이 어떻게 이어지는지`, `시연 중 어떤 버튼이 어떤 상태 변화를 만드는지`를 한 번에 이해하는 데 목적이 있습니다.

## 1. 시스템 파일 구성도

```mermaid
flowchart TD
    A["src/app.js<br/>앱 시작점 / mountApp"] --> B["src/RootApp.js<br/>루트 상태 / 이벤트 핸들러 / 화면 조립"]
    B --> C["src/components/StopwatchCard.js<br/>props-only UI 컴포넌트"]
    C --> D["src/utils/formatStopwatch.js<br/>MM:SS.hh 포맷"]

    A --> E["src/core/function-component.js<br/>엔진 공개 API"]
    E --> F["src/core/function-component/FunctionComponent.js<br/>mount / update / scheduleUpdate / unmount"]
    E --> G["src/core/function-component/hooks.js<br/>useState / useEffect / useMemo"]
    G --> H["src/core/function-component/runtime.js<br/>currentInstance 관리"]
    G --> I["src/core/function-component/utils.js<br/>deps 비교"]
    F --> H

    B --> J["src/core/vdom.js<br/>VDOM 공개 API"]
    J --> K["src/core/vdom/vnode.js<br/>VNode 생성 / path 정규화"]
    J --> L["src/core/vdom/diff.js<br/>diff / diffChildren"]
    J --> M["src/core/vdom/patch.js<br/>applyPatches"]
    J --> N["src/core/vdom/dom.js<br/>DOM 생성 / 이벤트 연결"]
    J --> O["src/core/vdom/tree.js<br/>트리 탐색"]
    J --> P["src/core/vdom/helpers.js<br/>path / key 헬퍼"]
    J --> Q["src/core/vdom/constants.js<br/>노드 / 패치 타입"]

    R["tests/app.test.js<br/>스톱워치 시연 흐름 테스트"] --> A
    S["tests/function-component.test.js<br/>hooks / batching 테스트"] --> E
    T["tests/vdom.test.js<br/>diff / patch 테스트"] --> J
```

## 2. 폴더 계층도

```text
src/
├─ app.js
├─ RootApp.js
├─ styles.css
├─ components/
│  └─ StopwatchCard.js
├─ utils/
│  └─ formatStopwatch.js
└─ core/
   ├─ function-component.js
   ├─ vdom.js
   ├─ function-component/
   │  ├─ FunctionComponent.js
   │  ├─ hooks.js
   │  ├─ runtime.js
   │  └─ utils.js
   └─ vdom/
      ├─ constants.js
      ├─ vnode.js
      ├─ dom.js
      ├─ diff.js
      ├─ patch.js
      ├─ tree.js
      └─ helpers.js
```

## 3. 화면 컴포넌트 구조

```mermaid
flowchart TD
    A["RootApp()"] --> B["main.page-shell"]
    B --> C["StopwatchCard(props)"]
    C --> D["p.eyebrow-label<br/>Custom React Stopwatch"]
    C --> E["p.main-time<br/>현재 누적 시간"]
    C --> F["p.sub-time<br/>최근 랩 시간"]
    C --> G["div.stopwatch-actions"]
    G --> H["button.secondary-action<br/>구간 기록 / 초기화"]
    G --> I["button.primary-action<br/>시작 / 정지"]
    C --> J["section.laps-panel"]
    J --> K["div.laps-header<br/>구간 / 구간기록 / 전체 시간"]
    J --> L["div.laps-body 또는 p.empty-laps"]
    L --> M["div.lap-row * n<br/>랩 목록"]
```

## 4. 런타임 전체 흐름

```mermaid
flowchart TD
    A["사용자 버튼 클릭 또는 interval tick"] --> B["RootApp 내부 핸들러 실행"]
    B --> C["setState 호출"]
    C --> D["hooks.js<br/>hook.value 갱신"]
    D --> E["FunctionComponent.scheduleUpdate()"]
    E --> F["queueMicrotask(update)"]

    F --> G["FunctionComponent.update()"]
    G --> H["RootApp() 재실행"]
    H --> I["StopwatchCard(props) 호출"]
    I --> J["h() -> 새 VNode 트리 생성"]
    J --> K["diff(oldVNode, newVNode)"]
    K --> L["patch 배열 생성"]
    L --> M["applyPatches(dom, patches, newVNode)"]
    M --> N["실제 DOM 최소 반영"]

    G --> O["flushEffects()"]
    O --> P["interval effect / document.title effect 실행"]
```

## 5. 사용자 액션별 흐름

```mermaid
flowchart TD
    A["주요 버튼 입력"] --> B{"어떤 버튼인가?"}

    B -->|시작| C["startedAtMs = Date.now() - elapsedMs"]
    C --> D["running = true"]

    B -->|정지| E["running = false"]

    B -->|구간 기록| F{"running && elapsedMs > 0 ?"}
    F -->|예| G["previousTotal 계산"]
    G --> H["nextLap = { id, number, lapMs, totalMs }"]
    H --> I["laps = [nextLap, ...current]"]
    F -->|아니오| J["reset"]

    B -->|초기화| J
    J --> K["running = false"]
    K --> L["elapsedMs = 0"]
    L --> M["startedAtMs = null"]
    M --> N["laps = []"]
```

## 6. effect 중심 흐름

```mermaid
flowchart LR
    A["useEffect(interval)"] --> B{"running && startedAtMs 존재?"}
    B -->|아니오| C["아무 것도 시작하지 않음"]
    B -->|예| D["setInterval(..., 10) 등록"]
    D --> E["elapsedMs = Date.now() - startedAtMs"]
    D --> F["cleanup에서 clearInterval(timerId)"]

    G["useEffect(title)"] --> H["document.title 갱신"]
```

## 7. Hooks 내부 흐름

```mermaid
flowchart LR
    A["렌더 시작"] --> B["hookIndex = 0"]
    B --> C["useState(running)"]
    C --> D["useState(elapsedMs)"]
    D --> E["useState(startedAtMs)"]
    E --> F["useState(laps)"]
    F --> G["useEffect(interval)"]
    G --> H["useMemo(summary)"]
    H --> I["useEffect(title)"]
    I --> J["렌더 종료"]
```

## 8. 실제 호출 순서

```mermaid
sequenceDiagram
    participant U as User
    participant RA as RootApp
    participant HK as hooks.js
    participant FC as FunctionComponent
    participant VD as vdom.js
    participant DOM as Browser DOM

    U->>RA: "시작" 클릭
    RA->>HK: setStartedAtMs(...)
    RA->>HK: setRunning(true)
    HK->>FC: scheduleUpdate()
    FC->>FC: queueMicrotask(update)

    FC->>RA: RootApp() 재실행
    RA->>VD: h(...)로 새 VDOM 생성
    FC->>VD: diff(oldVNode, newVNode)
    VD-->>FC: patches 반환
    FC->>VD: applyPatches(dom, patches, newVNode)
    VD->>DOM: 바뀐 부분만 반영
    FC->>FC: flushEffects()
    FC->>RA: interval effect 실행
```

## 9. 역할 분리 요약

### 앱 계층

- `app.js`: `FunctionComponent`를 생성하고 앱을 mount합니다.
- `RootApp.js`: 상태와 핸들러를 소유하는 루트 컴포넌트입니다.
- `StopwatchCard.js`: props만 받아 화면을 그리는 stateless 자식 컴포넌트입니다.
- `formatStopwatch.js`: 시연 화면에 필요한 시간 문자열 포맷을 담당합니다.

### 함수형 컴포넌트 엔진

- `FunctionComponent.js`: 렌더링 사이클, `mount`, `update`, `scheduleUpdate`, `unmount`를 담당합니다.
- `hooks.js`: `useState`, `useEffect`, `useMemo`를 구현합니다.
- `runtime.js`: 현재 렌더 중인 인스턴스를 보관합니다.
- `utils.js`: 의존성 배열 비교를 담당합니다.

### Virtual DOM 엔진

- `vnode.js`: VNode를 만들고 경로를 정규화합니다.
- `diff.js`: 이전/현재 VDOM을 재귀적으로 비교합니다.
- `patch.js`: diff 결과를 실제 DOM에 반영합니다.
- `dom.js`: VNode를 DOM으로 만들고 이벤트를 연결합니다.
- `tree.js`, `helpers.js`, `constants.js`: 탐색, 경로 처리, 타입 정의를 보조합니다.

## 10. 한 줄 설명

> 사용자의 입력이나 interval tick으로 상태가 바뀌면, 함수형 컴포넌트 엔진이 루트 컴포넌트를 다시 실행하고 새 VDOM을 만든 뒤, diff/patch 엔진이 바뀐 부분만 실제 DOM에 반영합니다.
