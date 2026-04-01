import { useEffect, useMemo, useState } from "./core/function-component.js";
import { h } from "./core/vdom.js";
import { StopwatchCard } from "./components/StopwatchCard.js";

export function RootApp() {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState(null);
  const [laps, setLaps] = useState([]);

  useEffect(() => {
    if (!running || startedAtMs === null) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAtMs);
    }, 10);

    return () => window.clearInterval(timerId);
  }, [running, startedAtMs]);

  const summary = useMemo(() => {
    const latestLapTotal = laps.length ? laps[0].totalMs : 0;
    const latestLapMs = laps.length ? laps[0].lapMs : 0;
    const comparableLaps = laps.slice(1);

    return {
      latestLapTotal,
      latestLapMs,
      fastestLapId:
        comparableLaps.length > 1
          ? comparableLaps.reduce((best, lap) =>
              lap.lapMs < best.lapMs ? lap : best,
            ).id
          : null,
      slowestLapId:
        comparableLaps.length > 1
          ? comparableLaps.reduce((worst, lap) =>
              lap.lapMs > worst.lapMs ? lap : worst,
            ).id
          : null,
    };
  }, [laps]);

  useEffect(() => {
    document.title = `Week5 Stopwatch | ${running ? "RUN" : "STOP"} ${elapsedMs}`;
  }, [running, elapsedMs]);

  function handlePrimaryAction() {
    if (running) {
      setRunning(false);
      return;
    }

    setStartedAtMs(Date.now() - elapsedMs);
    setRunning(true);
  }

  function handleLapRecord() {
    if (!running || elapsedMs === 0) {
      setRunning(false);
      setElapsedMs(0);
      setStartedAtMs(null);
      setLaps([]);
      return;
    }

    const previousTotal = laps.length ? laps[0].totalMs : 0;
    const nextLap = {
      id: `${laps.length + 1}-${elapsedMs}`,
      number: laps.length + 1,
      lapMs: elapsedMs - previousTotal,
      totalMs: elapsedMs,
    };

    setLaps((current) => [nextLap, ...current]);
  }

  return h(
    "main",
    { className: "page-shell" },
    StopwatchCard({
      running,
      elapsedMs,
      latestLapMs: summary.latestLapMs,
      laps,
      fastestLapId: summary.fastestLapId,
      slowestLapId: summary.slowestLapId,
      onPrimaryAction: handlePrimaryAction,
      onSecondaryAction: handleLapRecord,
    }),
  );
}
