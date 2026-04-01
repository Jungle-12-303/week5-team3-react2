const TEXT_NODE = "TEXT_NODE";

export const PATCH_TYPES = Object.freeze({
  CREATE: "CREATE",
  REMOVE: "REMOVE",
  REPLACE: "REPLACE",
  TEXT: "TEXT",
  SET_PROP: "SET_PROP",
  REMOVE_PROP: "REMOVE_PROP",
});

function flattenChildren(children, bucket = []) {
  for (const child of children) {
    if (Array.isArray(child)) {
      flattenChildren(child, bucket);
      continue;
    }

    if (child === null || child === undefined || child === false) {
      continue;
    }

    if (typeof child === "string" || typeof child === "number") {
      bucket.push(createTextVNode(child));
      continue;
    }

    bucket.push(child);
  }

  return bucket;
}

export function createTextVNode(value) {
  return {
    type: TEXT_NODE,
    text: String(value),
    props: {},
    children: [],
  };
}

export function h(type, props = {}, ...children) {
  return {
    type,
    props: props ?? {},
    children: flattenChildren(children),
  };
}

function isTextVNode(vnode) {
  return vnode?.type === TEXT_NODE;
}

function isEventProp(name) {
  return name.startsWith("on");
}

function normalizePropName(name) {
  return name === "className" ? "class" : name;
}

function setEvent(domNode, eventName, nextHandler) {
  const store = domNode.__listeners ?? {};
  const previousHandler = store[eventName];

  if (previousHandler) {
    domNode.removeEventListener(eventName, previousHandler);
  }

  if (typeof nextHandler === "function") {
    domNode.addEventListener(eventName, nextHandler);
    store[eventName] = nextHandler;
  } else {
    delete store[eventName];
  }

  domNode.__listeners = store;
}

function setDomProp(domNode, name, value) {
  if (name === "key" || name === "children") {
    return;
  }

  if (isEventProp(name)) {
    setEvent(domNode, name.slice(2).toLowerCase(), value);
    return;
  }

  if (name === "className") {
    domNode.setAttribute("class", value ?? "");
    return;
  }

  if (name === "value") {
    domNode.value = value ?? "";
    return;
  }

  if (name === "checked") {
    domNode.checked = Boolean(value);
    if (!value) {
      domNode.removeAttribute("checked");
    } else {
      domNode.setAttribute("checked", "");
    }
    return;
  }

  if (value === false || value === null || value === undefined) {
    domNode.removeAttribute(normalizePropName(name));
    return;
  }

  if (value === true) {
    domNode.setAttribute(normalizePropName(name), "");
    return;
  }

  domNode.setAttribute(normalizePropName(name), String(value));
}

function removeDomProp(domNode, name) {
  if (name === "key" || name === "children") {
    return;
  }

  if (isEventProp(name)) {
    setEvent(domNode, name.slice(2).toLowerCase(), null);
    return;
  }

  if (name === "value") {
    domNode.value = "";
    return;
  }

  if (name === "checked") {
    domNode.checked = false;
  }

  domNode.removeAttribute(normalizePropName(name));
}

export function createDOMFromVNode(vnode) {
  if (isTextVNode(vnode)) {
    return document.createTextNode(vnode.text);
  }

  const element = document.createElement(vnode.type);

  for (const [name, value] of Object.entries(vnode.props ?? {})) {
    setDomProp(element, name, value);
  }

  for (const child of vnode.children ?? []) {
    element.appendChild(createDOMFromVNode(child));
  }

  return element;
}

function diffProps(oldProps, newProps, path, patches) {
  const oldKeys = Object.keys(oldProps ?? {});
  const newKeys = Object.keys(newProps ?? {});
  const allKeys = new Set([...oldKeys, ...newKeys]);

  for (const key of allKeys) {
    const oldValue = oldProps?.[key];
    const newValue = newProps?.[key];

    if (!(key in (newProps ?? {}))) {
      patches.push({
        type: PATCH_TYPES.REMOVE_PROP,
        path,
        name: key,
      });
      continue;
    }

    if (!Object.is(oldValue, newValue)) {
      patches.push({
        type: PATCH_TYPES.SET_PROP,
        path,
        name: key,
        value: newValue,
      });
    }
  }
}

