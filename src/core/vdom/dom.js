import { NODE_TYPE } from "./constants.js";
import { buildKey } from "./helpers.js";
import {
  createRootContainer,
} from "./vnode.js";

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
