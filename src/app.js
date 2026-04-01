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

function CounterCard({ title, value, total, onDecrease, onIncrease, onReset }) {
  return h(
    "article",
    { className: "panel counter-card" },
    h("h3", null, title),
    h("p", { className: "counter-value" }, value),
    h("p", { className: "muted" }, `두 카운터 합계: ${total}`),
    h(
      "div",
      { className: "button-row" },
      h("button", { className: "ghost-button", onClick: onDecrease }, "-1"),
      h("button", { className: "primary-button", onClick: onIncrease }, "+1"),
      h("button", { className: "ghost-button", onClick: onReset }, "Reset"),
    ),
  );
}

function TimerCard({ running, seconds, total, paceLabel, onToggle, onReset }) {
  return h(
    "article",
    { className: "panel timer-card" },
    h("h3", null, "생명주기 타이머"),
    h("p", { className: "timer-value" }, formatSeconds(seconds)),
    h("p", { className: "muted" }, running ? "useEffect interval 실행 중" : "cleanup 완료"),
    h(
      "div",
      { className: "timer-summary" },
      h("span", null, `총 카운트: ${total}`),
      h("span", null, `속도: ${paceLabel}`),
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

function App(_props, runtime) {
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
      { className: "hero panel" },
      h("span", { className: "hero-badge" }, "Week 5 Custom React Core"),
      h("h1", null, "카운터 2개와 타이머로 보는 커스텀 React 코어"),
      h(
        "p",
        { className: "hero-copy" },
        "상태는 루트에서만 관리하고, 자식 컴포넌트는 props만 받아 렌더링합니다.",
      ),
    ),
    h(
      "section",
      { className: "content-grid" },
      CounterCard({
        title: "Alpha Counter",
        value: scores.alpha,
        total: summary.totalScore,
        onDecrease: () => changeScore("alpha", -1),
        onIncrease: () => changeScore("alpha", 1),
        onReset: () => resetScore("alpha"),
      }),
      CounterCard({
        title: "Beta Counter",
        value: scores.beta,
        total: summary.totalScore,
        onDecrease: () => changeScore("beta", -1),
        onIncrease: () => changeScore("beta", 1),
        onReset: () => resetScore("beta"),
      }),
      TimerCard({
        running,
        seconds,
        total: summary.totalScore,
        paceLabel: summary.paceLabel,
        onToggle: () => setRunning((current) => !current),
        onReset: resetTimer,
      }),
    ),
    h("p", { className: "footnote" }, `현재 render 횟수: ${runtime.renderCount}`),
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
