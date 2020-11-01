import React, { useMemo, useState, CSSProperties, useCallback, useRef, useEffect } from "react";
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
import { showSongEditor } from "../../sections/MetadataEditor";
import { LikedIcon } from "../../components/LikedIcon";
import { IconButton } from "../../components/IconButton";
import { ContextMenu, ContextMenuItem } from "../../components/ContextMenu";
import { useConfirmAction } from "../../confirm-actions";
import { useLikeSong, useDeleteSong } from "../../queries/songs";
import { fmtMSS } from "../../utils";
import { Link } from "../../components/Link";
import { getAlbumRouteParams, getArtistRouteParams } from "../../routes";
import { link } from "../../classes";
import { showPlaylistAddModal } from "./AddToPlaylistModal";
import Skeleton from "react-loading-skeleton";
import {
  useQueue,
  SetQueueSource,
  SongInfo,
  checkQueueItemsEqual,
  checkSourcesEqual,
} from "../../queue";
import { Audio } from "@jsmith21/svg-loaders-react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Thumbnail } from "../../components/Thumbnail";

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
}: {
  children: React.ReactNode;
  className?: string;
  style: CSSProperties;
  title?: string;
}) => {
  return (
    <div
      className={classNames(
        "whitespace-no-wrap border-b border-gray-200 border-opacity-25 cursor-pointer min-w-0",
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
  style: CSSProperties;
  beforeShowModal?: () => void;
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
  style,
  beforeShowModal,
}: SongTableRowProps<T>) => {
  const [focusedPlay, setFocusedPlay] = useState(false);
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
        label: "Add to Playlist",
        icon: MdPlaylistAdd,
        onClick: () => {
          beforeShowModal && beforeShowModal();
          showPlaylistAddModal(song);
        },
      },
      {
        label: "Edit Info",
        icon: MdEdit,
        onClick: () => {
          beforeShowModal && beforeShowModal();
          showSongEditor(song);
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
  }, [actions, beforeShowModal, confirmAction, deleteSong, index, song]);

  const artist = song.artist && (
    <Link
      className={classNames(
        link({ color: "" }),
        "truncate block",
        mode === "condensed" && "text-2xs",
      )}
      label={song.artist}
      route="artist"
      params={getArtistRouteParams(song.artist)}
    />
  );

  const album = song.albumName && (
    <Link
      className={classNames(
        link({ color: "" }),
        "truncate block",
        mode === "condensed" && "text-2xs",
      )}
      label={song.albumName}
      route="album"
      params={getAlbumRouteParams(song)}
    />
  );

  return (
    <div
      className="group hover:bg-gray-300 text-gray-700 text-sm flex items-center h-full"
      onClick={() => setSong(song)}
      style={style}
    >
      <Cell className="flex space-x-2 items-center pl-3" style={widths.title}>
        <div className="w-8 h-8 relative flex-shrink-0 flex items-center justify-center">
          {playing ? (
            <Audio
              className="w-full h-4 text-purple-500 flex-shrink-0"
              fill="currentColor"
              disabled={paused}
            />
          ) : (
            <>
              <Thumbnail
                song={song}
                size="32"
                className={classNames(
                  "w-8 h-8 absolute group-hover:opacity-25",
                  focusedPlay && "opacity-25",
                )}
              />
              <button
                title={`Play ${song.title}`}
                className="focus:opacity-100 group-hover:opacity-100 opacity-0 bg-transparent z-10 text-gray-800 focus:outline-none"
                onFocus={() => setFocusedPlay(true)}
                onBlur={() => setFocusedPlay(false)}
                // This click event is handled by the <div>
                onClick={() => {}}
              >
                <MdPlayArrow className="w-8 h-8" />
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
  actions?: SongTableItem<T>[];

  includeDateAdded?: boolean;

  // Queue source
  source: SetQueueSource;

  mode?: "regular" | "condensed";

  beforeShowModal?: () => void;
}

export const SongTable = function <T extends SongInfo>({
  songs,
  loadingRows = 5,
  actions,
  source,
  mode = "regular",
  includeDateAdded,
  beforeShowModal,
}: SongTableProps<T>) {
  const ref = useRef<List | null>(null);
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

    return songs;
  }, [loadingRows, songs]);

  useEffect(() => {
    if (!songInfo || !songInfo.jump || !checkSourcesEqual(songInfo.source, source)) return;
    ref.current?.scrollToItem(songInfo.index);
  }, [songInfo, source]);

  const Row = useCallback(
    ({ index, style }: { index: number; style: CSSProperties }) => {
      const value = rows[index];
      if (typeof value === "number") {
        return (
          <div style={style}>
            <LoadingCell />
            <LoadingCell />
            <LoadingCell />
          </div>
        );
      }

      const playing = checkQueueItemsEqual(
        { song: value, id: value.playlistId ?? value.id, source },
        songInfo,
      );

      // The key is the index rather than the song ID as the song could > 1
      return (
        <SongTableRow
          style={style}
          song={value}
          index={index}
          setSong={() => setQueue({ songs: songs ?? [], source, index })}
          actions={actionsWithAddRemove}
          mode={mode}
          playing={playing}
          paused={!notPaused}
          includeDateAdded={includeDateAdded}
          beforeShowModal={beforeShowModal}
        />
      );
    },
    [
      actionsWithAddRemove,
      includeDateAdded,
      mode,
      notPaused,
      rows,
      setQueue,
      songInfo,
      songs,
      source,
      beforeShowModal,
    ],
  );

  return (
    <div className="text-gray-800 w-full flex flex-col">
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
      <div className="flex-grow flex">
        <AutoSizer>
          {({ height, width }) => {
            return (
              <List
                ref={ref}
                itemCount={rows.length}
                itemSize={48}
                className="relative w-full"
                height={height}
                width={width}
              >
                {Row}
              </List>
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );
};
