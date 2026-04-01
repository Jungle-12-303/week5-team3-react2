import { NODE_TYPE, PATCH_TYPES } from "./constants.js";
import { buildKey, getPathDepth, pathToSegments } from "./helpers.js";
import {
  createDOMFromVNode,
  getComparableChildNodes,
  getDomKey,
  removeDomAttribute,
  setDomAttribute,
} from "./dom.js";

/**
 * 경로에 해당하는 실제 DOM 노드를 찾습니다.
 *
 * @param {Node} root 검색 시작점이 되는 루트 DOM 노드입니다.
 * @param {string} path 찾고 싶은 VNode 경로입니다.
 * @returns {Node | null} 경로에 해당하는 DOM 노드 또는 찾지 못했으면 `null`입니다.
 */
function getDomNodeByPath(root, path) {
  if (path === "0") {
    return root;
  }

  let current = root;
  const segments = pathToSegments(path);

  for (const segment of segments) {
    const comparableChildren = getComparableChildNodes(current);
    if (!current || !comparableChildren[segment]) {
      return null;
    }
    current = comparableChildren[segment];
  }

  return current;
}

function getVNodeByPath(root, path) {
  if (!root) {
    return null;
  }

  if (path === "0") {
    return root;
  }

  let current = root;
  const segments = pathToSegments(path);

  for (const segment of segments) {
    if (!current?.children?.[segment]) {
      return null;
    }
    current = current.children[segment];
  }

  return current;
}

function getVNodeLookupKey(node, fallbackKey) {
  if (!node || node.type === "text") {
    return fallbackKey;
  }

  return buildKey(node.attrs, fallbackKey);
}

/**
 * 생성 패치를 실제 DOM에 적용합니다.
 *
 * @param {Node} root 패치를 적용할 루트 DOM 노드입니다.
 * @param {import("./diff.js").CreatePatch} patch 적용할 생성 패치입니다.
 * @returns {void} 지정된 위치에 새 DOM 노드를 삽입합니다.
 */
function applyCreatePatch(root, patch) {
  const parent = getDomNodeByPath(root, patch.parentPath);
  if (!parent) {
    return;
  }

  const comparableChildren = getComparableChildNodes(parent);
  const referenceNode = comparableChildren[patch.index] || null;
  parent.insertBefore(createDOMFromVNode(patch.node), referenceNode);
}

/**
 * 제거 패치를 실제 DOM에 적용합니다.
 *
 * @param {Node} root 패치를 적용할 루트 DOM 노드입니다.
 * @param {import("./diff.js").RemovePatch} patch 적용할 제거 패치입니다.
 * @returns {void} 대상 DOM 노드를 부모에서 제거합니다.
 */
function applyRemovePatch(root, patch) {
  const target = getDomNodeByPath(root, patch.path);
  if (target && target.parentNode) {
    target.parentNode.removeChild(target);
  }
}

/**
 * 교체 패치를 실제 DOM에 적용합니다.
 *
 * @param {Node} root 패치를 적용할 루트 DOM 노드입니다.
 * @param {import("./diff.js").ReplacePatch} patch 적용할 교체 패치입니다.
 * @returns {Node | null} 루트 노드가 교체되면 새 루트, 아니면 `null`입니다.
 */
function applyReplacePatch(root, patch) {
  const target = getDomNodeByPath(root, patch.path);
  if (!target) {
    return null;
  }

  const replacement = createDOMFromVNode(patch.newNode);
  if (target === root) {
    target.replaceWith(replacement);
    return replacement;
  }

  if (target.parentNode) {
    target.parentNode.replaceChild(replacement, target);
  }

  return null;
}

/**
 * 텍스트 변경 패치를 실제 DOM에 적용합니다.
 *
 * @param {Node} root 패치를 적용할 루트 DOM 노드입니다.
 * @param {import("./diff.js").TextPatch} patch 적용할 텍스트 패치입니다.
 * @returns {void} 대상 노드의 텍스트를 새 값으로 바꿉니다.
 */
function applyTextPatch(root, patch) {
  const target = getDomNodeByPath(root, patch.path);
  if (target) {
    target.textContent = patch.newText;
  }
}

/**
 * 속성 설정 패치를 실제 DOM에 적용합니다.
 *
 * @param {Node} root 패치를 적용할 루트 DOM 노드입니다.
 * @param {import("./diff.js").AttrSetPatch} patch 적용할 속성 설정 패치입니다.
 * @returns {void} 대상 엘리먼트에 속성을 반영합니다.
 */
