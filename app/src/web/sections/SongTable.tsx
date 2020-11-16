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
import { likeSong, useDeleteSong } from "../../queries/songs";
import { fmtMSS } from "../../utils";
import { Link } from "../../components/Link";
import { getAlbumRouteParams, getArtistRouteParams } from "../../routes";
import { link } from "../../classes";
import { showPlaylistAddModal } from "./AddToPlaylistModal";
import Skeleton from "react-loading-skeleton";
import {
  SetQueueSource,
  SongInfo,
  checkSourcesEqual,
  Queue,
  useIsThePlayingSong,
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
  track: { flex: "0 0 40px" },
};

export const HeaderCol = ({
  label,
  className,
  style,
  position = "left",
}: {
  label: React.ReactNode;
  className?: string;
  style: CSSProperties;
  position?: "left" | "center";
}) => {
  return (
    <div
      className={classNames(
        "text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider font-bold py-2",
        className,
        position === "left" ? "text-left" : "text-center",
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
      className={classNames("whitespace-no-wrap cursor-pointer min-w-0", className)}
      style={style}
    >
      {children}
    </div>
  );
};

export const LoadingCell = () => {
  return (
    <Cell className="px-2 py-3" style={{}}>
      <Skeleton />
    </Cell>
  );
};

export interface SongTableItem<T extends SongInfo>
  extends Omit<ContextMenuItem, "onClick" | "props"> {
  onClick: (song: T, index: number) => void;
}

export interface SongTableRowProps<T extends SongInfo> {
  song: T;
  setSong: () => void;
  actions: SongTableItem<T>[] | undefined;
  mode: "regular" | "condensed";
  source: SetQueueSource;
  children?: React.ReactNode;
  includeDateAdded?: boolean;
  includeAlbumNumber?: boolean;
  index: number;
  style: CSSProperties;
  beforeShowModal?: () => void;
}

export const SongTableRow = <T extends SongInfo>({
  song,
  setSong,
  actions,
  mode,
  source,
  includeDateAdded,
  includeAlbumNumber,
  index,
  style,
  beforeShowModal,
}: SongTableRowProps<T>) => {
  const [focusedPlay, setFocusedPlay] = useState(false);
  const { confirmAction } = useConfirmAction();
  const isPlaying = useIsThePlayingSong({ song, source });
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
      className="group hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm flex items-center h-full"
      onClick={setSong}
      style={style}
    >
      {includeAlbumNumber && (
        <Cell style={widths.track} className="pl-2">
          {song.track?.no}
        </Cell>
      )}
      <Cell
        className={classNames("flex space-x-2 items-center", !includeAlbumNumber && "pl-3")}
        style={widths.title}
      >
        <div className="w-8 h-8 relative flex-shrink-0 flex items-center justify-center">
          {isPlaying === "playing" || isPlaying === "paused" ? (
            <Audio
              className="w-full h-4 text-purple-500 flex-shrink-0"
              fill="currentColor"
              disabled={isPlaying === "paused"}
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
                className="focus:opacity-100 group-hover:opacity-100 opacity-0 bg-transparent z-10 text-gray-800 dark:text-gray-200 focus:outline-none"
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
              hoverClassName="hover:bg-gray-400 dark:hover:bg-gray-600 focus:bg-gray-400 dark:focus:bg-gray-600 focus:outline-none"
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
      <Cell className="truncate" style={widths.songCount}>
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
        <LikedIcon liked={song.liked} setLiked={(value) => likeSong(song, value)} />
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
  includeAlbumNumber?: boolean;

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
  includeAlbumNumber,
  beforeShowModal,
}: SongTableProps<T>) {
  const ref = useRef<List | null>(null);
  const actionsWithAddRemove = useMemo(() => {
    const actionsWithAddRemove = actions ? [...actions] : [];
    if (source.type === "queue") {
      actionsWithAddRemove.push({
        icon: MdRemoveFromQueue,
        label: "Remove From Queue",
        onClick: (_, index) => Queue.dequeue(index),
      });
    } else {
      actionsWithAddRemove.push({
        icon: MdAddToQueue,
        label: "Add To Queue",
        onClick: Queue.enqueue,
      });
    }

    return actionsWithAddRemove;
  }, [actions, source.type]);

  const rows = useMemo(() => {
    if (!songs) {
      return Array(loadingRows)
        .fill(undefined)
        .map((_, i) => i);
    }

    return songs;
  }, [loadingRows, songs]);

  useEffect(
    () =>
      Queue.onChangeCurrentlyPlaying((currentlyPlaying) => {
        if (
          !currentlyPlaying ||
          !currentlyPlaying.jump ||
          !checkSourcesEqual(currentlyPlaying.source, source)
        )
          return;
        ref.current?.scrollToItem(currentlyPlaying.index);
      }),
    [source],
  );

  const Row = useCallback(
    ({ index, style }: { index: number; style: CSSProperties }) => {
      const value = rows[index];
      if (typeof value === "number") {
        return (
          <div style={style}>
            <LoadingCell />
          </div>
        );
      }

      return (
        <SongTableRow
          style={style}
          song={value}
          index={index}
          source={source}
          setSong={() => Queue.setQueue({ songs: songs ?? [], source, index })}
          actions={actionsWithAddRemove}
          mode={mode}
          includeDateAdded={includeDateAdded}
          includeAlbumNumber={includeAlbumNumber}
          beforeShowModal={beforeShowModal}
        />
      );
    },
    [
      actionsWithAddRemove,
      includeDateAdded,
      includeAlbumNumber,
      mode,
      rows,
      songs,
      source,
      beforeShowModal,
    ],
  );

  return (
    <div className="text-gray-800 w-full flex flex-col flex-grow">
      <div key={mode} className="flex">
        {includeAlbumNumber && <HeaderCol label="#" className="pl-2" style={widths.track} />}
        <HeaderCol
          label={mode === "regular" ? "Title" : "Song"}
          className={includeAlbumNumber ? "" : "pl-3"}
          style={widths.title}
        />
        {mode === "regular" && <HeaderCol label="Artist" style={widths.artist} />}
        {mode === "regular" && <HeaderCol label="Album" style={widths.album} />}
        <HeaderCol
          label={<MdMusicNote className="w-5 h-5" style={{ marginLeft: "-0.15rem" }} />}
          className=""
          style={widths.songCount}
        />
        {includeDateAdded && <HeaderCol label="Date Added" style={widths.dateAdded} />}
        <HeaderCol label="" style={widths.duration} />
        <HeaderCol label="" style={widths.liked} />
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
