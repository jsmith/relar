// Using small event library since creating your own event lib is actually error prone
import mitt from "mitt";

export interface Events {
  [name: string]: any[];
}

export const createEmitter = <E extends Events>() => {
  const emitter = mitt();

  return {
    on: <K extends keyof E & string>(key: K, listener: (...args: E[K]) => void): (() => void) => {
      const wrapper = (args: any) => {
        listener(...args);
      };
      emitter.on(key, wrapper);

      return () => emitter.off(key, wrapper);
    },
    emit: <K extends keyof E & string>(key: K, ...args: E[K]) => {
      emitter.emit(key, args);
    },
  };
};
