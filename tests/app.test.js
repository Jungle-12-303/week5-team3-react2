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

  click(findButtonByText("+1"));
  await Promise.resolve();

  click(document.querySelectorAll(".primary-button")[1]);
  await Promise.resolve();

  const valuesAfterClicks = [...document.querySelectorAll(".counter-value")].map(
    (node) => node.textContent.trim(),
  );
  assert.deepEqual(valuesAfterClicks, ["1", "1"]);

  click(findButtonByText("Start"));
  await new Promise((resolve) => setTimeout(resolve, 1100));

  const timerValue = document.querySelector(".timer-value").textContent.trim();
  assert.equal(timerValue, "00:01");

  click(findButtonByText("Pause"));
  await Promise.resolve();

  assert.match(document.body.textContent, /총 카운트: 2/);
  assert.match(document.body.textContent, /속도:/);

  app.unmount();
  dom.window.close();
});
