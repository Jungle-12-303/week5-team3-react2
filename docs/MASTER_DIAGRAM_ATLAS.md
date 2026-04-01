# 마스터 다이어그램 아틀라스

이 문서는 면접관이나 리뷰어가 저장소의 다이어그램만 보고도  
`무엇을 먼저 봐야 하는지`, `어떤 질문에 어떤 문서를 보면 되는지`를 바로 알 수 있게 만든 안내 문서입니다.

## 1. 전체 지도

```mermaid
flowchart TD
    A["이 저장소를 처음 본다"] --> B["과제 요구사항과 구현 범위 확인"]
    B --> C["REQUIREMENTS_IMPLEMENTATION_MAP"]

    C --> D["컴포넌트 구조 확인"]
    D --> E["COMPONENT_IMPLEMENTATION_FLOW"]

    E --> F["Hooks와 VDOM 연결 이해"]
    F --> G["HOOKS_VDOM_FLOW"]

    G --> H["시스템 실행 전체 흐름 확인"]
    H --> I["FLOWCHARTS"]

    I --> J["자료구조 / 알고리즘 분석"]
    J --> K["DS_ALGO_DIAGRAMS"]

    K --> L["타입 / 객체 관계 확인"]
    L --> M["CLASS_DIAGRAM"]

    M --> N["테스트가 무엇을 검증하는지 확인"]
    N --> O["TEST_COVERAGE_MAP"]

    O --> P["실제 React와 차이 확인"]
    P --> Q["REACT_COMPARISON"]
```

## 2. 질문별 문서 매핑

```mermaid
flowchart TD
    A["궁금한 질문"] --> B["과제 조건을 만족했나?"]
    A --> C["Week 4 VDOM을 어떻게 활용했나?"]
    A --> D["컴포넌트는 어떻게 나눴나?"]
    A --> E["Hook은 어떻게 구현했나?"]
    A --> F["상태가 바뀌면 화면은 어떻게 바뀌나?"]
    A --> G["자료구조 / 알고리즘은 뭔가?"]
    A --> H["클래스 / 타입 관계는 어떤가?"]
    A --> I["테스트는 어디까지 검증하나?"]
    A --> J["실제 React와 뭐가 다른가?"]

    B --> B1["REQUIREMENTS_IMPLEMENTATION_MAP"]
    C --> C1["REQUIREMENTS_IMPLEMENTATION_MAP"]
    D --> D1["COMPONENT_IMPLEMENTATION_FLOW"]
    E --> E1["HOOKS_VDOM_FLOW"]
    F --> F1["FLOWCHARTS"]
    G --> G1["DS_ALGO_DIAGRAMS"]
    H --> H1["CLASS_DIAGRAM"]
    I --> I1["TEST_COVERAGE_MAP"]
    J --> J1["REACT_COMPARISON"]
```

## 3. 문서별 역할

| 문서 | 역할 | 면접 질문 예시 |
| --- | --- | --- |
| `REQUIREMENTS_IMPLEMENTATION_MAP` | 과제 요구사항 대응, Week 4 VDOM 활용 방식 설명 | "이 과제 요구사항을 어떻게 충족했나요?" |
| `COMPONENT_IMPLEMENTATION_FLOW` | FunctionComponent, RootApp, StopwatchCard 구조 설명 | "왜 이런 컴포넌트 구조로 나눴나요?" |
| `HOOKS_VDOM_FLOW` | useState/useEffect/useMemo와 VDOM 연결 설명 | "Hook이 정확히 뭐고 VDOM과 어떤 관계인가요?" |
| `FLOWCHARTS` | 시스템 전체 실행 흐름과 파일 구성 | "사용자 입력부터 DOM 반영까지 설명해보세요." |
| `DS_ALGO_DIAGRAMS` | 자료구조, 알고리즘, 복잡도 설명 | "이 구현의 자료구조와 알고리즘은 무엇인가요?" |
| `CLASS_DIAGRAM` | 런타임 객체, VNode, Patch, Hook 구조 설명 | "내부 객체 구조를 한눈에 설명해보세요." |
| `TEST_COVERAGE_MAP` | 테스트 구조와 검증 범위 설명 | "테스트는 무엇을 검증하나요?" |
| `REACT_COMPARISON` | 실제 React와의 차이 설명 | "실제 React와 가장 큰 차이는 무엇인가요?" |

## 4. 추천 보는 순서

```mermaid
flowchart LR
    A["1. REQUIREMENTS_IMPLEMENTATION_MAP"] --> B["2. COMPONENT_IMPLEMENTATION_FLOW"]
    B --> C["3. HOOKS_VDOM_FLOW"]
    C --> D["4. FLOWCHARTS"]
    D --> E["5. DS_ALGO_DIAGRAMS"]
    E --> F["6. CLASS_DIAGRAM"]
    F --> G["7. TEST_COVERAGE_MAP"]
    G --> H["8. REACT_COMPARISON"]
```

## 5. 면접관 관점 핵심 포인트

```mermaid
flowchart TD
    A["면접관이 보고 싶어하는 것"] --> B["원리 이해"]
    A --> C["설계 이유"]
    A --> D["기술적 한계 인식"]
    A --> E["이전 결과물 활용 방식"]
    A --> F["검증 신뢰도"]
    A --> G["실제 React와의 거리"]

    B --> B1["HOOKS_VDOM_FLOW / DS_ALGO_DIAGRAMS"]
    C --> C1["COMPONENT_IMPLEMENTATION_FLOW / FLOWCHARTS"]
    D --> D1["REQUIREMENTS_IMPLEMENTATION_MAP / DS_ALGO_DIAGRAMS"]
    E --> E1["REQUIREMENTS_IMPLEMENTATION_MAP"]
    F --> F1["TEST_COVERAGE_MAP"]
    G --> G1["REACT_COMPARISON"]
```

## 6. 한 줄 요약

> 이 저장소의 다이어그램은 `요구사항 -> 컴포넌트 구조 -> Hooks/VDOM 연결 -> 시스템 흐름 -> 자료구조/알고리즘 -> 클래스/타입 관계 -> 테스트 범위 -> 실제 React와의 차이` 순서로 읽으면 전체 구현을 거의 빠짐없이 이해할 수 있게 설계되어 있습니다.
