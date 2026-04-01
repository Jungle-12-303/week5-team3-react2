import { assertHookContext, getCurrentInstance } from "./runtime.js";
import { haveDepsChanged } from "./utils.js";

/**
 * 상태 값을 읽고 갱신 함수를 반환하는 훅입니다.
 *
 * @template T
 * @param {T | (() => T)} initialValue 초기 상태 값 또는 초기값 생성 함수입니다.
 * @returns {[T, (nextValue: T | ((currentValue: T) => T)) => void]} 현재 상태와 상태 갱신 함수입니다.
 */
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

/**
 * 렌더 후 이펙트를 실행하고 필요하면 cleanup을 등록하는 훅입니다.
 *
 * @param {() => void | (() => void)} effect 렌더 후 실행할 이펙트 함수입니다.
 * @param {unknown[] | undefined} deps 이펙트 재실행 여부를 판단할 의존성 배열입니다.
 * @returns {void} 이펙트 실행을 예약하거나 유지합니다.
 */
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

/**
 * 의존성이 바뀔 때만 계산을 다시 수행하고 결과를 캐시하는 훅입니다.
 *
 * @template T
 * @param {() => T} factory 캐시할 값을 계산하는 함수입니다.
 * @param {unknown[] | undefined} deps 값을 다시 계산할지 판단할 의존성 배열입니다.
 * @returns {T} 현재 의존성 기준으로 캐시된 계산 결과입니다.
 */
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