function applyAttrSetPatch(root, patch) {
  const target = getDomNodeByPath(root, patch.path);
  if (!target || target.nodeType !== NODE_TYPE.ELEMENT) {
    return;
  }

  setDomAttribute(target, patch.name, patch.value);
}

/**
 * 속성 제거 패치를 실제 DOM에 적용합니다.
 *
 * @param {Node} root 패치를 적용할 루트 DOM 노드입니다.
 * @param {import("./diff.js").AttrRemovePatch} patch 적용할 속성 제거 패치입니다.
 * @returns {void} 대상 엘리먼트에서 속성을 제거합니다.
 */
function applyAttrRemovePatch(root, patch) {
  const target = getDomNodeByPath(root, patch.path);
  if (target && target.nodeType === NODE_TYPE.ELEMENT) {
    removeDomAttribute(target, patch.name);
  }
}

/**
 * 자식 재정렬 패치를 실제 DOM에 적용합니다.
 *
 * @param {Node} root 패치를 적용할 루트 DOM 노드입니다.
 * @param {import("./diff.js").ReorderChildrenPatch} patch 적용할 재정렬 패치입니다.
 * @param {import("./vnode.js").VNode | null} newVNodeRoot 새 상태의 Virtual DOM 루트입니다.
 * @returns {void} 부모의 자식 순서를 새 Virtual DOM 기준으로 맞춥니다.
 */
function applyReorderPatch(root, patch, newVNodeRoot) {
  const parent = getDomNodeByPath(root, patch.path);
  const parentVNode = getVNodeByPath(newVNodeRoot, patch.path);
  if (!parent || !parentVNode) {
    return;
  }

  const existingChildren = getComparableChildNodes(parent);
  const existingByKey = new Map();
  existingChildren.forEach((child, index) => {
    existingByKey.set(getDomKey(child, index), child);
  });

  const fragment = document.createDocumentFragment();
  (parentVNode.children || []).forEach((childVNode, index) => {
    const lookupKey = getVNodeLookupKey(childVNode, `__index_${index}`);
    const existingNode = existingByKey.get(lookupKey);
    fragment.appendChild(existingNode || createDOMFromVNode(childVNode));
  });

  parent.replaceChildren(fragment);
}

/**
 * diff 결과 패치 배열을 실제 DOM에 순서대로 적용합니다.
 *
 * @param {Node} root 패치를 적용할 루트 DOM 노드입니다.
 * @param {import("./diff.js").Patch[]} patches 적용할 패치 배열입니다.
 * @param {import("./vnode.js").VNode | null} [newVNodeRoot=null] 재정렬 시 참조할 새 Virtual DOM 루트입니다.
 * @returns {Node} 패치 적용 후 현재 루트 DOM 노드입니다.
 */
export function applyPatches(root, patches, newVNodeRoot = null) {
  let nextRoot = root;
  const removePatches = patches
    .filter((patch) => patch.type === PATCH_TYPES.REMOVE)
    .sort((a, b) => getPathDepth(b.path) - getPathDepth(a.path));
  const createPatches = patches
    .filter((patch) => patch.type === PATCH_TYPES.CREATE)
    .sort((a, b) => getPathDepth(a.path) - getPathDepth(b.path));
  const updatePatches = patches.filter(
    (patch) =>
      ![
        PATCH_TYPES.CREATE,
        PATCH_TYPES.REMOVE,
        PATCH_TYPES.REORDER_CHILDREN,
      ].includes(patch.type),
  );
  const reorderPatches = patches.filter(
    (patch) => patch.type === PATCH_TYPES.REORDER_CHILDREN,
  );

  removePatches.forEach((patch) => applyRemovePatch(nextRoot, patch));
  updatePatches.forEach((patch) => {
    switch (patch.type) {
      case PATCH_TYPES.REPLACE: {
        const replacedRoot = applyReplacePatch(nextRoot, patch);
        if (replacedRoot) {
          nextRoot = replacedRoot;
        }
        break;
      }
      case PATCH_TYPES.TEXT:
        applyTextPatch(nextRoot, patch);
        break;
      case PATCH_TYPES.ATTR_SET:
        applyAttrSetPatch(nextRoot, patch);
        break;
      case PATCH_TYPES.ATTR_REMOVE:
        applyAttrRemovePatch(nextRoot, patch);
        break;
      default:
        break;
    }
  });
  createPatches.forEach((patch) => applyCreatePatch(nextRoot, patch));
  reorderPatches.forEach((patch) =>
    applyReorderPatch(nextRoot, patch, newVNodeRoot),
  );

  return nextRoot;
}
