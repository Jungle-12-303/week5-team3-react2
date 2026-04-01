import { sanitizeText } from "./helpers.js";

/**
 * 순회 결과로 반환되는 노드 요약 정보입니다.
 *
 * @typedef {object} TraversalEntry
 * @property {string} path 노드의 경로입니다.
 * @property {string} label 사람이 읽기 쉬운 설명 문자열입니다.
 * @property {number} depth 노드의 깊이입니다.
 */

/**
 * Virtual DOM 트리 전체 노드 수를 계산합니다.
 *
 * @param {import("./vnode.js").VNode | null | undefined} vNode 개수를 셀 루트 노드입니다.
 * @returns {number} 현재 노드를 포함한 전체 하위 노드 수입니다.
 */
export function countNodes(vNode) {
  if (!vNode) {
    return 0;
  }

  return (
    1 +
    (vNode.children || []).reduce((total, child) => total + countNodes(child), 0)
  );
}

/**
 * Virtual DOM 트리에서 가장 깊은 depth 값을 계산합니다.
 *
 * @param {import("./vnode.js").VNode | null | undefined} vNode 깊이를 계산할 루트 노드입니다.
 * @returns {number} 트리 내 최대 depth 값입니다.
 */
export function calculateMaxDepth(vNode) {
  if (!vNode) {
    return 0;
  }

  if (!vNode.children || !vNode.children.length) {
    return vNode.depth || 0;
  }

  return Math.max(...vNode.children.map((child) => calculateMaxDepth(child)));
}

/**
 * 노드를 짧은 설명 문자열로 변환합니다.
 *
 * @param {import("./vnode.js").VNode | null | undefined} vNode 설명할 Virtual DOM 노드입니다.
 * @returns {string} 텍스트 또는 태그 기반의 디버깅용 설명 문자열입니다.
 */
export function getNodeDescriptor(vNode) {
  if (!vNode) {
    return "null";
  }

  if (vNode.type === "text") {
    return `#text("${sanitizeText(vNode.text)}")`;
  }

  return `<${vNode.tag}>`;
}

/**
 * 디버깅용으로 읽기 쉬운 노드 요약 문자열을 생성합니다.
 *
 * @param {import("./vnode.js").VNode | null | undefined} vNode 요약할 Virtual DOM 노드입니다.
 * @returns {string} 속성 수와 자식 수 등을 담은 요약 문자열입니다.
 */
export function getReadableNodeSummary(vNode) {
  if (!vNode) {
    return "empty";
  }

  if (vNode.type === "text") {
    return `text:${sanitizeText(vNode.text) || "(blank)"}`;
  }

  return `${vNode.tag} | attrs:${Object.keys(vNode.attrs || {}).length} | children:${(vNode.children || []).length}`;
}

/**
 * 지정한 경로와 일치하는 Virtual DOM 노드를 트리에서 찾습니다.
 *
 * @param {import("./vnode.js").VNode | null | undefined} vNode 검색 시작 루트 노드입니다.
 * @param {string} path 찾고 싶은 노드 경로입니다.
 * @returns {import("./vnode.js").VNode | null} 일치하는 노드 또는 찾지 못했으면 `null`입니다.
 */
export function findVNodeByPath(vNode, path) {
  if (!vNode) {
    return null;
  }

  if (vNode.path === path) {
    return vNode;
  }

  for (const child of vNode.children || []) {
    const found = findVNodeByPath(child, path);
    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * Virtual DOM 트리를 깊이 우선 순서로 순회합니다.
 *
 * @param {import("./vnode.js").VNode | null | undefined} root 순회를 시작할 루트 노드입니다.
 * @returns {TraversalEntry[]} 방문 순서를 담은 깊이 우선 순회 결과입니다.
 */
export function traverseDFS(root) {
  const order = [];

  /**
   * 현재 노드와 모든 자식을 재귀적으로 방문합니다.
   *
   * @param {import("./vnode.js").VNode | null | undefined} node 방문할 노드입니다.
   * @returns {void} 방문 결과를 `order` 배열에 누적합니다.
   */
  function visit(node) {
    if (!node) {
      return;
    }

    order.push({
      path: node.path,
      label: getNodeDescriptor(node),
      depth: node.depth,
    });
    (node.children || []).forEach((child) => visit(child));
  }

  visit(root);
  return order;
}

/**
 * Virtual DOM 트리를 너비 우선 순서로 순회합니다.
 *
 * @param {import("./vnode.js").VNode | null | undefined} root 순회를 시작할 루트 노드입니다.
 * @returns {TraversalEntry[]} 방문 순서를 담은 너비 우선 순회 결과입니다.
 */
export function traverseBFS(root) {
  if (!root) {
    return [];
  }

  const order = [];
  const queue = [root];

  while (queue.length) {
    const current = queue.shift();
    order.push({
      path: current.path,
      label: getNodeDescriptor(current),
      depth: current.depth,
    });
    (current.children || []).forEach((child) => queue.push(child));
  }

  return order;
}
