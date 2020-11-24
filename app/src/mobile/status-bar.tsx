import React, { useCallback, useContext, useEffect, useRef } from "react";
import { Plugins, StatusBarStyle } from "@capacitor/core";
import { createContext } from "react";
const { StatusBar } = Plugins;

const StatusBarContext = createContext<{
  setTemporary: (style: StatusBarStyle) => () => void;
  setDefault: (style: StatusBarStyle) => void;
}>({
  setDefault: () => {},
  setTemporary: () => () => {},
});

export const StatusBarProvider = ({ children }: { children: React.ReactNode }) => {
  const style = useRef<StatusBarStyle>();
  const temporary = useRef<StatusBarStyle>();

  const setTemporary = useCallback((temp) => {
    temporary.current = temp;
    StatusBar.setStyle({ style: temp });
    return () => {
      style.current && StatusBar.setStyle({ style: style.current });
      temporary.current = undefined;
    };
  }, []);

  const setDefault = useCallback((def) => {
    style.current = def;
    !temporary.current && StatusBar.setStyle({ style: def });
  }, []);

  return (
    <StatusBarContext.Provider value={{ setTemporary, setDefault }}>
      {children}
    </StatusBarContext.Provider>
  );
};

export const useStatusBarProvider = () => useContext(StatusBarContext);

export const useTemporaryStatusBar = ({ style, use }: { style: StatusBarStyle; use: boolean }) => {
  const { setTemporary } = useStatusBarProvider();

  useEffect(() => {
    if (use) {
      return setTemporary(style);
    }
  }, [setTemporary, style, use]);
};

export const useDefaultStatusBar = (style: StatusBarStyle) => {
  const { setDefault } = useStatusBarProvider();

  useEffect(() => {
    console.log("DEFAULT STYLE", style);
    setDefault(style);
  }, [setDefault, style]);
};
