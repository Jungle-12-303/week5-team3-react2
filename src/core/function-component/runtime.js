let currentInstance = null;

export function assertHookContext(hookName) {
  if (!currentInstance) {
    throw new Error(`${hookName} must be called during root component render.`);
  }
}

export function getCurrentInstance() {
  return currentInstance;
}

export function setCurrentInstance(instance) {
  currentInstance = instance;
}
