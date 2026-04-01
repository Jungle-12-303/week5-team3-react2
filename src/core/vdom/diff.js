import { PATCH_TYPES } from "./constants.js";
import { normalizeVNodePaths } from "./vnode.js";

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

function createChildKeyMap(children) {
  const map = new Map();
  children.forEach((child, index) => {
    map.set(child.key || `__index_${index}`, index);
  });
  return map;
}

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

export function diff(oldNode, newNode, path = "0", patches = []) {
  normalizeVNodePaths(oldNode, path, 0);
  normalizeVNodePaths(newNode, path, 0);
  return diffInternal(oldNode, newNode, path, patches);
}
