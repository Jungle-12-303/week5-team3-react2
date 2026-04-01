# React Core Engine 구현 상세 분석 및 코드 리뷰 보고서

> 평가 대상 저장소: `Jungle-12-303/week5-team3-react2`  
> 참조 저장소(Virtual DOM 엔진): `choihyunjin1/SW-AI-W02-05-CHOI-HYUN-JIN-` (`DEVELOPE` Branch)

## 1. 개요 및 총평

본 보고서는 팀별 프로젝트 과제(수요 코딩회)에서 구현된 "독립 카운터 & 생명주기 타이머(MVP)"와 이를 지탱하는 Custom React Core 엔진을 대상으로 합니다. Week 4에서 구현했던 순수 Virtual DOM 엔진을 어떻게 재사용하여 동적인 React 컴포넌트로 확장시켰는지 그 연결고리와 완성도를 비판적으로 평가합니다.

결론적으로, 이번 프로젝트는 단순 기능을 흉내 낸 것을 넘어 React의 원리인 렌더링 주기, State-Closure 연계, Hooks 패턴을 깊게 이해하고 구현해 낸 수준의 결과물입니다.

## 2. 기존 Virtual DOM 엔진 재활용 및 아키텍처 분석

이전 주차 결과물(Reference)의 `core/vdom.js`를 단순히 복사해 온 것이 아니라, 모듈러 아키텍처 관점에서 확장시켰습니다.

### 긍정적 측면

1. **ES Module 시스템 적용**  
   이전에는 `Object.assign(window, ...)` 방식을 통해 글로벌 객체를 오염시키는 방식으로 VDOM 엔진이 동작했습니다. 이번 주차 `vdom.js` 에서는 DOM 코어 로직을 `export function` 중심으로 정리하여 불필요한 전역 공유를 줄이고 캡슐화를 강화했습니다.

2. **재귀 Diff 알고리즘의 보존**  
   기존 과제에서 작성되었던 트리 단위 비교(`diff`), 그리고 DOM 노드 조작(`applyPatches`, `createDOMFromVNode`)은 핵심 알고리즘이 훼손되지 않고 유지되었습니다.

3. **이벤트 리스너 처리의 세련된 확장**  
   단순한 DOM 구조를 그리는 가상 DOM에서 상호작용 가능한 상태 머신으로 나아가기 위해, `vdom.js` 안에 이벤트 감지 로직이 삽입되었습니다.

   ```javascript
   function setEventListener(element, name, handler) { ... }
   ```

   `on*` 속성을 감지하여 구 DOM 이벤트의 중복 바인딩을 방지하도록 `element.__vdomListeners` 속성에 핸들러를 캐싱하는 방식은 메모리 관리 측면에서 잘 설계되어 있습니다.

### 비판적 시각

- `renderHTMLIntoTarget`나 `safelyParseHTML` 같은 기능이 여전히 `vdom.js`에 남아 있지만, 현재 코드베이스에서는 함수형 컴포넌트 평가로만 트리를 구성하므로 코어 엔진 관점에서는 사용하지 않는 기능입니다. 추후에는 과감히 제거해 관심사를 더 분리하는 편이 좋습니다.

## 3. Component, State, Hooks 요구사항 구현 분석

> Lifting State Up 원칙 / 함수형 컴포넌트 베이스 / Stateless 자식 컴포넌트

### Hooks 원리의 정확한 구현 (`currentInstance`와 `hookIndex`)

가장 인상 깊은 부분은 Hooks 메커니즘의 근간인 "실행 순서 의존성(Call-order mapping)"을 `hookIndex`를 통해 재현한 점입니다.

- `function-component.js`의 `useState`, `useEffect`, `useMemo`는 `currentInstance.hooks[index]`에 의존하여 상태를 가져옵니다.
- `#render()` 주기마다 `this.hookIndex = 0`으로 초기화하여 컴포넌트 함수를 다시 평가하는 방식은 실제 React의 dispatcher 모델을 축소해 보여 주는 교육용 구현으로 적절합니다.

