export function formatStopwatch(totalMs) {
  const safeMs = Math.max(0, totalMs);
  const totalMinutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const hundredths = Math.floor((safeMs % 1000) / 10);

  return `${String(totalMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}
