import { h } from "../core/vdom.js";
import { formatStopwatch } from "../utils/formatStopwatch.js";
import { LapsPanel } from "./LapsPanel.js";
import { TimeSlots } from "./TimeSlots.js";

export function StopwatchCard({
  running,
  elapsedMs,
  latestLapMs,
  laps,
  fastestLapId,
  slowestLapId,
  onPrimaryAction,
  onSecondaryAction,
}) {
  const elapsedTimeText = formatStopwatch(elapsedMs);
  const latestLapText = laps.length ? formatStopwatch(latestLapMs) : "00:00.00";

  return h(
    "section",
    { className: "stopwatch-shell" },
    LapsPanel({ laps, fastestLapId, slowestLapId }),
    h(
      "section",
      { className: "timer-panel" },
      h("p", { className: "eyebrow-label" }, "Custom React Stopwatch"),
      TimeSlots({
        className: "main-time",
        slotClassName: "main-time-slot",
        timeText: elapsedTimeText,
      }),
      TimeSlots({
        className: "sub-time",
        slotClassName: "sub-time-slot",
        timeText: latestLapText,
      }),
      h(
        "div",
        { className: "stopwatch-actions" },
        h(
          "button",
          {
            className: "secondary-action",
            onClick: onSecondaryAction,
          },
          running ? "구간 기록" : "초기화",
        ),
        h(
          "button",
          {
            className: "primary-action",
            onClick: onPrimaryAction,
          },
          running ? "정지" : "시작",
        ),
      ),
    ),
  );
}
