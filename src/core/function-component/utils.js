/**
 * 의존성 배열이 이전 렌더와 달라졌는지 판별합니다.
 *
 * @param {unknown[] | undefined} previousDeps 이전 렌더의 의존성 배열입니다.
 * @param {unknown[] | undefined} nextDeps 현재 렌더의 의존성 배열입니다.
 * @returns {boolean} 길이나 원소가 하나라도 다르면 `true`입니다.
 */
export function haveDepsChanged(previousDeps, nextDeps) {
  if (!previousDeps || !nextDeps) {
    return true;
  }

  if (previousDeps.length !== nextDeps.length) {
    return true;
  }

  return nextDeps.some((dep, index) => !Object.is(dep, previousDeps[index]));
}
