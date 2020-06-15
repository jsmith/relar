import React, { useState, useEffect } from "react";
import ReactSidebar from "react-sidebar";
import classNames from "classnames";

const mql = window.matchMedia(`(min-width: 800px)`);

export const Sidebar = (
  props: { sidebar: JSX.Element; className?: string } & React.Props<null>,
) => {
  const [docked, setDocked] = useState(mql.matches);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mediaQueryChanged = () => {
      setOpen(false);
      setDocked(mql.matches);
    };

    mql.addListener(mediaQueryChanged);
    return () => mql.removeListener(mediaQueryChanged);
  }, []);

  return (
    <div className={classNames("relative", props.className)}>
      <ReactSidebar
        sidebar={props.sidebar}
        open={open}
        docked={docked}
        onSetOpen={() => setOpen(true)}
      >
        {props.children}
      </ReactSidebar>
    </div>
  );
};
