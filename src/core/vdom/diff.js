import { PATCH_TYPES } from "./constants.js";
import { normalizeVNodePaths } from "./vnode.js";

/**
 * 속성 설정 패치입니다.
 *
 * @typedef {object} AttrSetPatch
 * @property {"ATTR_SET"} type 패치 종류입니다.
 * @property {string} path 대상 노드 경로입니다.
 * @property {string} name 설정할 속성 이름입니다.
 * @property {unknown} value 설정할 속성 값입니다.
 */

/**
 * 속성 제거 패치입니다.
 *
 * @typedef {object} AttrRemovePatch
 * @property {"ATTR_REMOVE"} type 패치 종류입니다.
 * @property {string} path 대상 노드 경로입니다.
 * @property {string} name 제거할 속성 이름입니다.
 */

/**
 * 노드 생성 패치입니다.
 *
 * @typedef {object} CreatePatch
 * @property {"CREATE"} type 패치 종류입니다.
 * @property {string} path 생성될 노드 경로입니다.
 * @property {string} parentPath 부모 노드 경로입니다.
 * @property {number} index 부모 기준 삽입 인덱스입니다.
 * @property {import("./vnode.js").VNode} node 생성할 Virtual DOM 노드입니다.
 */

/**
 * 노드 제거 패치입니다.
 *
 * @typedef {object} RemovePatch
 * @property {"REMOVE"} type 패치 종류입니다.
 * @property {string} path 제거할 노드 경로입니다.
 * @property {string} parentPath 부모 노드 경로입니다.
 * @property {number} index 부모 기준 기존 인덱스입니다.
 * @property {import("./vnode.js").VNode} node 제거 대상 Virtual DOM 노드입니다.
 */

/**
 * 노드 교체 패치입니다.
 *
 * @typedef {object} ReplacePatch
 * @property {"REPLACE"} type 패치 종류입니다.
 * @property {string} path 교체할 노드 경로입니다.
 * @property {import("./vnode.js").VNode} oldNode 기존 노드입니다.
 * @property {import("./vnode.js").VNode} newNode 새 노드입니다.
 */

/**
 * 텍스트 변경 패치입니다.
 *
 * @typedef {object} TextPatch
 * @property {"TEXT"} type 패치 종류입니다.
 * @property {string} path 대상 노드 경로입니다.
 * @property {string} oldText 이전 텍스트입니다.
 * @property {string} newText 새 텍스트입니다.
 */

/**
 * 자식 재정렬 패치입니다.
 *
 * @typedef {object} ReorderChildrenPatch
 * @property {"REORDER_CHILDREN"} type 패치 종류입니다.
 * @property {string} path 재정렬할 부모 노드 경로입니다.
 * @property {string} parentPath 부모 노드 경로입니다.
 * @property {string[]} order 새 자식 키 순서입니다.
 */

/**
 * diff 과정에서 생성되는 패치 전체 타입입니다.
 *
 * @typedef {CreatePatch | RemovePatch | ReplacePatch | TextPatch | AttrSetPatch | AttrRemovePatch | ReorderChildrenPatch} Patch
 */

/**
 * 두 속성 객체를 비교해 속성 변경 패치를 누적합니다.
 *
 * @param {Record<string, unknown>} [oldAttrs={}] 이전 속성 객체입니다.
 * @param {Record<string, unknown>} [newAttrs={}] 새 속성 객체입니다.
 * @param {string} path 비교 중인 노드 경로입니다.
 * @param {Patch[]} patches 결과를 누적할 패치 배열입니다.
 * @returns {void} 필요한 속성 패치를 `patches`에 추가합니다.
 */
function diffAttrs(oldAttrs = {}, newAttrs = {}, path, patches) {
  Object.keys(newAttrs).forEach((name) => {
    if (!Object.is(oldAttrs[name], newAttrs[name])) {
      patches.push({
        type: PATCH_TYPES.ATTR_SET,
        path,
        name,
        value: newAttrs[name],
      });
    }
  });

  Object.keys(oldAttrs).forEach((name) => {
    if (!(name in newAttrs)) {
      patches.push({ type: PATCH_TYPES.ATTR_REMOVE, path, name });
    }
  });
}

/**
 * 자식 배열을 키 기준 인덱스 맵으로 변환합니다.
 *
 * @param {import("./vnode.js").VNode[]} children 키를 추출할 자식 노드 목록입니다.
 * @returns {Map<string, number>} 자식 키와 인덱스를 연결한 맵입니다.
 */
function createChildKeyMap(children) {
  const map = new Map();
  children.forEach((child, index) => {
    map.set(child.key || `__index_${index}`, index);
  });
  return map;
}

