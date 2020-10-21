import React, { useMemo, useState, CSSProperties, useRef, useCallback } from "react";
import classNames from "classnames";
import {
  MdMusicNote,
  MdPlayArrow,
  MdMoreVert,
  MdEdit,
  MdDelete,
  MdPlaylistAdd,
  MdRemoveFromQueue,
  MdAddToQueue,
} from "react-icons/md";
import { MetadataEditor } from "../../sections/MetadataEditor";
import { useModal } from "react-modal-hook";
import { LikedIcon } from "../../components/LikedIcon";
import { IconButton } from "../../components/IconButton";
import { ContextMenu, ContextMenuItem } from "../../components/ContextMenu";
import { useConfirmAction } from "../../confirm-actions";
import { useLikeSong, useDeleteSong } from "../../queries/songs";
import { fmtMSS } from "../../utils";
import { Link } from "../../components/Link";
import { getAlbumRouteParams, routes } from "../../routes";
import { link } from "../../classes";
import { AddToPlaylistEditor } from "./AddToPlaylistModal";
import Skeleton from "react-loading-skeleton";
import { useQueue, SetQueueSource, SongInfo, checkQueueItemsEqual } from "../../queue";
import { Audio } from "@jsmith21/svg-loaders-react";
import RecycledList from "react-recycled-scrolling";

const widths = {
  title: { flexGrow: 1, minWidth: 0 },
  artist: { flex: "0 0 24%" },
  album: { flex: "0 0 18%" },
  songCount: { flex: "0 0 50px" },
  dateAdded: { flex: "0 0 100px" },
  duration: { flex: "0 0 60px" },
  liked: { flex: "0 0 50px" },
};

export const HeaderCol = ({
  label,
  className,
  style,
}: {
  label: React.ReactNode;
  className?: string;
  style: CSSProperties;
}) => {
  return (
    <div
      className={classNames(
        "text-left text-gray-800 text-xs uppercase tracking-wider font-bold",
        className,
      )}
      style={style}
    >
      {label}
    </div>
  );
};

