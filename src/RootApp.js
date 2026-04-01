import { useEffect, useMemo, useState } from "./core/function-component.js";
import { h } from "./core/vdom.js";
import { StopwatchCard } from "./components/StopwatchCard.js";

export function RootApp() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = window.localStorage?.getItem("stopwatch-theme");

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    if (typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
    }

    return "dark";
  });
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
    const latestLap = laps.length ? laps[laps.length - 1] : null;
    const latestLapTotal = latestLap ? latestLap.totalMs : 0;
    const latestLapMs = latestLap ? latestLap.lapMs : 0;
    const comparableLaps = laps.slice(0, -1);

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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage?.setItem("stopwatch-theme", theme);
  }, [theme]);

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

    const previousTotal = laps.length ? laps[laps.length - 1].totalMs : 0;
    const nextLap = {
      id: `${laps.length + 1}-${elapsedMs}`,
      number: laps.length + 1,
      lapMs: elapsedMs - previousTotal,
      totalMs: elapsedMs,
    };

    setLaps((current) => [...current, nextLap]);
  }

  function handleThemeToggle() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  return h(
    "main",
    { className: "page-shell" },
    h(
      "div",
      { className: "page-toolbar" },
      h(
        "button",
        {
          className: `theme-toggle ${theme === "light" ? "light" : "dark"}`,
          type: "button",
          "aria-label": `${theme === "dark" ? "라이트" : "다크"} 모드로 전환`,
          "aria-pressed": theme === "light" ? "true" : "false",
          onClick: handleThemeToggle,
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
      ),
    ),
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
