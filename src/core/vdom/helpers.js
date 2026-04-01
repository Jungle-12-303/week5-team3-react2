export function sanitizeText(text) {
  return typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";
}

export function buildKey(attrs, fallbackKey) {
  if (!attrs) {
    return fallbackKey;
  }

  return attrs["data-key"] || attrs.key || attrs.id || fallbackKey;
}

export function pathToSegments(path) {
  return String(path)
    .split("-")
    .slice(1)
    .map((segment) => Number(segment))
    .filter((segment) => Number.isInteger(segment));
}

export function getPathDepth(path) {
  return String(path).split("-").length;
}