### 완전한 Lifting State Up 패턴

`app.js`에서 보여지는 컴포넌트 분할 방식은 React 공식 문서에서 권장하는 하향식 단방향 데이터 흐름을 잘 따릅니다.

- `App()` 컴포넌트는 단일 소스 오브 트루스(Single Source of Truth)로서 `scores`, `running`, `seconds`를 모두 소유합니다.
- 자식 컴포넌트인 `CounterCard`, `TimerCard`는 부모로부터 전달받은 props만 투영하는 순수 함수로 구현되어 있습니다.

## 4. 고급 최적화 로직 성능 분석

### Batching 메커니즘의 구현

```javascript
scheduleUpdate() {
  if (this.updateScheduled) return;

  this.updateScheduled = true;
  queueMicrotask(() => {
    this.updateScheduled = false;
    this.update();
  });
}
```

State 변경 시 일어나는 렌더링 병목 현상을 완화하기 위해 `queueMicrotask`를 도입했습니다.

- 동기적으로 연속 호출된 여러 `setState`가 한 번의 `update()`로 합쳐집니다.
- 이는 브라우저 이벤트 루프의 마이크로태스크 큐를 활용한 매우 직관적인 batching 구현입니다.

## 5. MVP 리뷰: 독립 카운터 & 생명주기 타이머

결과물은 단순 스크립트 수준을 넘어 안정적인 응용 계층 구현 능력을 보여줍니다.

1. **타이머와 `useEffect`의 정확한 활용**  
   `useEffect` 내부에서 `window.setInterval`을 시작하고, 반환값으로 `clearInterval` cleanup을 넣어 상태 변경 시 중복 타이머나 메모리 누수를 막았습니다.

2. **의존성 배열 기반 최적화**  
   `useMemo`로 합계/파생값을 계산해 불필요한 재연산을 줄였습니다.

3. **최종 결과물의 시연 적합성**  
   카운터 2개와 시계 1개라는 단순한 형태를 유지하면서도, 상태 변경, effect, memo, diff/patch를 모두 시각적으로 보여 줍니다.

> [!CAUTION]
> ## 비판적 설계 검토
>
> 현재 엔진의 가장 큰 한계점은 렌더링 비용(Diff 연산 범위)입니다.
>
> 모든 상태를 루트 컴포넌트에 집중시키는 현재 설계에서는 `seconds` 값이 1초마다 바뀔 때마다 `App` 전체가 다시 실행되고, 자식 카드들의 가상 트리도 매번 재생성됩니다.
>
> 실제 React는 `React.memo`, Fiber 단위 스케줄링, 서브트리 스킵 등으로 이 비용을 줄입니다. 현재 구현은 과제 요구사항에는 적합하지만, 현업 레벨로 확장하려면 자식 단위의 독립 실행 컨텍스트와 부분 렌더링 전략이 필요합니다.

## 6. 추가 비판적 분석

아래 항목은 위 평가에 더해, 현재 코드베이스를 실제 엔진 관점에서 보았을 때 분명히 짚고 넘어가면 좋은 지점들입니다.

### 6.1 `diff()`가 입력 VNode를 직접 변형한다

현재 `diff()`는 내부에서 `normalizeVNodePaths()`를 호출하며 기존 VNode 객체의 `path`, `depth`, `key`를 직접 갱신합니다.

- 장점: 구현이 단순하고 설명하기 쉽습니다.
- 단점: `diff()`가 순수 함수가 아니게 되어, 같은 VNode를 재사용하거나 디버깅할 때 예측 가능성이 떨어집니다.

교육용 엔진으로는 괜찮지만, 장기적으로는 경로 정규화를 별도 단계로 분리하거나 새 객체를 반환하도록 바꾸는 편이 더 안정적입니다.

### 6.2 Hooks 제약은 "관례상" 지켜지고 있다

