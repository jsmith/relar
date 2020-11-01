import classNames from "classnames";
import React, { useEffect } from "react";
import { useRef } from "react";
import AriaModal from "react-aria-modal";
import { useHotkeys } from "react-hotkeys-hook";
import { HiOutlineX } from "react-icons/hi";
import { useModal } from "react-modal-hook";
import { link } from "./classes";
import { Shortcut } from "./components/Shortcut";
import { createEmitter } from "./events";
import { useLikeSong } from "./queries/songs";
import { useQueue } from "./queue";
import { navigateTo, NavigatorRoutes } from "./routes";
import { Feedback } from "./sections/Feedback";

const NAVIGATION_TIMEOUT = 1000;

const navigateIfLessThanTimeout = (
  whenGPressed: { current: number | undefined },
  route: keyof NavigatorRoutes,
  ifNot?: () => void,
) => {
  if (whenGPressed.current === undefined) {
    ifNot && ifNot();
    return;
  }

  const duration = Date.now() - whenGPressed.current;
  if (duration > NAVIGATION_TIMEOUT) {
    ifNot && ifNot();
    return;
  }

  // Reset after navigation
  whenGPressed.current = undefined;

  navigateTo(route);
};

type Shortcut = [string | string[], string];

const col1: Shortcut[] = [
  ["space", "Play or pause"],
  ["←", "Go to previous song"],
  ["→", "Go to next song"],
  [["Shift", "←"], "Rewind 10 seconds"],
  [["Shift", "→"], "Fast forward 10 seconds"],
  ["S", "Toggle shuffle"],
  ["R", "Toggle repeat"],
  ["L", "Like the playing track"],
  ["?", "Show keyboard shortcuts"],
  [["Shift", "Q"], "Toggle queue open or closed"],
  ["-", "Decrease volume"],
  ["=", "Increase volume"],
];

const col2: Shortcut[] = [
  ["G then S", "Songs"],
  ["G then A", "Artists"],
  ["G then B", "Albums"],
  ["G then G", "Genres"],
  ["G then H", "Home"],
  ["G then P", "Playlists"],
];

export const Shortcuts = ({
  shortcuts,
  className,
}: {
  shortcuts: Shortcut[];
  className?: string;
}) => {
  return (
    <div className={classNames(className, "flex space-x-2")}>
      <div className="space-y-1">
        {shortcuts.map(([shortcut, label]) => (
          <div key={label} className="flex justify-end space-x-1">
            {(typeof shortcut === "string" ? [shortcut] : shortcut).map((key) => (
              <Shortcut key={key} text={key} />
            ))}
          </div>
        ))}
      </div>

      {/* This custom padding ensures that the shortcuts and text are lined up */}
      <div className="space-y-2" style={{ paddingTop: "0.2rem" }}>
        {shortcuts.map(([_, label]) => (
          <div key={label} className="">
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

const emitter = createEmitter<{ open: [] }>();

export const openShortcuts = () => emitter.emit("open");

export const useShortcuts = ({
  openSearch,
  toggleQueue,
}: {
  openSearch: () => void;
  toggleQueue: () => void;
}) => {
  const {
    setVolume,
    toggleState,
    previous,
    next,
    toggleShuffle,
    toggleMode,
    songInfo,
    deltaCurrentTime,
  } = useQueue();
  const setLiked = useLikeSong(songInfo?.song);
  const whenG = useRef<number>();

  const [feedbackShow, feedbackHide] = useModal(() => <Feedback onExit={feedbackHide} />);
  const [show, hide] = useModal(() => (
    <AriaModal
      titleText="Search"
      onExit={hide}
      initialFocus="#modal-close"
      getApplicationNode={() => document.getElementById("root")!}
      dialogClass="rounded-lg bg-white px-5 py-4 relative"
      underlayClass="flex items-center justify-center"
    >
      <h1 className="text-xl font-bold">Keyboard Shortcuts</h1>
      <p className="text-gray-700 text-xs">
        Anything missing? Let me know using the{" "}
        <button
          onClick={() => {
            hide();
            feedbackShow();
          }}
          className={link()}
          id="feedback"
        >
          feedback tool
        </button>
      </p>
      <div className="flex text-xs space-x-2 mt-3">
        <Shortcuts shortcuts={col1} />
        <Shortcuts shortcuts={col2} />
      </div>
      <button id="modal-close" className="absolute right-0 top-0 my-3 mx-4" onClick={hide}>
        <HiOutlineX className="w-4 h-4" />
      </button>
    </AriaModal>
  ));

  useHotkeys("right", next);
  useHotkeys("left", previous);
  useHotkeys("shift+right", () => deltaCurrentTime(10));
  useHotkeys("shift+left", () => deltaCurrentTime(-10));

  useHotkeys(
    "space",
    (e) => {
      // This preventDefault is super important as we are taking
      // over space to start/stop music
      e.preventDefault();
      toggleState();
    },
    [toggleState],
  );
  useHotkeys("/", openSearch);
  useHotkeys("shift+q", toggleQueue);

  useHotkeys("g", () => {
    const now = Date.now();
    navigateIfLessThanTimeout(whenG, "genres", () => {
      console.log("CURRENT");
      whenG.current = now;
    });
  });

  useHotkeys("-", () => setVolume((volume) => volume - 2));
  useHotkeys("=", () => setVolume((volume) => volume + 2));

  useHotkeys("s", () => navigateIfLessThanTimeout(whenG, "songs"));
  useHotkeys("a", () => navigateIfLessThanTimeout(whenG, "artists"));
  useHotkeys("b", () => navigateIfLessThanTimeout(whenG, "albums"));
  useHotkeys("h", () => navigateIfLessThanTimeout(whenG, "home"));
  useHotkeys("p", () => navigateIfLessThanTimeout(whenG, "playlists"));
  useHotkeys("shift+/", show); // aka "?"
  useHotkeys("r", toggleMode);
  useHotkeys("s", toggleShuffle);
  useHotkeys(
    "l",
    () => {
      console.log("LIKE", songInfo?.song.liked);
      if (!songInfo?.song) return;
      setLiked(!songInfo.song.liked);
    },
    [songInfo],
  );

  useEffect(() => {
    return emitter.on("open", show);
  }, [show]);
};
