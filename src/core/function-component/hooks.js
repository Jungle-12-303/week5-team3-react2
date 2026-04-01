import { assertHookContext, getCurrentInstance } from "./runtime.js";
import { haveDepsChanged } from "./utils.js";

export function useState(initialValue) {
  assertHookContext("useState");

  const instance = getCurrentInstance();
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

  const instance = getCurrentInstance();
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

  const instance = getCurrentInstance();
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
