import { NODE_TYPE } from "./constants.js";
import { buildKey } from "./helpers.js";
import {
  createRootContainer,
} from "./vnode.js";

/**
 * HTML 문자열 파싱 결과입니다.
 *
 * @typedef {object} ParsedHtmlResult
 * @property {DocumentFragment} fragment 파싱된 DOM 조각입니다.
 * @property {Error | null} error 파싱 중 발생한 오류입니다.
 */

/**
 * Virtual DOM이 DOM 엘리먼트에 저장하는 이벤트 리스너 맵입니다.
 *
 * @typedef {Record<string, EventListener>} DomListenerMap
 */

/**
 * 리스너 저장소를 포함할 수 있는 DOM 엘리먼트 타입입니다.
 *
 * @typedef {Element & {__vdomListeners?: DomListenerMap}} VDomElement
 */

/**
 * DOM 노드의 HTML을 공백이 정리된 문자열로 직렬화합니다.
 *
 * @param {Element | null | undefined} node HTML을 읽어올 DOM 노드입니다.
 * @returns {string} 노드가 있으면 정리된 `innerHTML`, 없으면 빈 문자열입니다.
 */
export function serializeHTML(node) {
  return node ? node.innerHTML.trim() : "";
}

/**
 * HTML 문자열을 안전하게 `DocumentFragment`로 파싱합니다.
 *
 * @param {string} html 파싱할 HTML 문자열입니다.
 * @returns {ParsedHtmlResult} 파싱된 fragment와 오류 정보를 함께 담은 결과입니다.
 */
export function safelyParseHTML(html) {
  const template = document.createElement("template");

  try {
    template.innerHTML = html && html.trim() ? html.trim() : "";
  } catch (error) {
    return { fragment: template.content, error };
  }

  return { fragment: template.content, error: null };
}

/**
 * HTML 문자열을 대상 DOM 엘리먼트 내부에 렌더링합니다.
 *
 * @param {Element} target HTML을 삽입할 대상 엘리먼트입니다.
 * @param {string} html 렌더링할 HTML 문자열입니다.
 * @returns {Error | null} 파싱 중 오류가 있었으면 그 오류, 없으면 `null`입니다.
 */
export function renderHTMLIntoTarget(target, html) {
  const { fragment, error } = safelyParseHTML(html);
  target.innerHTML = "";

  if (fragment.childNodes.length) {
    target.appendChild(fragment.cloneNode(true));
  }

  return error;
}

/**
 * diff/patch 비교 대상에 포함할 수 있는 DOM 노드인지 판별합니다.
 *
 * @param {Node | null | undefined} node 검사할 DOM 노드입니다.
 * @returns {boolean} 주석과 빈 텍스트를 제외한 노드면 `true`입니다.
 */
export function isComparableDomNode(node) {
  if (!node) {
    return false;
  }

  if (node.nodeType === NODE_TYPE.COMMENT) {
    return false;
  }

  if (node.nodeType === NODE_TYPE.TEXT) {
    return Boolean((node.textContent || "").trim());
  }

  return node.nodeType === NODE_TYPE.ELEMENT;
}

/**
 * 비교 가능한 자식 DOM 노드만 추려 배열로 반환합니다.
 *
 * @param {Node} node 자식 노드를 읽을 부모 DOM 노드입니다.
 * @returns {Node[]} 주석과 빈 텍스트를 제외한 자식 노드 배열입니다.
 */
export function getComparableChildNodes(node) {
  return Array.from(node.childNodes || []).filter((child) =>
    isComparableDomNode(child),
  );
}

/**
 * 실제 DOM 노드에서 비교용 키를 추출합니다.
 *
 * @param {Node | null | undefined} node 키를 읽을 DOM 노드입니다.
 * @param {number} index 키가 없을 때 사용할 자식 인덱스입니다.
 * @returns {string} 속성 기반 키 또는 인덱스 기반 기본 키입니다.
 */
export function getDomKey(node, index) {
  if (!node || node.nodeType !== NODE_TYPE.ELEMENT) {
    return `__index_${index}`;
  }

  return (
    node.getAttribute("data-key") ||
    node.getAttribute("key") ||
    node.id ||
    `__index_${index}`
  );
}

/**
 * 속성 이름이 이벤트 핸들러인지 판별합니다.
 *
 * @param {string} name 검사할 속성 이름입니다.
 * @returns {boolean} `on` 접두사가 있으면 `true`입니다.
 */
function isEventAttribute(name) {
  return name.startsWith("on");
}

/**
 * DOM 엘리먼트의 이벤트 리스너를 등록, 교체, 제거합니다.
 *
 * @param {VDomElement} element 이벤트를 반영할 DOM 엘리먼트입니다.
 * @param {string} name `onClick` 같은 이벤트 속성 이름입니다.
 * @param {unknown} handler 등록할 핸들러 함수입니다.
 * @returns {void} 내부 리스너 저장소를 포함해 이벤트 상태를 갱신합니다.
 */
function setEventListener(element, name, handler) {
  const eventName = name.slice(2).toLowerCase();
  const listeners = element.__vdomListeners || {};
  const previous = listeners[eventName];

  if (previous) {
    element.removeEventListener(eventName, previous);
  }

  if (typeof handler === "function") {
    element.addEventListener(eventName, handler);
    listeners[eventName] = handler;
  } else {
    delete listeners[eventName];
  }

  element.__vdomListeners = listeners;
}

