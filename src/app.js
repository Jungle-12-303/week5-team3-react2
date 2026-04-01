import {
  FunctionComponent,
  useEffect,
  useMemo,
  useState,
} from "./core/function-component.js";
import { h } from "./core/vdom.js";

function formatSeconds(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function CounterCard({ title, value, onDecrease, onIncrease, onReset }) {
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

function TimerCard({ running, seconds, onToggle, onReset }) {
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

function App() {
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

export function mountApp(container = document.querySelector("#app")) {
  if (!container) {
    throw new Error("Mount target #app was not found.");
  }

  const app = new FunctionComponent(App, container);
  app.mount();
  window.customReactApp = app;
  return app;
}

if (document.querySelector("#app") && !window.__CUSTOM_REACT_SKIP_AUTO_MOUNT__) {
  mountApp();
}
