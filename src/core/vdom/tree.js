import { sanitizeText } from "./helpers.js";

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
