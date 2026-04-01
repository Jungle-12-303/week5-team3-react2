export function haveDepsChanged(previousDeps, nextDeps) {
  if (!previousDeps || !nextDeps) {
    return true;
  }

  if (previousDeps.length !== nextDeps.length) {
    return true;
  }

  return nextDeps.some((dep, index) => !Object.is(dep, previousDeps[index]));
}
