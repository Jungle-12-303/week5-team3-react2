let currentInstance = null;

/**
 * 훅이 함수형 컴포넌트 렌더링 중에 호출되었는지 검사합니다.
 *
 * @param {string} hookName 검사 중인 훅 이름입니다.
 * @returns {void} 유효한 렌더링 컨텍스트가 없으면 예외를 던집니다.
 */
export function assertHookContext(hookName) {
  if (!currentInstance) {
    throw new Error(`${hookName} must be called during root component render.`);
  }
}

/**
 * 현재 렌더링 중인 함수형 컴포넌트 인스턴스를 반환합니다.
 *
 * @returns {import("./FunctionComponent.js").FunctionComponent | null} 현재 활성 인스턴스 또는 없으면 `null`입니다.
 */
export function getCurrentInstance() {
  return currentInstance;
}

/**
 * 현재 렌더링 컨텍스트에 함수형 컴포넌트 인스턴스를 기록합니다.
 *
 * @param {import("./FunctionComponent.js").FunctionComponent | null} instance 현재 활성화할 인스턴스입니다.
 * @returns {void} 내부 전역 렌더링 컨텍스트를 갱신합니다.
 */
export function setCurrentInstance(instance) {
  currentInstance = instance;
}
