import { FunctionComponent } from "./core/function-component.js";
import { RootApp } from "./RootApp.js";

export function mountApp(container = document.querySelector("#app")) {
  if (!container) {
    throw new Error("Mount target #app was not found.");
  }

  const app = new FunctionComponent(RootApp, container);
  app.mount();
  return app;
}

if (document.querySelector("#app") && !window.__CUSTOM_REACT_SKIP_AUTO_MOUNT__) {
  mountApp();
}
