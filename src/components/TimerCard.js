import { h } from "../core/vdom.js";
import { formatSeconds } from "../utils/formatSeconds.js";

export function TimerCard({ running, seconds, onToggle, onReset }) {
  const secondAngle = (seconds % 60) * 6;
  const minuteAngle = ((seconds / 60) % 60) * 6;

  return h(
    "article",
    { className: "panel dial-card timer-card" },
    h("h3", null, "시계"),
    h(
      "div",
      { className: "clock-face" },
      ...Array.from({ length: 12 }, (_, index) =>
        h("span", {
          className: "clock-tick",
          style: `transform: translateX(-50%) rotate(${index * 30}deg);`,
        }),
      ),
      h("span", {
        className: "clock-hand minute-hand",
        style: `transform: translateX(-50%) rotate(${minuteAngle}deg);`,
      }),
      h("span", {
        className: "clock-hand second-hand",
        style: `transform: translateX(-50%) rotate(${secondAngle}deg);`,
      }),
      h("span", { className: "clock-center-dot" }),
      h("p", { className: "timer-value" }, formatSeconds(seconds)),
    ),
    h(
      "div",
      { className: "button-row" },
      h(
        "button",
        { className: "primary-button", onClick: onToggle },
        running ? "Pause" : "Start",
      ),
      h("button", { className: "ghost-button", onClick: onReset }, "Reset"),
    ),
  );
}