과제 요구사항인 "Hook은 최상위 컴포넌트에서만 사용"은 현재 실제 사용 코드에서는 잘 지켜집니다. 다만 엔진 수준에서 강하게 강제되는 것은 아닙니다.

- 지금 구조에서는 `currentInstance`가 존재하는 동안 호출되는 훅이면 동작할 수 있습니다.
- 즉, 중첩 호출이나 잘못된 추상화가 들어와도 일부 경우에는 런타임에서 통과할 수 있습니다.

발표 때는 "현재 앱에서는 요구사항을 준수했다"와 "엔진 차원의 엄격한 정적 검사는 없다"를 구분해서 설명하면 좋습니다.

### 6.3 이벤트 시스템은 충분하지만, 아직 브라우저 기본 동작 전체를 포괄하지는 않는다

현재 VDOM은 `onClick`, `onInput` 같은 기본 이벤트에는 잘 대응합니다. 그러나 실제 React처럼 synthetic event 계층이나 이벤트 위임, 캡처 단계 통합 처리는 하지 않습니다.

이는 부족함이라기보다, 현재 엔진의 목표 범위가 "과제용 React 핵심 원리 증명"이라는 점을 분명하게 보여 줍니다.

### 6.4 리스트 재정렬 지원은 있으나, 현재 앱에서 강하게 검증되진 않는다

`PATCH_TYPES.REORDER_CHILDREN`과 key 기반 reorder 로직은 구현되어 있습니다. 다만 현재 MVP 화면은 고정된 카드 3개 구조라, 동적 리스트의 key 안정성이나 reorder 정확성은 실사용 시나리오로 충분히 검증되지는 않았습니다.

만약 후속 확장을 한다면 "카운터 카드 순서 바꾸기" 같은 데모를 추가하면 VDOM 엔진의 강점을 더 분명하게 보여 줄 수 있습니다.

### 6.5 테스트 품질은 좋지만, 시각 검증 문서는 추가 여지가 있다

현재 저장소에는 다음 검증이 이미 있습니다.

- VDOM diff/patch 단위 테스트
- Hooks/batching 단위 테스트
- 앱 클릭/타이머 흐름 통합 테스트

이 정도면 과제 품질 기준에서는 충분히 강합니다. 다만 포트폴리오 관점에서는 "렌더링 흐름 다이어그램", "상태 변화 순서도", "실제 React와 차이점" 같은 보조 문서를 추가하면 설명력이 더 올라갑니다.

## 7. 실제 React와의 차이점 요약

발표 시 아래 네 줄 정도는 반드시 짚고 가면 좋습니다.

1. 실제 React는 각 컴포넌트가 독립적인 내부 구조(Fiber)를 가지지만, 현재 구현은 루트 중심 구조입니다.
2. 실제 React는 훨씬 더 정교한 스케줄링과 우선순위 제어를 하지만, 현재 구현은 `queueMicrotask` 기반 단순 batching입니다.
3. 실제 React는 synthetic event, concurrent rendering, suspense 등 훨씬 넓은 기능 범위를 갖습니다.
4. 현재 구현은 과제 요구사항인 Component, State, Hooks, VDOM diff/patch 원리를 교육적으로 드러내는 데 초점이 맞춰져 있습니다.

## 8. 최종 결론

AI와 도구를 활용해 이 정도 수준의 구조적 재해석(State-Hooks-VDOM 연계)과 마이크로태스크 batching 최적화까지 구현했다는 점은 팀의 기술 학습 민첩성과 높은 코딩 이해도를 강하게 뒷받침합니다.

특히 이번 결과물은 다음 두 가지를 동시에 만족합니다.

- 과제 요구사항을 충족하는 구현물
- 구현 원리를 설명할 수 있는 교육용 엔진

향후 확장 포인트는 분명하지만, 현재 제출물 기준으로는 완성도 높은 결과물이라고 평가할 수 있습니다.
