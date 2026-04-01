import { applyPatches, createDOMFromVNode, diff } from "../vdom.js";
import { setCurrentInstance } from "./runtime.js";

/**
 * 상태 훅이 저장하는 데이터입니다.
 *
 * @typedef {object} StateHook
 * @property {"state"} kind 훅 종류입니다.
 * @property {unknown} value 현재 상태 값입니다.
 * @property {(nextValue: unknown | ((currentValue: unknown) => unknown)) => void} setState 상태 갱신 함수입니다.
 */

/**
 * 이펙트 훅이 저장하는 데이터입니다.
 *
 * @typedef {object} EffectHook
 * @property {"effect"} kind 훅 종류입니다.
 * @property {unknown[] | undefined} deps 마지막으로 적용한 의존성 배열입니다.
 * @property {(() => void) | null} cleanup 마지막 이펙트가 반환한 정리 함수입니다.
 */

/**
 * 메모 훅이 저장하는 데이터입니다.
 *
 * @typedef {object} MemoHook
 * @property {"memo"} kind 훅 종류입니다.
 * @property {unknown[] | undefined} deps 마지막 계산에 사용한 의존성 배열입니다.
 * @property {unknown} value 캐시된 계산 결과입니다.
 */

/**
 * 함수형 컴포넌트 인스턴스가 보관하는 훅 상태 타입입니다.
 *
 * @typedef {StateHook | EffectHook | MemoHook} HookState
 */

/**
 * 대기 중인 이펙트 실행 정보입니다.
 *
 * @typedef {object} PendingEffect
 * @property {EffectHook} hook 실행 대상 훅 상태입니다.
 * @property {() => void | (() => void)} effect 실행할 이펙트 함수입니다.
 */

/**
 * 함수형 컴포넌트의 렌더 함수 시그니처입니다.
 *
 * @typedef {(props: Record<string, unknown>, instance: FunctionComponent) => import("../vdom/vnode.js").VNode} FunctionComponentRenderFn
 */

/**
 * 함수형 컴포넌트 런타임 인스턴스입니다.
 */
export class FunctionComponent {
  /**
   * 함수형 컴포넌트 인스턴스를 생성합니다.
   *
   * @param {FunctionComponentRenderFn} renderFn 렌더 결과로 VNode를 반환하는 함수입니다.
   * @param {Element} container 렌더링 결과를 붙일 실제 DOM 컨테이너입니다.
   * @param {Record<string, unknown>} [props={}] 렌더 함수에 전달할 초기 props입니다.
   */
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

  /**
   * 컴포넌트를 처음 렌더링해 실제 DOM에 마운트합니다.
   *
   * @returns {FunctionComponent} 마운트가 끝난 현재 인스턴스입니다.
   */
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

  /**
   * 새 VNode를 렌더링하고 이전 결과와 diff하여 DOM을 갱신합니다.
   *
   * @returns {FunctionComponent} 업데이트가 끝난 현재 인스턴스입니다.
   */
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

  /**
   * 마이크로태스크 큐에 한 번만 업데이트를 예약합니다.
   *
   * @returns {void} 중복 예약을 막으면서 다음 마이크로태스크에서 업데이트합니다.
   */
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

  /**
   * 등록된 이펙트 정리 함수를 실행하고 DOM과 훅 상태를 비웁니다.
   *
   * @returns {void} 컴포넌트를 언마운트 상태로 되돌립니다.
   */
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

  /**
   * 현재 props와 훅 컨텍스트로 렌더 함수를 실행합니다.
   *
   * @returns {import("../vdom/vnode.js").VNode} 렌더 함수가 반환한 최신 Virtual DOM 노드입니다.
   */
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

  /**
   * 대기 중인 이펙트를 실행하고 cleanup 참조를 갱신합니다.
   *
   * @returns {void} 현재 렌더에서 예약된 이펙트를 모두 소비합니다.
   */
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
