import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import {
  applyPatches,
  createDOMFromVNode,
  diff,
  h,
} from "../src/core/vdom.js";

function installDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  global.window = dom.window;
  global.document = dom.window.document;
  global.Node = dom.window.Node;
  return dom;
}

test("diff + patch updates only changed text and attributes", () => {
  const dom = installDom();

  const oldTree = h("section", { className: "panel" }, h("h1", null, "Before"));
  const newTree = h(
    "section",
    { className: "panel active", "data-mode": "next" },
    h("h1", null, "After"),
  );

  const mounted = createDOMFromVNode(oldTree);
  document.body.appendChild(mounted);

  const patches = diff(oldTree, newTree);
  const nextRoot = applyPatches(mounted, patches);

  assert.equal(nextRoot.outerHTML, '<section class="panel active" data-mode="next"><h1>After</h1></section>');
  dom.window.close();
});

test("diff + patch creates and removes child nodes", () => {
  const dom = installDom();

  const oldTree = h("ul", null, h("li", null, "A"), h("li", null, "B"));
  const newTree = h("ul", null, h("li", null, "A"), h("li", null, "C"), h("li", null, "D"));

  const mounted = createDOMFromVNode(oldTree);
  document.body.appendChild(mounted);

  const patches = diff(oldTree, newTree);
  applyPatches(mounted, patches);

  assert.equal(document.body.innerHTML, "<ul><li>A</li><li>C</li><li>D</li></ul>");
  dom.window.close();
});

test("diff keeps vnode inputs immutable and applies keyed reorders to the matched DOM nodes", () => {
  const dom = installDom();

  const oldTree = h(
    "ul",
    null,
    h("li", { "data-key": "alpha" }, "Alpha"),
    h("li", { "data-key": "beta" }, "Beta"),
  );
  const newTree = h(
    "ul",
    null,
    h("li", { "data-key": "beta", "data-state": "active" }, "Beta!"),
    h("li", { "data-key": "alpha" }, "Alpha"),
  );

  const mounted = createDOMFromVNode(oldTree);
  document.body.appendChild(mounted);

  const patches = diff(oldTree, newTree);
  const nextRoot = applyPatches(mounted, patches, newTree);

  assert.equal(oldTree.path, "");
  assert.equal(oldTree.children[0].path, "");
  assert.equal(newTree.children[0].key, null);
  assert.equal(
    nextRoot.outerHTML,
    '<ul><li data-key="beta" data-state="active">Beta!</li><li data-key="alpha">Alpha</li></ul>',
  );
  dom.window.close();
});
