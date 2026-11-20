export function createSnapshotStore<T>(initial: T) {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    publish(next: T) {
      snapshot = next;
      listeners.forEach((listener) => listener());
    },
  };
}
