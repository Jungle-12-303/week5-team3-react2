import { h } from "../core/vdom.js";

function renderTimeSlots(timeText, slotClassName) {
  return timeText.split("").map((char, index) =>
    h(
      "span",
      {
        className:
          char >= "0" && char <= "9"
            ? `${slotClassName} digit-slot`
            : `${slotClassName} separator-slot`,
        key: `${char}-${index}`,
      },
      char,
    ),
  );
}

export function TimeSlots({ as = "p", className, slotClassName, timeText }) {
  return h(
    as,
    { className, "aria-label": timeText },
    ...renderTimeSlots(timeText, slotClassName),
  );
}
