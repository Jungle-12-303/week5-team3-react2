# 클래스 다이어그램 문서

이 문서는 현재 프로젝트의 핵심 타입과 모듈 관계를 클래스 다이어그램 형태로 정리한 문서입니다.

엄밀히 말하면 이 프로젝트는 함수와 모듈 중심 구조이고 클래스는 `FunctionComponent` 하나가 핵심입니다.  
그래서 아래 다이어그램은 `실제 class`와 `구조체처럼 쓰이는 객체 타입`을 함께 보여 주는 방식으로 보는 것이 맞습니다.

## 1. 런타임 클래스 다이어그램

```mermaid
classDiagram
    class FunctionComponent {
      +renderFn
      +container
      +props
      +hooks[]
      +hookIndex
      +pendingEffects[]
      +isMounted
      +updateScheduled
      +vnode
      +dom
      +renderCount
      +mount()
      +update()
      +scheduleUpdate()
      +unmount()
    }

    class StateHook {
      +kind: "state"
      +value
      +setState()
    }

    class EffectHook {
      +kind: "effect"
      +deps[]
      +cleanup()
    }

    class MemoHook {
      +kind: "memo"
      +deps[]
      +value
    }

    class PendingEffect {
      +hook
      +effect()
    }

    FunctionComponent "1" *-- "*" StateHook
    FunctionComponent "1" *-- "*" EffectHook
    FunctionComponent "1" *-- "*" MemoHook
    FunctionComponent "1" *-- "*" PendingEffect
```

## 2. 앱 계층 다이어그램

```mermaid
classDiagram
    class RootApp {
      +running
      +elapsedMs
      +startedAtMs
      +laps[]
      +handlePrimaryAction()
      +handleLapRecord()
      +render()
    }

    class StopwatchCard {
      +running
      +elapsedMs
      +latestLapMs
      +laps[]
      +fastestLapId
      +slowestLapId
      +onPrimaryAction()
      +onSecondaryAction()
      +render()
    }

    class Lap {
      +id
      +number
      +lapMs
      +totalMs
    }

    RootApp --> StopwatchCard : passes props
    RootApp "1" *-- "*" Lap
```

## 3. Virtual DOM 타입 다이어그램

```mermaid
classDiagram
    class ElementVNode {
      +type: "element"
      +tag
      +attrs
      +children[]
      +text
      +key
      +path
      +depth
    }

    class TextVNode {
      +type: "text"
      +tag: null
      +attrs
      +children[]
      +text
      +key
      +path
      +depth
    }

    class Patch {
      +type
      +path
    }

    class CreatePatch {
      +parentPath
      +index
      +node
    }

    class RemovePatch {
      +parentPath
      +index
      +node
    }

    class ReplacePatch {
      +oldNode
      +newNode
    }

    class TextPatch {
      +oldText
      +newText
    }

    class AttrSetPatch {
      +name
      +value
    }

    class AttrRemovePatch {
      +name
    }

    class ReorderChildrenPatch {
      +parentPath
      +order[]
    }

    ElementVNode "1" *-- "*" ElementVNode
    ElementVNode "1" *-- "*" TextVNode
    Patch <|-- CreatePatch
    Patch <|-- RemovePatch
    Patch <|-- ReplacePatch
    Patch <|-- TextPatch
    Patch <|-- AttrSetPatch
    Patch <|-- AttrRemovePatch
    Patch <|-- ReorderChildrenPatch
```

## 4. 모듈 관계 다이어그램

```mermaid
classDiagram
    class app_js {
      +mountApp()
    }

    class RootApp_js {
      +RootApp()
    }

    class StopwatchCard_js {
      +StopwatchCard()
    }

    class function_component_js {
      +FunctionComponent
      +useState()
      +useEffect()
      +useMemo()
    }

    class hooks_js {
      +useState()
      +useEffect()
      +useMemo()
    }

    class runtime_js {
      +assertHookContext()
      +getCurrentInstance()
      +setCurrentInstance()
    }

    class vdom_js {
      +h()
      +diff()
      +applyPatches()
      +createDOMFromVNode()
    }

    class diff_js {
      +diff()
      +diffChildren()
    }

    class patch_js {
      +applyPatches()
    }

    app_js --> function_component_js
    app_js --> RootApp_js
    RootApp_js --> StopwatchCard_js
    RootApp_js --> function_component_js
    RootApp_js --> vdom_js
    StopwatchCard_js --> vdom_js
    function_component_js --> hooks_js
    hooks_js --> runtime_js
    function_component_js --> vdom_js
    vdom_js --> diff_js
    vdom_js --> patch_js
```

## 5. 해설

- `FunctionComponent`는 이 프로젝트의 핵심 런타임 클래스입니다.
- `StateHook`, `EffectHook`, `MemoHook`은 클래스라기보다 저장 구조체에 가깝습니다.
- `RootApp`은 루트 상태와 로직을 가진 함수형 컴포넌트입니다.
- `StopwatchCard`는 props-only 자식 컴포넌트입니다.
- `ElementVNode`, `TextVNode`, `Patch` 계열은 VDOM과 diff 결과를 표현하는 데이터 구조입니다.

## 6. 발표용 한 줄 설명

> 클래스 다이어그램 관점에서 보면, `FunctionComponent`가 런타임 중심 클래스이고, 그 안에 hook 상태와 pending effect가 매달리며, 앱 계층에서는 `RootApp`이 상태를 소유하고 `StopwatchCard`는 props-only 자식으로 연결되는 구조입니다.
