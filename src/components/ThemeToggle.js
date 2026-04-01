import { h } from "../core/vdom.js";

export function ThemeToggle({ theme, onToggle }) {
  return h(
    "button",
    {
      className: `theme-toggle ${theme === "light" ? "light" : "dark"}`,
      type: "button",
      "aria-label": `${theme === "dark" ? "라이트" : "다크"} 모드로 전환`,
      "aria-pressed": theme === "light" ? "true" : "false",
      onClick: onToggle,
    },
    h("span", { className: "theme-toggle-track" }),
    h(
      "span",
      { className: "theme-toggle-thumb", "aria-hidden": "true" },
      theme === "light" ? "☀" : "☾",
    ),
    h(
      "span",
      { className: "theme-toggle-label theme-toggle-label-light" },
      "Light",
    ),
    h(
      "span",
      { className: "theme-toggle-label theme-toggle-label-dark" },
      "Dark",
    ),
  );
}
