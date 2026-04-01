/**
 * DOM 노드 타입 상수를 모아 둔 객체입니다.
 *
 * @type {{ELEMENT: number, TEXT: number, COMMENT: number}}
 */
export const NODE_TYPE = {
  ELEMENT: 1,
  TEXT: 3,
  COMMENT: 8,
};

/**
 * Virtual DOM 패치 타입 상수를 모아 둔 객체입니다.
 *
 * @type {{
 *   CREATE: string,
 *   REMOVE: string,
 *   REPLACE: string,
 *   TEXT: string,
 *   ATTR_SET: string,
 *   ATTR_REMOVE: string,
 *   REORDER_CHILDREN: string
 * }}
 */
export const PATCH_TYPES = {
  CREATE: "CREATE",
  REMOVE: "REMOVE",
  REPLACE: "REPLACE",
  TEXT: "TEXT",
  ATTR_SET: "ATTR_SET",
  ATTR_REMOVE: "ATTR_REMOVE",
  REORDER_CHILDREN: "REORDER_CHILDREN",
};
