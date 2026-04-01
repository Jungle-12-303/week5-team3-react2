import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

function installDom() {
  const dom = new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>", {
    url: "http://localhost/",
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.Node = dom.window.Node;
  global.queueMicrotask = queueMicrotask;
  global.window.__CUSTOM_REACT_SKIP_AUTO_MOUNT__ = true;
  return dom;
}

function findButtonByText(text) {
  return [...document.querySelectorAll("button")].find(
    (button) => button.textContent.trim() === text,
  );
}

function click(element) {
  element.dispatchEvent(
    new window.MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    }),
  );
}

test("app flow reacts to clicks and timer effect", async () => {
  const dom = installDom();
  const { mountApp } = await import("../src/app.js");
  const app = mountApp(document.querySelector("#app"));

  assert.match(document.body.textContent, /Custom React Stopwatch/);
  assert.match(document.body.textContent, /구간기록|구간 기록/);

  click(findButtonByText("시작"));
  await new Promise((resolve) => setTimeout(resolve, 120));

  click(findButtonByText("구간 기록"));
  await Promise.resolve();

  assert.ok(document.querySelectorAll(".lap-row").length >= 1);
  assert.match(document.body.textContent, /01/);

  click(findButtonByText("정지"));
  await Promise.resolve();

  click(findButtonByText("초기화"));
  await Promise.resolve();

  assert.equal(document.querySelectorAll(".lap-row").length, 0);
  assert.match(document.body.textContent, /00:00.00/);

  app.unmount();
  dom.window.close();
});
