import { buildKey } from "./helpers.js";

/**
 * Virtual DOM 속성 집합입니다.
 *
 * @typedef {Record<string, unknown>} VNodeAttrs
 */

/**
 * Virtual DOM 텍스트 노드입니다.
 *
 * @typedef {object} TextVNode
 * @property {"text"} type 노드 종류입니다.
 * @property {null} tag 텍스트 노드는 태그명이 없습니다.
 * @property {VNodeAttrs} attrs 텍스트 노드의 속성 객체입니다.
 * @property {[]} children 텍스트 노드는 자식이 없습니다.
 * @property {string} text 텍스트 내용입니다.
 * @property {string | null} key 비교를 위한 식별 키입니다.
 * @property {string} path 트리 내 경로입니다.
 * @property {number} depth 트리 내 깊이입니다.
 */

/**
 * Virtual DOM 엘리먼트 노드입니다.
 *
 * @typedef {object} ElementVNode
 * @property {"element"} type 노드 종류입니다.
 * @property {string} tag HTML 태그 이름입니다.
 * @property {VNodeAttrs} attrs 속성 집합입니다.
 * @property {VNode[]} children 자식 노드 배열입니다.
 * @property {string} text 엘리먼트 노드는 빈 문자열을 유지합니다.
 * @property {string | null} key 비교를 위한 식별 키입니다.
 * @property {string} path 트리 내 경로입니다.
 * @property {number} depth 트리 내 깊이입니다.
 */

/**
 * 이 프로젝트에서 사용하는 Virtual DOM 노드 타입입니다.
 *
 * @typedef {TextVNode | ElementVNode} VNode
 */

/**
 * `h` 함수에 전달될 수 있는 자식 값입니다.
 *
 * @typedef {VNode | string | number | boolean | null | undefined | VNodeChild[]} VNodeChild
 */

/**
 * 루트 컨테이너 역할을 하는 Virtual DOM 노드를 생성합니다.
 *
 * @returns {ElementVNode} 실제 루트 DOM을 감싸는 가상 루트 노드입니다.
 */
export function createRootContainer() {
  return {
    type: "element",
    tag: "div",
    attrs: { "data-virtual-root": "true" },
    children: [],
    text: "",
    key: "__root__",
    path: "0",
    depth: 0,
  };
}

/**
 * 자식 목록을 평탄화하고 렌더링 가능한 VNode 배열로 정규화합니다.
 *
 * @param {VNodeChild[]} children 정규화할 자식 목록입니다.
 * @param {VNode[]} [bucket=[]] 재귀적으로 결과를 누적할 배열입니다.
 * @returns {VNode[]} 렌더링 가능한 VNode 배열입니다.
 */
function flattenChildren(children, bucket = []) {
  for (const child of children) {
    if (Array.isArray(child)) {
      flattenChildren(child, bucket);
      continue;
    }

    if (child === null || child === undefined || child === false) {
      continue;
    }

    if (
      typeof child === "string" ||
      typeof child === "number" ||
      typeof child === "boolean"
    ) {
      bucket.push(createTextVNode(String(child)));
      continue;
    }

    bucket.push(child);
  }

  return bucket;
}

/**
 * 내부 렌더러가 기대하는 속성 이름으로 정규화합니다.
 *
 * @param {VNodeAttrs} [attrs={}] 변환할 속성 객체입니다.
 * @returns {VNodeAttrs} 필요한 키 이름이 변환된 새 속성 객체입니다.
 */
function normalizeAttrs(attrs = {}) {
  const normalized = { ...attrs };

  if ("className" in normalized) {
    normalized.class = normalized.className;
    delete normalized.className;
  }

  return normalized;
}

/**
 * 태그, 속성, 자식으로 엘리먼트 VNode를 생성합니다.
 *
 * @param {string} tag 생성할 HTML 태그 이름입니다.
 * @param {VNodeAttrs} [attrs={}] 엘리먼트 속성 객체입니다.
 * @param {...VNodeChild} children 자식 노드 목록입니다.
 * @returns {ElementVNode} 정규화된 자식과 속성을 담은 엘리먼트 VNode입니다.
 */
export function h(tag, attrs = {}, ...children) {
  return createElementVNode(tag, normalizeAttrs(attrs), flattenChildren(children));
}

/**
 * 엘리먼트 타입의 Virtual DOM 노드를 생성합니다.
 *
 * @param {string} tag 생성할 HTML 태그 이름입니다.
 * @param {VNodeAttrs} [attrs={}] 엘리먼트 속성 객체입니다.
 * @param {Array<VNode | string>} [children=[]] 자식 노드 목록입니다.
 * @returns {ElementVNode} 기본 메타데이터가 채워진 엘리먼트 VNode입니다.
 */
export function createElementVNode(tag, attrs = {}, children = []) {
  return {
    type: "element",
    tag,
    attrs,
    children: children.map((child) =>
      typeof child === "string" ? createTextVNode(child) : child,
    ),
    text: "",
    key: null,
    path: "",
    depth: 0,
  };
}

/**
 * 텍스트 타입의 Virtual DOM 노드를 생성합니다.
 *
 * @param {unknown} text 문자열로 변환할 텍스트 값입니다.
 * @returns {TextVNode} 문자열 값이 저장된 텍스트 VNode입니다.
 */
export function createTextVNode(text) {
  return {
    type: "text",
    tag: null,
    attrs: {},
    children: [],
    text: String(text ?? ""),
    key: null,
    path: "",
    depth: 0,
  };
}

/**
 * Virtual DOM 트리에 경로, 깊이, 키 정보를 다시 계산해 기록합니다.
 *
 * @param {VNode | null | undefined} vNode 정규화할 Virtual DOM 노드입니다.
 * @param {string} [path="0"] 현재 노드에 부여할 경로입니다.
 * @param {number} [depth=0] 현재 노드에 부여할 깊이입니다.
 * @returns {VNode | null} 메타데이터가 갱신된 동일 노드 또는 입력이 없으면 `null`입니다.
 */
export function normalizeVNodePaths(vNode, path = "0", depth = 0) {
  if (!vNode) {
    return null;
  }

  vNode.path = path;
  vNode.depth = depth;

  if (vNode.type === "element") {
    vNode.key = buildKey(vNode.attrs, `${vNode.tag}-${path}`);
  }

  (vNode.children || []).forEach((child, index) => {
    normalizeVNodePaths(child, `${path}-${index}`, depth + 1);
  });

  return vNode;
}
