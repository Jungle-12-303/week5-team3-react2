import { buildKey } from "./helpers.js";

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
