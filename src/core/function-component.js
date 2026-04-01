import { applyPatches, createDOMFromVNode, diff } from "./vdom.js";

let currentInstance = null;

function assertHookContext(hookName) {
  if (!currentInstance) {
    throw new Error(`${hookName} must be called during root component render.`);
  }
}

function haveDepsChanged(previousDeps, nextDeps) {
  if (!previousDeps || !nextDeps) {
    return true;
  }

  if (previousDeps.length !== nextDeps.length) {
    return true;
  }

  return nextDeps.some((dep, index) => !Object.is(dep, previousDeps[index]));
}

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
    currentInstance = this;

    try {
      return this.renderFn(this.props, this);
    } finally {
      currentInstance = null;
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

export function useState(initialValue) {
  assertHookContext("useState");

  const instance = currentInstance;
  const index = instance.hookIndex;
  const existingHook = instance.hooks[index];

  if (!existingHook) {
    const hook = {
      kind: "state",
      value:
        typeof initialValue === "function" ? initialValue() : initialValue,
      setState: null,
    };

    hook.setState = (nextValue) => {
      const resolvedValue =
        typeof nextValue === "function" ? nextValue(hook.value) : nextValue;

      if (Object.is(hook.value, resolvedValue)) {
        return;
      }

      hook.value = resolvedValue;
      instance.scheduleUpdate();
    };

    instance.hooks[index] = hook;
  } else if (existingHook.kind !== "state") {
    throw new Error("Hook order changed: expected useState.");
  }

  instance.hookIndex += 1;

  const hook = instance.hooks[index];
  return [hook.value, hook.setState];
}

export function useEffect(effect, deps) {
  assertHookContext("useEffect");

  const instance = currentInstance;
  const index = instance.hookIndex;
  const existingHook = instance.hooks[index];

  if (!existingHook) {
    instance.hooks[index] = {
      kind: "effect",
      deps: deps ? [...deps] : undefined,
      cleanup: null,
    };
    instance.pendingEffects.push({
      hook: instance.hooks[index],
      effect,
    });
  } else {
    if (existingHook.kind !== "effect") {
      throw new Error("Hook order changed: expected useEffect.");
    }

    if (haveDepsChanged(existingHook.deps, deps)) {
      existingHook.deps = deps ? [...deps] : undefined;
      instance.pendingEffects.push({
        hook: existingHook,
        effect,
      });
    }
  }

  instance.hookIndex += 1;
}

export function useMemo(factory, deps) {
  assertHookContext("useMemo");

  const instance = currentInstance;
  const index = instance.hookIndex;
  const existingHook = instance.hooks[index];

  if (!existingHook) {
    instance.hooks[index] = {
      kind: "memo",
      deps: deps ? [...deps] : undefined,
      value: factory(),
    };
  } else {
    if (existingHook.kind !== "memo") {
      throw new Error("Hook order changed: expected useMemo.");
    }

    if (haveDepsChanged(existingHook.deps, deps)) {
      existingHook.deps = deps ? [...deps] : undefined;
      existingHook.value = factory();
    }
  }

  instance.hookIndex += 1;
  return instance.hooks[index].value;
}
