import { h } from "../core/vdom.js";
import { formatStopwatch } from "../utils/formatStopwatch.js";

function renderTimeSlots(timeText, slotClassName) {
  return timeText.split("").map((char, index) =>
    h(
      "span",
      {
        className: char >= "0" && char <= "9" ? `${slotClassName} digit-slot` : `${slotClassName} separator-slot`,
        key: `${char}-${index}`,
      },
      char,
    ),
  );
}

function getLapRowClass(index, fastestLapId, slowestLapId, lapId) {
  if (index === 0) {
    return "lap-row latest-lap";
  }

  if (lapId === fastestLapId) {
    return "lap-row fastest-lap";
  }

  if (lapId === slowestLapId) {
    return "lap-row slowest-lap";
  }

  return "lap-row";
}

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
  const displayedLaps = [...laps].reverse();

  return h(
    "section",
    { className: "stopwatch-shell" },
    h(
      "section",
      { className: "laps-panel" },
      h(
        "div",
        { className: "laps-header" },
        h("span", null, "구간"),
        h("span", null, "구간기록"),
        h("span", null, "전체 시간"),
      ),
      laps.length
        ? h(
            "div",
            { className: "laps-body" },
            ...displayedLaps.map((lap, index) =>
              h(
                "div",
                {
                  className: getLapRowClass(
                    index,
                    fastestLapId,
                    slowestLapId,
                    lap.id,
                  ),
                },
                h("span", { className: "lap-index" }, String(lap.number).padStart(2, "0")),
                h("span", { className: "lap-split" }, formatStopwatch(lap.lapMs)),
                h("span", { className: "lap-total" }, formatStopwatch(lap.totalMs)),
              ),
            ),
          )
        : h(
            "p",
            { className: "empty-laps" },
            "스톱워치를 시작하고 구간 기록을 눌러 랩 타임을 남겨보세요.",
          ),
    ),
    h(
      "section",
      { className: "timer-panel" },
      h("p", { className: "eyebrow-label" }, "Custom React Stopwatch"),
      h("p", { className: "main-time", "aria-label": elapsedTimeText }, ...renderTimeSlots(elapsedTimeText, "main-time-slot")),
      h("p", { className: "sub-time", "aria-label": latestLapText }, ...renderTimeSlots(latestLapText, "sub-time-slot")),
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
