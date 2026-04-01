/**
 * 공백이 많은 문자열을 비교하기 쉬운 형태로 정리합니다.
 *
 * @param {unknown} text 정리할 원본 값입니다.
 * @returns {string} 연속 공백이 축약되고 앞뒤 공백이 제거된 문자열입니다.
 */
export function sanitizeText(text) {
  return typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";
}

/**
 * 속성 객체에서 노드 식별 키를 찾고, 없으면 대체 키를 사용합니다.
 *
 * @param {Record<string, unknown> | null | undefined} attrs 키 후보가 들어 있는 속성 객체입니다.
 * @param {string} fallbackKey 속성에 키가 없을 때 사용할 기본 키입니다.
 * @returns {string} 노드 비교에 사용할 최종 키 문자열입니다.
 */
export function buildKey(attrs, fallbackKey) {
  if (!attrs) {
    return fallbackKey;
  }

  return attrs["data-key"] || attrs.key || attrs.id || fallbackKey;
}

/**
 * 경로 문자열을 자식 인덱스 배열로 변환합니다.
 *
 * @param {string} path `0-1-2` 형태의 경로 문자열입니다.
 * @returns {number[]} 루트 이후 각 세그먼트를 숫자로 변환한 인덱스 배열입니다.
 */
export function pathToSegments(path) {
  return String(path)
    .split("-")
    .slice(1)
    .map((segment) => Number(segment))
    .filter((segment) => Number.isInteger(segment));
}

/**
 * 경로 문자열의 깊이를 계산합니다.
 *
 * @param {string} path `0-1-2` 형태의 경로 문자열입니다.
 * @returns {number} `-`로 구분된 세그먼트 개수입니다.
 */
export function getPathDepth(path) {
  return String(path).split("-").length;
}
