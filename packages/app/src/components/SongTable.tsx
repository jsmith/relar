import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Song } from "../shared/types";
import { usePlayer } from "../player";
import classNames from "classnames";
import {
  MdMusicNote,
  MdPlayArrow,
  MdMoreVert,
  MdEdit,
  MdDelete,
  MdPlaylistAdd,
} from "react-icons/md";
import { MetadataEditor } from "./MetadataEditor";
import { useModal } from "react-modal-hook";
import { LikedIcon } from "./LikedIcon";
import { IconButton } from "./IconButton";
import useDropdownMenuImport from "react-accessible-dropdown-menu-hook";
import { ContextMenu, ContextMenuItem } from "./ContextMenu";
import { useConfirmAction } from "../confirm-actions";
import useResizeObserver from "use-resize-observer";
import { useLikeSong } from "../queries/songs";
import { useFirebaseUpdater } from "../watcher";
import { fmtMSS } from "../utils";
import { Link } from "./Link";
import { routes } from "../routes";
import { link } from "../classes";
import { AddToPlaylistEditor } from "../sections/AddToPlaylistModal";
import { Skeleton } from "./Skeleton";

// I really wish I didn't have to do this but for some reason this is the only thing that works
// Before I was getting an issue in production
let useDropdownMenu = useDropdownMenuImport;

if ((useDropdownMenu as any).default) {
  useDropdownMenu = (useDropdownMenu as any).default;
}

// console.log(reactAccessibleDropdown);
// const useDropdownMenu: typeof reactAccessibleDropdown.default = (reactAccessibleDropdown.default as any)
//   .default;

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
    <Cell className="px-2 py-4">
      <div className="pr-3">
        <Skeleton width={width} />
      </div>
    </Cell>
  );
};

export const TextCell = ({
  text,
  className,
  title,
}: {
  text?: React.ReactNode;
  className: string;
  title?: string;
}) => {
  return (
    <Cell className={className}>
      <div title={title}>{text}</div>
    </Cell>
  );
};

export interface SongTableItem extends Omit<ContextMenuItem, "onClick" | "props"> {
  onClick: (song: firebase.firestore.QueryDocumentSnapshot<Song>) => void;
}

export interface SongTableRowProps {
  /**
   * The song. `undefined` means it is loading.
   */
  song: firebase.firestore.QueryDocumentSnapshot<Song>;
  setSong: (song: firebase.firestore.QueryDocumentSnapshot<Song>) => void;
  actions: SongTableItem[] | undefined;
}

export const SongTableRow = ({ song, setSong, actions }: SongTableRowProps) => {
  const [focusedPlay, setFocusedPlay] = useState(false);
  const [showEditorModal, hideEditorModal] = useModal(() => (
    <MetadataEditor setDisplay={() => hideEditorModal()} song={song} onSuccess={() => {}} />
  ));
  const [showAddPlaylistModal, hideAddPlaylistModal] = useModal(() => (
    <AddToPlaylistEditor setDisplay={() => hideAddPlaylistModal()} song={song} />
  ));
  const { confirmAction } = useConfirmAction();
  const [setLiked] = useLikeSong(song);
  const [data] = useFirebaseUpdater(song);

  const contextMenuItems = useMemo(() => {
    const extraItems: ContextMenuItem[] =
      actions?.map((action, i) => ({
        ...action,
        onClick: () => {
          action.onClick(song);
        },
      })) ?? [];

    return [
      {
        label: "Add To Playlist",
        icon: MdPlaylistAdd,
        onClick: () => {
          showAddPlaylistModal();
        },
      },
      {
        label: "Edit Info",
        icon: MdEdit,
        onClick: () => {
          showEditorModal();
        },
      },
      {
        label: "Delete",
        icon: MdDelete,
        onClick: async () => {
          const confirmed = await confirmAction({
            title: `Delete ${data.title}`,
            subtitle: "Are you sure you want to delete this song?",
            confirmText: "Delete Song",
          });

          if (confirmed) {
            await song.ref.delete();
          }
        },
      },
      ...extraItems,
    ];
  }, [actions, confirmAction, data.title, showAddPlaylistModal, showEditorModal, song]);

  return (
    <tr className="group hover:bg-gray-300 text-gray-700 text-sm" onClick={() => setSong(song)}>
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

        <ContextMenu
          button={(props) => (
            <IconButton
              icon={MdMoreVert}
              className="group-hover:w-8 focus:w-8 w-0 overflow-hidden py-1 pl-1 flex-shrink-0"
              hoverClassName="hover:bg-gray-400"
              iconClassName="w-0 w-6 h-6"
              {...props}
            />
          )}
          items={contextMenuItems}
          className="transform -translate-x-4"
        />
      </Cell>
      {/* <TextCell text={data.title} /> */}
      <TextCell
        title={data.artist}
        text={
          data.artist && (
            <Link
              className={link({ color: "" })}
              label={data.artist}
              route={routes.artist}
              params={{ artistName: data.artist }}
            />
          )
        }
        className="h-12 truncate"
      />
      <TextCell
        title={data.albumName}
        text={
          data.albumName && (
            <Link
              className={link({ color: "" })}
              label={data.albumName}
              route={routes.album}
              params={{ albumId: data.albumId }}
            />
          )
        }
        className="h-12 truncate"
      />
      <TextCell text={`${data.played ?? ""}`} className="h-12 truncate" />
      <TextCell text={fmtMSS(data.duration / 1000)} className="h-12 truncate" />
      <Cell className="h-12 truncate">
        <LikedIcon liked={data.liked} setLiked={setLiked} />
      </Cell>
    </tr>
  );
};

export interface SongTableProps {
  /**
   * The songs. Passing in `undefined` indicates that the songs are still loading.
   */
  songs?: Array<firebase.firestore.QueryDocumentSnapshot<Song>>;
  loadingRows?: number;
  container: HTMLElement | null;
  actions?: SongTableItem[];
}

// Great tutorial on recycling DOM elements -> https://medium.com/@moshe_31114/building-our-recycle-list-solution-in-react-17a21a9605a0
export const SongTable = ({ songs: docs, loadingRows = 5, container, actions }: SongTableProps) => {
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

    return result;
  }, [offsetTop, containerHeight, scrollTop, rowHeight, rowCount]);

  // useEffect(() => {
  //   console.debug(`Displaying rows ${start} -> ${end}`);
  // }, [start, end]);

  const rows = useMemo(() => {
    if (!docs) {
      return Array(loadingRows)
        .fill(undefined)
        .map((_, i) => (
          <tr key={i}>
            <LoadingCell />
            <LoadingCell />
            <LoadingCell />
          </tr>
        ));
    }
    return docs.slice(start, end + 1).map((song, i) => (
      // The key is the index rather than the song ID as the song could > 1
      <SongTableRow song={song} setSong={setSong} key={start + i} actions={actions} />
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingRows, docs, start, end]);

  return (
    <table className="text-gray-800 table-fixed w-full" ref={t}>
      <thead>
        <tr>
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
