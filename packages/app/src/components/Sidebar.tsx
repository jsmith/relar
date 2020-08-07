import React, { useState, useEffect, Ref, MutableRefObject, LegacyRef } from "react";
import classNames from "classnames";

const mql = window.matchMedia(`(min-width: 800px)`);

export const Sidebar = (
  props: {
    sidebar: JSX.Element;
    className?: string;
  } & React.Props<null>,
) => {
  const [docked, setDocked] = useState(mql.matches);
  // const [open, setOpen] = useState(false);

  useEffect(() => {
    const mediaQueryChanged = () => {
      // setOpen(false);
      setDocked(mql.matches);
    };

    mql.addListener(mediaQueryChanged);
    return () => mql.removeListener(mediaQueryChanged);
  }, []);

  // TODO slide menu https://github.com/negomi/react-burger-menu

  return (
    <div className={classNames("flex", props.className)}>
      <div>{props.sidebar}</div>
      <div className="flex-grow relative">{props.children}</div>
      {/* <ReactSidebar
        sidebar={props.sidebar}
        open={open}
        docked={docked}
        onSetOpen={() => setOpen(true)}
        contentId={props.contentId}
      > */}
      {/* </ReactSidebar> */}
    </div>
  );
};
