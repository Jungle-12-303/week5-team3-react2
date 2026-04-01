/*
  Unified Virtual DOM Engine Core
  Base structure imported from the previous Week 2 VDOM project and adapted
  for the Week 5 custom React runtime.
*/

import * as constants from "./vdom/constants.js";
import * as helpers from "./vdom/helpers.js";
import * as vnode from "./vdom/vnode.js";
import * as dom from "./vdom/dom.js";
import * as tree from "./vdom/tree.js";
import * as diffModule from "./vdom/diff.js";
import * as patchModule from "./vdom/patch.js";

export { NODE_TYPE, PATCH_TYPES } from "./vdom/constants.js";
export { sanitizeText } from "./vdom/helpers.js";
export {
  createRootContainer,
  createElementVNode,
  createTextVNode,
  h,
  normalizeVNodePaths,
} from "./vdom/vnode.js";
export {
  serializeHTML,
  safelyParseHTML,
  renderHTMLIntoTarget,
  isComparableDomNode,
  getComparableChildNodes,
  getDomKey,
  domNodeToVNode,
  domToVNode,
  createDOMFromVNode,
  renderVNodeToRoot,
} from "./vdom/dom.js";
export {
  countNodes,
  calculateMaxDepth,
  getNodeDescriptor,
  getReadableNodeSummary,
  findVNodeByPath,
  traverseDFS,
  traverseBFS,
} from "./vdom/tree.js";
export { diff } from "./vdom/diff.js";
export { applyPatches } from "./vdom/patch.js";

if (typeof window !== "undefined") {
  Object.assign(window, {
    ...constants,
    ...helpers,
    ...vnode,
    ...dom,
    ...tree,
    ...diffModule,
    ...patchModule,
  });
}
