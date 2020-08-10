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

      // Ok so I was originally using splice but for some reason that was causing unexpected bugs
      // Soooo, I am now using delete :)
      return () => delete listeners[key]![listeners[key]!.indexOf(listener)];
    },
    emit: <K extends keyof E>(key: K, ...args: E[K]) => {
      if (listeners[key]) {
        listeners[key]!.forEach((listener) => listener(...args));
      }
    },
  };
};
