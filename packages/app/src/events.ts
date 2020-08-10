export interface Events {
  [name: string]: any[];
}

export const createEmitter = <E extends Events>() => {
  const listeners: Partial<{ [K in keyof E]: Array<(...args: E[K]) => void> }> = {};

  return {
    on: <K extends keyof E>(key: K, listener: (...args: E[K]) => void): (() => void) => {
      if (!listeners[key]) {
        listeners[key] = [];
      }

      listeners[key]!.push(listener);

      return () => listeners[key]!.splice(listeners[key]!.indexOf(listener), 1);
    },
    emit: <K extends keyof E>(key: K, ...args: E[K]) => {
      if (listeners[key]) {
        listeners[key]!.forEach((listener) => listener(...args));
      }
    },
  };
};