/**
 * VNode 속성 하나를 실제 DOM 엘리먼트에 반영합니다.
 *
 * @param {VDomElement} element 속성을 적용할 DOM 엘리먼트입니다.
 * @param {string} name 속성 이름입니다.
 * @param {unknown} value 적용할 속성 값입니다.
 * @returns {void} 전달된 속성을 DOM 상태에 맞게 설정합니다.
 */
export function setDomAttribute(element, name, value) {
  if (name === "key" || name === "children") {
    return;
  }

  if (isEventAttribute(name)) {
    setEventListener(element, name, value);
    return;
  }

  if (name === "value") {
    element.value = value ?? "";
  }

  if (name === "checked") {
    element.checked = Boolean(value);
  }

  if (value === true) {
    element.setAttribute(name, "");
    return;
  }

  if (value === false || value === null || value === undefined) {
    element.removeAttribute(name);
    return;
  }

  element.setAttribute(name, String(value));
}

/**
 * 실제 DOM 엘리먼트에서 속성 하나를 제거합니다.
 *
 * @param {VDomElement} element 속성을 제거할 DOM 엘리먼트입니다.
 * @param {string} name 제거할 속성 이름입니다.
 * @returns {void} 전달된 속성을 DOM에서 제거합니다.
 */
export function removeDomAttribute(element, name) {
  if (name === "key" || name === "children") {
    return;
  }

  if (isEventAttribute(name)) {
    setEventListener(element, name, null);
    return;
  }

  if (name === "value") {
    element.value = "";
  }

  if (name === "checked") {
    element.checked = false;
  }

  element.removeAttribute(name);
}

/**
 * Virtual DOM 노드 하나를 실제 DOM 노드로 생성합니다.
 *
 * @param {import("./vnode.js").VNode | null | undefined} vNode 생성할 Virtual DOM 노드입니다.
 * @returns {Node} 전달된 Virtual DOM을 표현하는 실제 DOM 노드입니다.
 */
export function createDOMFromVNode(vNode) {
  if (!vNode) {
    return document.createTextNode("");
  }

  if (vNode.type === "text") {
    return document.createTextNode(vNode.text || "");
  }

  const element = document.createElement(vNode.tag);
  Object.entries(vNode.attrs || {}).forEach(([name, value]) => {
    setDomAttribute(element, name, value);
  });
  (vNode.children || []).forEach((child) =>
    element.appendChild(createDOMFromVNode(child)),
  );
  return element;
}

/**
 * 루트 DOM 컨테이너를 전달된 Virtual DOM 상태로 다시 렌더링합니다.
 *
 * @param {Element} root 렌더링 대상 루트 DOM 엘리먼트입니다.
 * @param {import("./vnode.js").ElementVNode} vNode 루트 래퍼 역할을 하는 Virtual DOM 노드입니다.
 * @returns {void} 루트 내용을 비우고 새 자식 DOM 노드를 삽입합니다.
 */
export function renderVNodeToRoot(root, vNode) {
  root.innerHTML = "";
  (vNode.children || []).forEach((child) =>
    root.appendChild(createDOMFromVNode(child)),
  );
}

/**
 * 실제 DOM 노드 하나를 Virtual DOM 노드로 변환합니다.
 *
 * @param {Node | null | undefined} node 변환할 실제 DOM 노드입니다.
 * @param {string} path 변환된 노드에 기록할 경로입니다.
 * @param {number} depth 변환된 노드에 기록할 깊이입니다.
 * @returns {import("./vnode.js").VNode | null} 변환된 Virtual DOM 노드 또는 제외 대상이면 `null`입니다.
 */
export function domNodeToVNode(node, path, depth) {
  if (!node) {
    return null;
  }

  if (node.nodeType === NODE_TYPE.COMMENT) {
    return null;
  }

  if (node.nodeType === NODE_TYPE.TEXT) {
    const rawText = node.textContent || "";
    if (!rawText.trim()) {
      return null;
    }

    return {
      type: "text",
      tag: null,
      attrs: {},
      children: [],
      text: rawText,
      key: null,
      path,
      depth,
    };
  }

  if (node.nodeType !== NODE_TYPE.ELEMENT) {
    return null;
  }

  const attrs = {};
  Array.from(node.attributes || []).forEach((attribute) => {
    attrs[attribute.name] = attribute.value === "" ? true : attribute.value;
  });

  const children = [];
  let childIndex = 0;
  Array.from(node.childNodes || []).forEach((child) => {
    const childVNode = domNodeToVNode(child, `${path}-${childIndex}`, depth + 1);
    if (childVNode) {
      children.push(childVNode);
      childIndex += 1;
    }
  });

  return {
    type: "element",
    tag: node.tagName.toLowerCase(),
    attrs,
    children,
    text: "",
    key: buildKey(attrs, `${node.tagName.toLowerCase()}-${path}`),
    path,
    depth,
  };
}

/**
 * 컨테이너 DOM의 자식들을 읽어 가상 루트 VNode로 감쌉니다.
 *
 * @param {Element} container 읽어올 실제 DOM 컨테이너입니다.
 * @returns {import("./vnode.js").ElementVNode} 컨테이너 자식들을 담은 가상 루트 노드입니다.
 */
export function domToVNode(container) {
  const root = createRootContainer();
  let childIndex = 0;

  Array.from(container.childNodes || []).forEach((child) => {
    const childVNode = domNodeToVNode(child, `0-${childIndex}`, 1);
    if (childVNode) {
      root.children.push(childVNode);
      childIndex += 1;
    }
  });

  return root;
}
