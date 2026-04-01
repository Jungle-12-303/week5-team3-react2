import { applyPatches, createDOMFromVNode, diff } from "../vdom.js";
import { setCurrentInstance } from "./runtime.js";

export class FunctionComponent {
  constructor(renderFn, container, props = {}) {
    this.renderFn = renderFn;
    this.container = container;
    this.props = props;
    this.hooks = [];
    this.hookIndex = 0;
    this.pendingEffects = [];
    this.isMounted = false;
    this.updateScheduled = false;
    this.vnode = null;
    this.dom = null;
    this.renderCount = 0;
  }

  mount() {
    const nextVNode = this.#render();
    const nextDom = createDOMFromVNode(nextVNode);

    this.container.replaceChildren(nextDom);
    this.vnode = nextVNode;
    this.dom = nextDom;
    this.isMounted = true;
    this.#flushEffects();
    return this;
  }

  update() {
    if (!this.isMounted) {
      return this.mount();
    }

    const nextVNode = this.#render();
    const patches = diff(this.vnode, nextVNode);

    this.dom = applyPatches(this.dom, patches, nextVNode);
    if (this.container.firstChild !== this.dom) {
      this.container.replaceChildren(this.dom);
    }

    this.vnode = nextVNode;
    this.#flushEffects();
    return this;
  }

  scheduleUpdate() {
    if (this.updateScheduled) {
      return;
    }

    this.updateScheduled = true;
    queueMicrotask(() => {
      this.updateScheduled = false;
      this.update();
    });
  }

  unmount() {
    for (const hook of this.hooks) {
      if (hook?.kind === "effect" && typeof hook.cleanup === "function") {
        hook.cleanup();
      }
    }

    this.container.replaceChildren();
    this.hooks = [];
    this.pendingEffects = [];
    this.vnode = null;
    this.dom = null;
    this.isMounted = false;
  }

  #render() {
    this.renderCount += 1;
    this.hookIndex = 0;
    this.pendingEffects = [];
    setCurrentInstance(this);

    try {
      return this.renderFn(this.props, this);
    } finally {
      setCurrentInstance(null);
    }
  }

  #flushEffects() {
    for (const { hook, effect } of this.pendingEffects) {
      if (typeof hook.cleanup === "function") {
        hook.cleanup();
      }

      const cleanup = effect();
      hook.cleanup = typeof cleanup === "function" ? cleanup : null;
    }

    this.pendingEffects = [];
  }
}