function walkDiff(oldVNode, newVNode, path, patches) {
  if (!oldVNode && newVNode) {
    patches.push({
      type: PATCH_TYPES.CREATE,
      parentPath: path.slice(0, -1),
      index: path.at(-1) ?? 0,
      node: newVNode,
    });
    return;
  }

  if (oldVNode && !newVNode) {
    patches.push({
      type: PATCH_TYPES.REMOVE,
      path,
    });
    return;
  }

  if (oldVNode.type !== newVNode.type) {
    patches.push({
      type: PATCH_TYPES.REPLACE,
      path,
      node: newVNode,
    });
    return;
  }

  if (isTextVNode(oldVNode) && isTextVNode(newVNode)) {
    if (oldVNode.text !== newVNode.text) {
      patches.push({
        type: PATCH_TYPES.TEXT,
        path,
        value: newVNode.text,
      });
    }

    return;
  }

  if (oldVNode.type !== newVNode.type) {
    patches.push({
      type: PATCH_TYPES.REPLACE,
      path,
      node: newVNode,
    });
    return;
  }

  diffProps(oldVNode.props, newVNode.props, path, patches);

  const maxLength = Math.max(
    oldVNode.children?.length ?? 0,
    newVNode.children?.length ?? 0,
  );

  for (let index = 0; index < maxLength; index += 1) {
    walkDiff(
      oldVNode.children?.[index],
      newVNode.children?.[index],
      [...path, index],
      patches,
    );
  }
}

export function diff(oldVNode, newVNode) {
  const patches = [];
  walkDiff(oldVNode, newVNode, [], patches);
  return patches;
}

function getNodeByPath(rootNode, path) {
  if (path.length === 0) {
    return rootNode;
  }

  let current = rootNode;
  for (const index of path) {
    current = current?.childNodes?.[index];
    if (!current) {
      return null;
    }
  }

  return current;
}

export function applyPatches(rootNode, patches) {
  let currentRoot = rootNode;

  const removePatches = patches
    .filter((patch) => patch.type === PATCH_TYPES.REMOVE)
    .sort((left, right) => right.path.length - left.path.length);

  const createPatches = patches
    .filter((patch) => patch.type === PATCH_TYPES.CREATE)
    .sort((left, right) => left.parentPath.length - right.parentPath.length);

  const otherPatches = patches.filter(
    (patch) =>
      patch.type !== PATCH_TYPES.REMOVE && patch.type !== PATCH_TYPES.CREATE,
  );

  for (const patch of removePatches) {
    const target = getNodeByPath(currentRoot, patch.path);
    target?.parentNode?.removeChild(target);
  }

  for (const patch of otherPatches) {
    const target = getNodeByPath(currentRoot, patch.path);

    switch (patch.type) {
      case PATCH_TYPES.REPLACE: {
        const nextNode = createDOMFromVNode(patch.node);
        if (patch.path.length === 0) {
          currentRoot.replaceWith(nextNode);
          currentRoot = nextNode;
        } else {
          target?.parentNode?.replaceChild(nextNode, target);
        }
        break;
      }
      case PATCH_TYPES.TEXT:
        if (target) {
          target.textContent = patch.value;
        }
        break;
      case PATCH_TYPES.SET_PROP:
        if (target?.nodeType === Node.ELEMENT_NODE) {
          setDomProp(target, patch.name, patch.value);
        }
        break;
      case PATCH_TYPES.REMOVE_PROP:
        if (target?.nodeType === Node.ELEMENT_NODE) {
          removeDomProp(target, patch.name);
        }
        break;
      default:
        break;
    }
  }

  for (const patch of createPatches) {
    const parent = getNodeByPath(currentRoot, patch.parentPath);
    const nextNode = createDOMFromVNode(patch.node);
    const referenceNode = parent?.childNodes?.[patch.index] ?? null;
    parent?.insertBefore(nextNode, referenceNode);
  }

  return currentRoot;
}
