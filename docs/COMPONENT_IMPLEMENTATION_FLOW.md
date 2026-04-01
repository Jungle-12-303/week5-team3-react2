# 컴포넌트 구현 시각화 문서

이 문서는 과제의 `Component` 요구사항에 맞춰  
현재 프로젝트에서 **컴포넌트를 어떤 구조로 구현했는지**를 시각적으로 설명하는 문서입니다.

핵심은 이 세 가지입니다.

1. `FunctionComponent` 클래스로 함수형 컴포넌트를 감싼다.
2. 상태는 루트 컴포넌트 `RootApp`에만 둔다.
3. 자식 컴포넌트 `StopwatchCard`는 props만 받는 stateless 컴포넌트로 둔다.

## 1. 전체 컴포넌트 구조

```mermaid
flowchart TD
    A["mountApp()"] --> B["new FunctionComponent(RootApp, container)"]
    B --> C["FunctionComponent 인스턴스"]
    C --> D["mount()"]
    D --> E["RootApp() 실행"]
    E --> F["StopwatchCard(props) 호출"]
    F --> G["VNode 트리 반환"]
    G --> H["실제 DOM 마운트"]
```

## 2. 왜 FunctionComponent 클래스를 두었나

```mermaid
flowchart TD
    A["함수형 컴포넌트는 호출될 때마다 다시 실행됨"] --> B["지역변수만으로는 상태 유지 불가"]
    B --> C["상태를 저장할 외부 컨텍스트 필요"]
    C --> D["FunctionComponent 인스턴스 생성"]
    D --> E["hooks[] 저장"]
    D --> F["hookIndex 관리"]
    D --> G["mount / update / unmount 관리"]
    D --> H["pendingEffects 관리"]
```

### 해설

- 함수형 컴포넌트는 그냥 함수이기 때문에, 호출만으로는 이전 상태를 기억할 수 없습니다.
- 그래서 이 프로젝트에서는 `FunctionComponent`가 런타임 인스턴스 역할을 맡습니다.
- 이 인스턴스 안에 `hooks[]`, `pendingEffects[]`, `vnode`, `dom`이 들어 있습니다.

## 3. 루트와 자식의 역할 분리

```mermaid
flowchart LR
    A["RootApp"] --> A1["루트 상태 보유"]
    A --> A2["이벤트 핸들러 보유"]
    A --> A3["useEffect / useMemo 사용"]
    A --> A4["props 조립"]

    B["StopwatchCard"] --> B1["props 수신"]
    B --> B2["화면만 렌더"]
    B --> B3["상태 없음"]
    B --> B4["hooks 사용 안 함"]
```

## 4. 현재 프로젝트의 컴포넌트 계층

```mermaid
flowchart TD
    A["RootApp()"] --> B["main.page-shell"]
    B --> C["StopwatchCard(props)"]
    C --> D["eyebrow-label"]
    C --> E["main-time"]
    C --> F["sub-time"]
    C --> G["action buttons"]
    C --> H["laps-panel"]
```

### 해설

- `RootApp`은 상태와 동작을 소유하는 루트 컴포넌트입니다.
- `StopwatchCard`는 시계 화면을 그리는 순수 함수형 자식 컴포넌트입니다.
- 과제의 `Lifting State Up` 요구사항을 그대로 따른 구조입니다.

## 5. RootApp 내부 구성

```mermaid
flowchart TD
    A["RootApp"] --> B["state"]
    A --> C["effects"]
    A --> D["memo"]
    A --> E["handlers"]
    A --> F["render"]

    B --> B1["running"]
    B --> B2["elapsedMs"]
    B --> B3["startedAtMs"]
    B --> B4["laps"]

    C --> C1["interval effect"]
    C --> C2["document.title effect"]

    D --> D1["summary 계산"]

    E --> E1["handlePrimaryAction"]
    E --> E2["handleLapRecord"]

    F --> F1["StopwatchCard에 props 전달"]
```

## 6. StopwatchCard 내부 구성

```mermaid
flowchart TD
    A["StopwatchCard(props)"] --> B["formatStopwatch(elapsedMs)"]
    A --> C["formatStopwatch(latestLapMs)"]
    A --> D["버튼 텍스트 결정"]
    A --> E["랩 목록 렌더"]
    E --> F["lap-row class 계산"]
    E --> G["empty-laps 또는 laps-body"]
```

### 해설

- `StopwatchCard`는 상태를 갖지 않습니다.
- 부모가 넘긴 `running`, `elapsedMs`, `laps`, `fastestLapId`, `slowestLapId`를 이용해 화면만 그립니다.
- 즉, 완전한 props-only 컴포넌트입니다.

## 7. mount와 update 흐름

```mermaid
flowchart TD
    A["mount()"] --> B["#render()"]
    B --> C["RootApp() 실행"]
    C --> D["VNode 생성"]
    D --> E["createDOMFromVNode"]
    E --> F["container.replaceChildren"]
    F --> G["flushEffects()"]

    H["update()"] --> I["#render()"]
    I --> J["RootApp() 재실행"]
    J --> K["새 VNode 생성"]
    K --> L["diff(oldVNode, newVNode)"]
    L --> M["applyPatches(dom, patches, newVNode)"]
    M --> N["flushEffects()"]
```

## 8. props 전달 흐름

```mermaid
flowchart TD
    A["RootApp 상태와 계산 결과"] --> B["running"]
    A --> C["elapsedMs"]
    A --> D["latestLapMs"]
    A --> E["laps"]
    A --> F["fastestLapId / slowestLapId"]
    A --> G["onPrimaryAction / onSecondaryAction"]

    B --> H["StopwatchCard(props)"]
    C --> H
    D --> H
    E --> H
    F --> H
    G --> H
```

### 해설

- 자식은 모든 데이터를 props로 받습니다.
- 자식 내부에서 상태를 따로 만들지 않습니다.
- 이 구조 덕분에 데이터 흐름이 한 방향입니다.

## 9. 과제 요구사항과 연결하면

```mermaid
flowchart TD
    A["과제의 Component 요구사항"] --> B["반드시 함수형 컴포넌트"]
    A --> C["FunctionComponent 클래스 필요"]
    A --> D["hooks 배열 필요"]
    A --> E["mount / update 필요"]
    A --> F["루트 상태 관리"]
    A --> G["자식은 stateless props-only"]

    B --> B1["RootApp / StopwatchCard"]
    C --> C1["FunctionComponent.js"]
    D --> D1["this.hooks = []"]
    E --> E1["mount() / update()"]
    F --> F1["RootApp state"]
    G --> G1["StopwatchCard(props)"]
```

## 10. 발표용 한 줄 설명

> 이 프로젝트의 컴포넌트 구조는 `FunctionComponent`가 함수형 컴포넌트의 실행 컨텍스트를 맡고, 루트 `RootApp`이 상태와 로직을 모두 관리하며, 자식 `StopwatchCard`는 props만 받아 화면을 그리는 stateless 구조입니다.
