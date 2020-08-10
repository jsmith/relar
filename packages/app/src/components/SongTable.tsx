import React, { useMemo, useState, MutableRefObject, useEffect, useRef, useCallback } from "react";
import { Song } from "../shared/types";
import { usePlayer } from "../player";
import classNames from "classnames";
import { MdMusicNote, MdPlayArrow, MdMoreVert, MdEdit, MdDelete } from "react-icons/md";
import { MetadataEditor } from "./MetadataEditor";
import { useModal } from "react-modal-hook";
import { LikedIcon } from "./LikedIcon";
import { IconButton } from "./IconButton";
import useDropdownMenuImport from "react-accessible-dropdown-menu-hook";
import { ContextMenu } from "./ContextMenu";
import { useConfirmAction } from "../confirm-actions";
import useResizeObserver from "use-resize-observer";
import { useLikeSong } from "../queries/songs";
import { useFirebaseUpdater } from "../watcher";

// I really wish I didn't have to do this but for some reason this is the only thing that works
// Before I was getting an issue in production
let useDropdownMenu = useDropdownMenuImport;

if ((useDropdownMenu as any).default) {
  useDropdownMenu = (useDropdownMenu as any).default;
}

// console.log(reactAccessibleDropdown);
// const useDropdownMenu: typeof reactAccessibleDropdown.default = (reactAccessibleDropdown.default as any)
//   .default;

export interface SongsTableProps {
  /**
   * The songs. Passing in `undefined` indicates that the songs are still loading.
   */
  songs?: Array<firebase.firestore.QueryDocumentSnapshot<Song>>;
  loadingRows?: number;
  container: HTMLElement | null;
}

export const HeaderCol = ({
  label,
  width,
  className,
}: {
  label: React.ReactNode;
  width: string;
  className?: string;
}) => {
  return (
    <th
      className={classNames(
        "border-b border-gray-700 border-opacity-25 text-left text-gray-800 text-xs font-medium uppercase tracking-wider",
        className,
      )}
      style={{ width }}
    >
      {label}
    </th>
  );
};

export const Cell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <td
      className={classNames(
        "h-12 whitespace-no-wrap border-b border-gray-200 border-opacity-25 cursor-pointer",
        className,
      )}
    >
      {children}
    </td>
  );
};

export const LoadingCell = ({ width }: { width?: number }) => {
  return (
    <Cell className="px-6 py-4">
      <div className="pr-3">{/* <Skeleton width={width} /> */}</div>
    </Cell>
  );
};

export const TextCell = ({
  text,
  className,
  title,
}: {
  text?: string;
  className: string;
  title?: string;
}) => {
  return (
    <Cell className={className}>
      <div title={title}>{text}</div>
    </Cell>
  );
};

export interface SongTableRowProps {
  /**
   * The song. `undefined` means it is loading.
   */
  song: firebase.firestore.QueryDocumentSnapshot<Song> | undefined;
  setSong: (song: firebase.firestore.QueryDocumentSnapshot<Song>) => void;
}

export const SongTableRow = ({ song, setSong }: SongTableRowProps) => {
  const { buttonProps, itemProps, isOpen, setIsOpen } = useDropdownMenu(2);
  const [focusedPlay, setFocusedPlay] = useState(false);
  const [showEditorModal, hideEditorModal] = useModal(() => (
    <MetadataEditor display={true} setDisplay={() => hideEditorModal()} song={defined} />
  ));
  const { confirmAction } = useConfirmAction();
  const [setLiked] = useLikeSong(song);
  const [data] = useFirebaseUpdater(song);

  if (!song || !data) {
    return (
      <tr>
        <LoadingCell />
        <LoadingCell />
        <LoadingCell />
      </tr>
    );
  }

  const defined = song;
  return (
    <tr
      className="group hover:bg-gray-300 text-gray-700 text-sm"
      key={song.id}
      onClick={() => setSong(defined)}
    >
      <Cell className="flex space-x-2 items-center h-12">
        <div className="w-5 h-5">
          <MdMusicNote
            className={classNames(
              "w-5 h-5 group-hover:opacity-0 absolute",
              focusedPlay && "opacity-0",
            )}
          />
          <button
            title={`Play ${data.title}`}
            className="focus:opacity-100 group-hover:opacity-100 opacity-0"
            onFocus={() => setFocusedPlay(true)}
            onBlur={() => setFocusedPlay(false)}
            onClick={() => {}}
          >
            <MdPlayArrow className="w-5 h-5" />
          </button>
        </div>

        <div title={data.title} className="truncate flex-grow">
          {data.title}
        </div>
        <IconButton
          icon={MdMoreVert}
          className="group-hover:w-8 focus:w-8 w-0 overflow-hidden py-1 pl-1 flex-shrink-0"
          hoverClassName="hover:bg-gray-400"
          iconClassName="w-0 w-6 h-6"
          {...buttonProps}
          onClick={(e) => {
            e.stopPropagation();
            buttonProps.onClick && buttonProps.onClick(e);
            setIsOpen(true);
          }}
        />
        <ContextMenu
          items={[
            {
              label: "Edit Info",
              icon: MdEdit,
              onClick: () => {
                showEditorModal();
                setIsOpen(false);
              },
              props: itemProps[0],
            },
            {
              label: "Delete",
              icon: MdDelete,
              onClick: async () => {
                setIsOpen(false);
                const confirmed = await confirmAction({
                  title: `Delete ${data.title}`,
                  subtitle: "Are you sure you want to delete this song?",
                  confirmText: "Delete Song",
                });

                if (confirmed) {
                  await song.ref.delete();
                }
              },
              props: itemProps[1],
            },
          ]}
          isOpen={isOpen}
          className="transform -translate-x-4"
        />
      </Cell>
      {/* <TextCell text={data.title} /> */}
      <TextCell title={data.artist} text={data.artist} className="h-12 truncate" />
      <TextCell title={data.albumName} text={data.albumName} className="h-12 truncate" />
      <TextCell text={`${data.played ?? ""}`} className="h-12 truncate" />
      <TextCell text={"4:10"} className="h-12 truncate" />
      <Cell className="h-12 truncate">
        <LikedIcon liked={data.liked} setLiked={setLiked} />
      </Cell>
    </tr>
  );
};

