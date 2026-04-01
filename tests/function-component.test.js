import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import {
  FunctionComponent,
  useEffect,
  useMemo,
  useState,
} from "../src/core/function-component.js";
import { h } from "../src/core/vdom.js";

function installDom() {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>");
  global.window = dom.window;
  global.document = dom.window.document;
  global.Node = dom.window.Node;
  global.queueMicrotask = queueMicrotask;
  return dom;
}

test("useState persists state and batches updates in one microtask", async () => {
  const dom = installDom();
  let bumpBoth = null;

  function App(_props, runtime) {
    const [alpha, setAlpha] = useState(0);
    const [beta, setBeta] = useState(0);

    bumpBoth = () => {
      setAlpha((value) => value + 1);
      setBeta((value) => value + 1);
    };

    return h(
      "div",
      { "data-renders": String(runtime.renderCount) },
      h("span", { id: "alpha" }, alpha),
      h("span", { id: "beta" }, beta),
    );
  }

  const root = document.querySelector("#root");
  const instance = new FunctionComponent(App, root);
  instance.mount();

  bumpBoth();
  await Promise.resolve();

  assert.equal(root.querySelector("#alpha").textContent, "1");
  assert.equal(root.querySelector("#beta").textContent, "1");
  assert.equal(root.firstChild.getAttribute("data-renders"), "2");
  dom.window.close();
});

test("useEffect cleanup runs when dependencies change and useMemo caches values", async () => {
  const dom = installDom();
  const effectLog = [];
  let setRunning = null;
  let memoRuns = 0;

  function App() {
    const [running, updateRunning] = useState(false);
    setRunning = updateRunning;

    const label = useMemo(() => {
      memoRuns += 1;
      return running ? "RUN" : "STOP";
    }, [running]);

    useEffect(() => {
      effectLog.push(`effect:${label}`);
      return () => {
        effectLog.push(`cleanup:${label}`);
      };
    }, [label]);

    return h("p", null, label);
  }

  const root = document.querySelector("#root");
  const instance = new FunctionComponent(App, root);
  instance.mount();

  setRunning(true);
  await Promise.resolve();

  assert.deepEqual(effectLog, ["effect:STOP", "cleanup:STOP", "effect:RUN"]);
  assert.equal(memoRuns, 2);
  dom.window.close();
});
