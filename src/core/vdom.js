/*
  Unified Virtual DOM Engine Core
  Base structure imported from the previous Week 2 VDOM project and adapted
  for the Week 5 custom React runtime.
*/

/* 1. Constants */
export const NODE_TYPE = {
  ELEMENT: 1,
  TEXT: 3,
  COMMENT: 8,
};

export const PATCH_TYPES = {
  CREATE: "CREATE",
  REMOVE: "REMOVE",
  REPLACE: "REPLACE",
  TEXT: "TEXT",
  ATTR_SET: "ATTR_SET",
  ATTR_REMOVE: "ATTR_REMOVE",
  REORDER_CHILDREN: "REORDER_CHILDREN",
};

function sanitizeText(text) {
  return typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";
}

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

function buildKey(attrs, fallbackKey) {
  if (!attrs) {
    return fallbackKey;
  }
  return attrs["data-key"] || attrs.key || attrs.id || fallbackKey;
}

export function serializeHTML(node) {
  return node ? node.innerHTML.trim() : "";
}

export function safelyParseHTML(html) {
  const template = document.createElement("template");
  try {
    template.innerHTML = html && html.trim() ? html.trim() : "";
  } catch (error) {
    return { fragment: template.content, error };
  }
  return { fragment: template.content, error: null };
}

export function renderHTMLIntoTarget(target, html) {
  const { fragment, error } = safelyParseHTML(html);
  target.innerHTML = "";
  if (fragment.childNodes.length) {
    target.appendChild(fragment.cloneNode(true));
  }
  return error;
}

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

export function getComparableChildNodes(node) {
  return Array.from(node.childNodes || []).filter((child) =>
    isComparableDomNode(child),
  );
}

function pathToSegments(path) {
  return String(path)
    .split("-")
    .slice(1)
    .map((segment) => Number(segment))
    .filter((segment) => Number.isInteger(segment));
}

function getPathDepth(path) {
  return String(path).split("-").length;
}

export function countNodes(vNode) {
  if (!vNode) {
    return 0;
  }
  return (
    1 +
    (vNode.children || []).reduce((total, child) => total + countNodes(child), 0)
  );
}

export function calculateMaxDepth(vNode) {
  if (!vNode) {
    return 0;
  }
  if (!vNode.children || !vNode.children.length) {
    return vNode.depth || 0;
  }
  return Math.max(...vNode.children.map((child) => calculateMaxDepth(child)));
}

export function getNodeDescriptor(vNode) {
  if (!vNode) {
    return "null";
  }
  if (vNode.type === "text") {
    return `#text("${sanitizeText(vNode.text)}")`;
  }
  return `<${vNode.tag}>`;
}

export function getReadableNodeSummary(vNode) {
  if (!vNode) {
    return "empty";
  }
  if (vNode.type === "text") {
    return `text:${sanitizeText(vNode.text) || "(blank)"}`;
  }
  return `${vNode.tag} | attrs:${Object.keys(vNode.attrs || {}).length} | children:${(vNode.children || []).length}`;
}

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

function normalizeAttrs(attrs = {}) {
  const normalized = { ...attrs };

  if ("className" in normalized) {
    normalized.class = normalized.className;
    delete normalized.className;
  }

  return normalized;
}

export function h(tag, attrs = {}, ...children) {
  return createElementVNode(tag, normalizeAttrs(attrs), flattenChildren(children));
}

/* -------------------------------------------------------------------------- */
/* 4. virtual dom utils                                                        */
/* -------------------------------------------------------------------------- */

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

/*
  이 함수의 역할:
  실제 DOM 노드를 Virtual DOM 객체 트리로 변환한다.
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

/*
  이 함수의 역할:
  DOM 컨테이너의 자식들을 읽어서 루트 래퍼 Virtual DOM으로 변환한다.
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

function isEventAttribute(name) {
  return name.startsWith("on");
}

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

function setDomAttribute(element, name, value) {
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

function removeDomAttribute(element, name) {
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

/*
  이 함수의 역할:
  Virtual DOM 객체 하나를 실제 DOM 노드로 생성한다.
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

export function renderVNodeToRoot(root, vNode) {
  root.innerHTML = "";
  (vNode.children || []).forEach((child) =>
    root.appendChild(createDOMFromVNode(child)),
  );
}

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

/* -------------------------------------------------------------------------- */
/* 5. traversal utils                                                          */
/* -------------------------------------------------------------------------- */

export function traverseDFS(root) {
  const order = [];
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

/* -------------------------------------------------------------------------- */
/* 6. diff engine                                                              */
/* -------------------------------------------------------------------------- */

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

/*
  이 함수의 역할:
  두 자식 배열을 비교해 생성, 삭제, 재정렬, 하위 diff를 계산한다.
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

/*
  이 함수의 역할:
  이전 Virtual DOM과 새로운 Virtual DOM을 비교해 patch 목록을 만든다.
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

export function diff(oldNode, newNode, path = "0", patches = []) {
  normalizeVNodePaths(oldNode, path, 0);
  normalizeVNodePaths(newNode, path, 0);
  return diffInternal(oldNode, newNode, path, patches);
}

/* -------------------------------------------------------------------------- */
/* 7. patch engine                                                             */
/* -------------------------------------------------------------------------- */

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
    return;
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

/*
  이 함수의 역할:
  patch 배열을 실제 DOM에 순서 있게 적용한다.
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

if (typeof window !== "undefined") {
  Object.assign(window, {
    NODE_TYPE,
    PATCH_TYPES,
    createRootContainer,
    createElementVNode,
    createTextVNode,
    domNodeToVNode,
    domToVNode,
    createDOMFromVNode,
    diff,
    applyPatches,
    isComparableDomNode,
    getComparableChildNodes,
    getDomKey,
    serializeHTML,
    safelyParseHTML,
    renderHTMLIntoTarget,
    countNodes,
    calculateMaxDepth,
    getNodeDescriptor,
    getReadableNodeSummary,
    findVNodeByPath,
    sanitizeText,
    h,
  });
}