// Great tutorial on recycling DOM elements -> https://medium.com/@moshe_31114/building-our-recycle-list-solution-in-react-17a21a9605a0
export const SongTable = ({ songs: docs, loadingRows = 20, container }: SongsTableProps) => {
  const rowHeight = 48;
  const headerHeight = 44;
  const [offsetTop, setOffsetTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [_, setSong] = usePlayer();
  const t = useRef<HTMLTableElement | null>(null);
  useResizeObserver<HTMLElement>({
    ref: useMemo(() => ({ current: container }), [container]),
    onResize: useCallback((e) => {
      setContainerHeight(e.height ?? 0);
      // console.log("Offset", t.current?.offsetTop);
      setOffsetTop((t.current?.offsetTop ?? 0) + headerHeight);
    }, []),
  });

  useEffect(() => {
    if (!container) {
      return;
    }

    container.onscroll = () => {
      setScrollTop(container.scrollTop);
    };
  }, [container]);

  const rowCount = useMemo(() => docs?.length ?? 0, [docs]);

  const { start, end, placeholderTopHeight, placeholderBottomHeight } = useMemo(() => {
    const offTop = scrollTop - offsetTop;
    const height = rowHeight * rowCount;
    const offBottom = height - offTop - containerHeight;
    // console.log(
    //   `Offset: ${offsetTop}, container: ${containerHeight}, scroll: ${scrollTop}, units: ${rowCount}, unit: ${rowHeight}, offTop: ${offTop}, offBottom: ${offBottom}`,
    // );

    const unitsCompletelyOffScreenTop = offTop > 0 ? Math.floor(offTop / rowHeight) : 0;

    const unitsCompletelyOffScreenBottom = offBottom > 0 ? Math.floor(offBottom / rowHeight) : 0;

    const result = {
      placeholderTopHeight: unitsCompletelyOffScreenTop * rowHeight,
      placeholderBottomHeight: unitsCompletelyOffScreenBottom * rowHeight,
      start: unitsCompletelyOffScreenTop,
      end: rowCount - unitsCompletelyOffScreenBottom,
    };

    // console.log(result);
    return result;
  }, [offsetTop, containerHeight, scrollTop, rowHeight, rowCount]);

  const rows = useMemo(() => {
    const snapshots: Array<firebase.firestore.QueryDocumentSnapshot<Song> | undefined> = docs
      ? docs
      : Array(loadingRows).fill(undefined);

    // Having the key == index is very important to prevent DOM performance issues I think
    return snapshots
      .slice(start, end + 1)
      .map((song, i) => <SongTableRow song={song} setSong={setSong} key={i} />);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingRows, docs, start, end]);

  return (
    <table className="text-gray-800 table-fixed w-full" ref={t}>
      <thead>
        <tr>
          {/* <HeaderCol label={""} className={""} /> */}
          <HeaderCol width="42%" label="Title" className="py-3" />
          <HeaderCol width="32%" label="Artist" className="py-3" />
          <HeaderCol width="26%" label="Album" className="py-3" />
          <HeaderCol width="50px" label={<MdMusicNote className="w-5 h-5" />} className="py-3" />
          <HeaderCol width="60px" label="" className="py-3" />
          <HeaderCol width="90px" label="" className="py-3" />
        </tr>
      </thead>
      <tbody>
        <tr style={{ height: `${placeholderTopHeight}px` }} />
        {rows}
        <tr style={{ height: `${placeholderBottomHeight}px` }} />
      </tbody>
    </table>
  );
};