/**
 * 두 자식 배열을 비교해 생성, 제거, 재정렬 패치를 계산합니다.
 *
 * @param {import("./vnode.js").VNode[]} oldChildren 이전 자식 배열입니다.
 * @param {import("./vnode.js").VNode[]} newChildren 새 자식 배열입니다.
 * @param {string} parentPath 부모 노드 경로입니다.
 * @param {Patch[]} patches 결과를 누적할 패치 배열입니다.
 * @returns {void} 자식 배열 차이를 `patches`에 추가합니다.
 */
function diffChildren(oldChildren, newChildren, parentPath, patches) {
  const oldKeyMap = createChildKeyMap(oldChildren);
  const newKeyMap = createChildKeyMap(newChildren);
  const nextOrder = [];

  newChildren.forEach((newChild, index) => {
    const lookupKey = newChild.key || `__index_${index}`;
    nextOrder.push(lookupKey);

    if (!oldKeyMap.has(lookupKey)) {
      patches.push({
        type: PATCH_TYPES.CREATE,
        path: `${parentPath}-${index}`,
        parentPath,
        index,
        node: newChild,
      });
      return;
    }

    const oldIndex = oldKeyMap.get(lookupKey);
    diffInternal(oldChildren[oldIndex], newChild, `${parentPath}-${index}`, patches);
  });

  oldChildren.forEach((oldChild, index) => {
    const lookupKey = oldChild.key || `__index_${index}`;
    if (!newKeyMap.has(lookupKey)) {
      patches.push({
        type: PATCH_TYPES.REMOVE,
        path: oldChild.path || `${parentPath}-${index}`,
        parentPath,
        index,
        node: oldChild,
      });
    }
  });

  const previousOrder = oldChildren.map(
    (child, index) => child.key || `__index_${index}`,
  );

  if (
    previousOrder.length === nextOrder.length &&
    previousOrder.join("|") !== nextOrder.join("|")
  ) {
    patches.push({
      type: PATCH_TYPES.REORDER_CHILDREN,
      path: parentPath,
      parentPath,
      order: nextOrder,
    });
  }
}

/**
 * 두 Virtual DOM 노드를 재귀적으로 비교해 패치를 계산합니다.
 *
 * @param {import("./vnode.js").VNode | null | undefined} oldNode 이전 노드입니다.
 * @param {import("./vnode.js").VNode | null | undefined} newNode 새 노드입니다.
 * @param {string} [path="0"] 현재 비교 중인 경로입니다.
 * @param {Patch[]} [patches=[]] 결과를 누적할 패치 배열입니다.
 * @returns {Patch[]} 누적된 패치 배열입니다.
 */
function diffInternal(oldNode, newNode, path = "0", patches = []) {
  if (!oldNode && newNode) {
    patches.push({
      type: PATCH_TYPES.CREATE,
      path,
      parentPath: path.split("-").slice(0, -1).join("-") || "0",
      index: Number(path.split("-").pop() || 0),
      node: newNode,
    });
    return patches;
  }

  if (oldNode && !newNode) {
    patches.push({
      type: PATCH_TYPES.REMOVE,
      path,
      parentPath: path.split("-").slice(0, -1).join("-") || "0",
      index: Number(path.split("-").pop() || 0),
      node: oldNode,
    });
    return patches;
  }

  if (!oldNode || !newNode) {
    return patches;
  }

  if (oldNode.type !== newNode.type || oldNode.tag !== newNode.tag) {
    patches.push({ type: PATCH_TYPES.REPLACE, path, oldNode, newNode });
    return patches;
  }

  if (oldNode.type === "text" && newNode.type === "text") {
    if (oldNode.text !== newNode.text) {
      patches.push({
        type: PATCH_TYPES.TEXT,
        path,
        oldText: oldNode.text,
        newText: newNode.text,
      });
    }
    return patches;
  }

  diffAttrs(oldNode.attrs, newNode.attrs, path, patches);
  diffChildren(oldNode.children || [], newNode.children || [], path, patches);
  return patches;
}

/**
 * 두 Virtual DOM 트리를 비교해 실제 DOM 업데이트용 패치 목록을 만듭니다.
 *
 * @param {import("./vnode.js").VNode | null | undefined} oldNode 이전 Virtual DOM 루트입니다.
 * @param {import("./vnode.js").VNode | null | undefined} newNode 새 Virtual DOM 루트입니다.
 * @param {string} [path="0"] 비교 시작 경로입니다.
 * @param {Patch[]} [patches=[]] 기존 패치 배열이 있으면 여기에 결과를 누적합니다.
 * @returns {Patch[]} 두 트리의 차이를 담은 패치 배열입니다.
 */
export function diff(oldNode, newNode, path = "0", patches = []) {
  normalizeVNodePaths(oldNode, path, 0);
  normalizeVNodePaths(newNode, path, 0);
  return diffInternal(oldNode, newNode, path, patches);
}
