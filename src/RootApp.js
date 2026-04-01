import { useEffect, useMemo, useState } from "./core/function-component.js";
import { h } from "./core/vdom.js";
import { CounterCard } from "./components/CounterCard.js";
import { TimerCard } from "./components/TimerCard.js";

export function RootApp() {
  const [scores, setScores] = useState({ alpha: 0, beta: 0 });
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [running]);

  const summary = useMemo(() => {
    const totalScore = scores.alpha + scores.beta;
    const pace = seconds === 0 ? totalScore : (totalScore / seconds).toFixed(2);

    return {
      totalScore,
      paceLabel: `${pace}/sec`,
    };
  }, [scores.alpha, scores.beta, seconds]);

  useEffect(() => {
    document.title = `Week5 MVP | total ${summary.totalScore}`;
  }, [summary.totalScore]);

  function changeScore(name, delta) {
    setScores((current) => ({
      ...current,
      [name]: Math.max(0, current[name] + delta),
    }));
  }

  function resetScore(name) {
    setScores((current) => ({
      ...current,
      [name]: 0,
    }));
  }

  function resetTimer() {
    setRunning(false);
    setSeconds(0);
  }

  return h(
    "main",
    { className: "page-shell" },
    h(
      "section",
      { className: "content-grid" },
      CounterCard({
        title: "카운트 1",
        value: scores.alpha,
        onDecrease: () => changeScore("alpha", -1),
        onIncrease: () => changeScore("alpha", 1),
        onReset: () => resetScore("alpha"),
      }),
      CounterCard({
        title: "카운트 2",
        value: scores.beta,
        onDecrease: () => changeScore("beta", -1),
        onIncrease: () => changeScore("beta", 1),
        onReset: () => resetScore("beta"),
      }),
      TimerCard({
        running,
        seconds,
        onToggle: () => setRunning((current) => !current),
        onReset: resetTimer,
      }),
    ),
  );
}
