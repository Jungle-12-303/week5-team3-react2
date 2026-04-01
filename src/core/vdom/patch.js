import { NODE_TYPE, PATCH_TYPES } from "./constants.js";
import { getPathDepth, pathToSegments } from "./helpers.js";
import {
  createDOMFromVNode,
  getComparableChildNodes,
  getDomKey,
  removeDomAttribute,
  setDomAttribute,
} from "./dom.js";
import { findVNodeByPath } from "./tree.js";

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

function applyCreatePatch(root, patch) {
  const parent = getDomNodeByPath(root, patch.parentPath);
  if (!parent) {
    return;
  }

  const comparableChildren = getComparableChildNodes(parent);
  const referenceNode = comparableChildren[patch.index] || null;
  parent.insertBefore(createDOMFromVNode(patch.node), referenceNode);
}

function applyRemovePatch(root, patch) {
  const target = getDomNodeByPath(root, patch.path);
  if (target && target.parentNode) {
    target.parentNode.removeChild(target);
  }
}

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

function applyTextPatch(root, patch) {
  const target = getDomNodeByPath(root, patch.path);
  if (target) {
    target.textContent = patch.newText;
  }
}

function applyAttrSetPatch(root, patch) {
  const target = getDomNodeByPath(root, patch.path);
  if (!target || target.nodeType !== NODE_TYPE.ELEMENT) {
    return;
  }

  setDomAttribute(target, patch.name, patch.value);
}

function applyAttrRemovePatch(root, patch) {
  const target = getDomNodeByPath(root, patch.path);
  if (target && target.nodeType === NODE_TYPE.ELEMENT) {
    removeDomAttribute(target, patch.name);
  }
}

function applyReorderPatch(root, patch, newVNodeRoot) {
  const parent = getDomNodeByPath(root, patch.path);
  const parentVNode = findVNodeByPath(newVNodeRoot, patch.path);
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
    const lookupKey = childVNode.key || `__index_${index}`;
    const existingNode = existingByKey.get(lookupKey);
    fragment.appendChild(existingNode || createDOMFromVNode(childVNode));
  });

  parent.replaceChildren(fragment);
}

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