export const Cell = ({
  children,
  className,
  style,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  style: CSSProperties;
  title?: string;
}) => {
  return (
    <div
      className={classNames(
        "whitespace-no-wrap border-b border-gray-200 border-opacity-25 cursor-pointer",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
};

export const LoadingCell = ({ width }: { width?: number }) => {
  return (
    <Cell className="px-2 py-4" style={{}}>
      <div className="pr-3">
        <Skeleton width={width} />
      </div>
    </Cell>
  );
};

export interface SongTableItem<T extends SongInfo>
  extends Omit<ContextMenuItem, "onClick" | "props"> {
  onClick: (song: T, index: number) => void;
}

export interface SongTableRowProps<T extends SongInfo> {
  song: T;
  setSong: (song: T) => void;
  actions: SongTableItem<T>[] | undefined;
  mode: "regular" | "condensed";
  playing: boolean;
  paused: boolean;
  children?: React.ReactNode;
  includeDateAdded?: boolean;
  index: number;
}

export const SongTableRow = <T extends SongInfo>({
  song,
  setSong,
  actions,
  mode,
  playing,
  paused,
  includeDateAdded,
  index,
}: SongTableRowProps<T>) => {
  const [focusedPlay, setFocusedPlay] = useState(false);
  const [showEditorModal, hideEditorModal] = useModal(() => (
    <MetadataEditor setDisplay={() => hideEditorModal()} song={song} onSuccess={() => {}} />
  ));
  const [showAddPlaylistModal, hideAddPlaylistModal] = useModal(() => (
    <AddToPlaylistEditor setDisplay={() => hideAddPlaylistModal()} song={song} />
  ));
  const { confirmAction } = useConfirmAction();
  const setLiked = useLikeSong(song);
  const deleteSong = useDeleteSong();

  const contextMenuItems = useMemo(() => {
    const extraItems: ContextMenuItem[] =
      actions?.map((action, i) => ({
        ...action,
        onClick: () => {
          action.onClick(song, index);
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
            title: `Delete ${song.title}`,
            subtitle: "Are you sure you want to delete this song?",
            confirmText: "Delete Song",
          });

          if (confirmed) {
            deleteSong(song.id);
          }
        },
      },
      ...extraItems,
    ];
  }, [actions, confirmAction, deleteSong, index, showAddPlaylistModal, showEditorModal, song]);

  const artist = song.artist && (
    <Link
      className={classNames(
        link({ color: "" }),
        "truncate block",
        mode === "condensed" && "text-2xs",
      )}
      label={song.artist}
      route={routes.artist}
      params={{ artistName: song.artist }}
    />
  );

  const album = song.albumId && song.albumName && (
    <Link
      className={classNames(
        link({ color: "" }),
        "truncate block",
        mode === "condensed" && "text-2xs",
      )}
      label={song.albumName}
      route={routes.album}
      params={getAlbumRouteParams(song.albumId)}
    />
  );

  return (
    <div
      // h-full to take up entire parent (set by recycle view)
      className="group hover:bg-gray-300 text-gray-700 text-sm flex items-center h-full"
      onClick={() => setSong(song)}
    >
      <Cell className="flex space-x-2 items-center pl-3" style={widths.title}>
        <div className="w-5 h-5 relative">
          {playing ? (
            <Audio
              className="w-full h-4 text-purple-500 flex-shrink-0"
              fill="currentColor"
              disabled={paused}
            />
          ) : (
            <>
              <MdMusicNote
                className={classNames(
                  "w-5 h-5 group-hover:opacity-0 absolute",
                  focusedPlay && "opacity-0",
                )}
              />
              <button
                title={`Play ${song.title}`}
                className="focus:opacity-100 group-hover:opacity-100 opacity-0"
                onFocus={() => setFocusedPlay(true)}
                onBlur={() => setFocusedPlay(false)}
                onClick={() => {}}
              >
                <MdPlayArrow className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* The min-w-0 is actually very important to getting ellipsis to work... */}
        {/* Got the tip from https://stackoverflow.com/questions/45813304/text-overflow-ellipsis-on-flex-child-not-working */}
        <div className="flex-grow min-w-0">
          <div
            title={song.title}
            className={classNames("truncate", mode === "condensed" && "text-xs")}
          >
            {song.title}
          </div>
          {mode === "condensed" && (
            <div className="flex space-x-2 text-gray-600">
              {artist}
              {artist && album && <div className="text-2xs">-</div>}
              {album}
            </div>
          )}
        </div>

        <ContextMenu
          button={(props) => (
            <IconButton
              icon={MdMoreVert}
              className="group-hover:w-8 focus:w-8 w-0 overflow-hidden py-1 pl-1 flex-shrink-0"
              hoverClassName="hover:bg-gray-400 focus:bg-gray-400 focus:outline-none"
              iconClassName="w-0 w-6 h-6"
              {...props}
            />
          )}
          items={contextMenuItems}
          className="transform -translate-x-4 z-10"
        />
      </Cell>
      {mode === "regular" && (
        <Cell title={song.artist} className="" style={widths.artist}>
          {artist}
        </Cell>
      )}
      {mode === "regular" && (
        <Cell title={song.albumName} className="" style={widths.album}>
          {album}
        </Cell>
      )}
      <Cell className="text-center truncate" style={widths.songCount}>
        {`${song.played ?? ""}`}
      </Cell>
      {includeDateAdded && (
        <Cell
          title={song.createdAt.toDate().toLocaleDateString()}
          className="text-center truncate"
          style={widths.dateAdded}
        >
          {song.createdAt.toDate().toLocaleDateString()}
        </Cell>
      )}
      <Cell className="text-center truncate" style={widths.duration}>
        {fmtMSS(song.duration / 1000)}
      </Cell>
      <Cell className=" truncate" style={widths.liked}>
        <LikedIcon liked={song.liked} setLiked={setLiked} />
      </Cell>
    </div>
  );
};

export interface SongTableProps<T extends SongInfo> {
  /**
   * The songs. Passing in `undefined` indicates that the songs are still loading.
   */
  songs?: T[];
  loadingRows?: number;
  container: HTMLElement | null;
  actions?: SongTableItem<T>[];

  includeDateAdded?: boolean;

  // Queue source
  source: SetQueueSource;

  mode?: "regular" | "condensed";
}

export const SongTable = function <T extends SongInfo>({
  songs,
  loadingRows = 5,
  container,
  actions,
  source,
  mode = "regular",
  includeDateAdded,
}: SongTableProps<T>) {
  const { setQueue, playing: notPaused, dequeue, enqueue, songInfo } = useQueue();
  const actionsWithAddRemove = useMemo(() => {
    const actionsWithAddRemove = actions ? [...actions] : [];
    if (source.type === "queue") {
      actionsWithAddRemove.push({
        icon: MdRemoveFromQueue,
        label: "Remove From Queue",
        onClick: (_, index) => dequeue(index),
      });
    } else {
      actionsWithAddRemove.push({
        icon: MdAddToQueue,
        label: "Add To Queue",
        onClick: enqueue,
      });
    }

    return actionsWithAddRemove;
  }, [actions, dequeue, enqueue, source.type]);

  const rows = useMemo(() => {
    if (!songs) {
      return Array(loadingRows)
        .fill(undefined)
        .map((_, i) => i);
    }

    return songs.map((song, index) => ({ song, index }));
  }, [loadingRows, songs]);

  // TODO update snowpack + react
  const rowRenderer = useCallback(
    (row: { song: T; index: number } | number) => {
      if (typeof row === "number") {
        return (
          <div key={row}>
            <LoadingCell />
            <LoadingCell />
            <LoadingCell />
          </div>
        );
      }

      const { song, index } = row;
      const playing = checkQueueItemsEqual(
        { song, id: song.playlistId ?? song.id, source },
        songInfo,
      );

      // The key is the index rather than the song ID as the song could > 1
      return (
        <SongTableRow
          song={song}
          index={index}
          setSong={() => setQueue({ songs: songs ?? [], source, index })}
          key={`${song.id}///${index}`}
          actions={actionsWithAddRemove}
          mode={mode}
          playing={playing}
          paused={!notPaused}
          includeDateAdded={includeDateAdded}
        />
      );
    },
    [actionsWithAddRemove, includeDateAdded, mode, notPaused, setQueue, songInfo, songs, source],
  );

  return (
    <div className="text-gray-800 w-full flex flex-col h-full">
      <div key={mode} className="flex">
        <HeaderCol
          label={mode === "regular" ? "Title" : "Song"}
          className="py-2 pl-10"
          style={widths.title}
        />
        {mode === "regular" && <HeaderCol label="Artist" className="py-2" style={widths.artist} />}
        {mode === "regular" && <HeaderCol label="Album" className="py-2" style={widths.album} />}
        <HeaderCol
          label={<MdMusicNote className="w-5 h-5" />}
          className="py-2"
          style={widths.songCount}
        />
        {includeDateAdded && (
          <HeaderCol label="Date Added" className="py-2" style={widths.dateAdded} />
        )}
        <HeaderCol label="" className="py-2" style={widths.duration} />
        <HeaderCol label="" className="py-2" style={widths.liked} />
      </div>
      <div className="flex-grow">
        <RecycledList attrList={rows} itemFn={rowRenderer} itemHeight={48} />
      </div>
    </div>
  );
};
