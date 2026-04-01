import { h } from "../core/vdom.js";

export function CounterCard({
  title,
  value,
  onDecrease,
  onIncrease,
  onReset,
}) {
  return h(
    "article",
    { className: "panel dial-card counter-card" },
    h("h3", null, title),
    h(
      "div",
      { className: "counter-core" },
      h("p", { className: "counter-value" }, value),
    ),
    h(
      "div",
      { className: "button-row" },
      h("button", { className: "ghost-button", onClick: onDecrease }, "-1"),
      h("button", { className: "primary-button", onClick: onIncrease }, "+1"),
      h("button", { className: "ghost-button", onClick: onReset }, "Reset"),
    ),
  );
}
