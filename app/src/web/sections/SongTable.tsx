import React, { useMemo, useState, CSSProperties } from "react";
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
import { useRecycle, SentinelBlock } from "../../recycle";
import { Audio } from "@jsmith21/svg-loaders-react";

export const HeaderCol = ({
  label,
  width,
  className,
  style,
}: {
  label: React.ReactNode;
  width: string;
  className?: string;
  style?: CSSProperties;
}) => {
  return (
    <th
      className={classNames(
        "text-left text-gray-800 text-xs uppercase tracking-wider font-bold",
        className,
      )}
      style={{ width, ...style }}
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

export interface SongTableItem<T extends SongInfo>
  extends Omit<ContextMenuItem, "onClick" | "props"> {
  onClick: (song: T, index: number) => void;
}

export interface SongTableRowProps<T extends SongInfo> {
  /**
   * The song. `undefined` means it is loading.
   */
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
  children,
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

  const album = song.albumId && (
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
    <tr className="group hover:bg-gray-300 text-gray-700 text-sm" onClick={() => setSong(song)}>
      <Cell className="flex space-x-2 items-center h-12 pl-3">
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
              hoverClassName="hover:bg-gray-400"
              iconClassName="w-0 w-6 h-6"
              {...props}
            />
          )}
          items={contextMenuItems}
          className="transform -translate-x-4"
        />
      </Cell>
      {mode === "regular" && <TextCell title={song.artist} text={artist} className="h-12" />}
      {mode === "regular" && <TextCell title={song.albumName} text={album} className="h-12" />}
      <TextCell text={`${song.played ?? ""}`} className="h-12 truncate" />
      {includeDateAdded && (
        <TextCell
          title={song.createdAt.toDate().toLocaleDateString()}
          text={song.createdAt.toDate().toLocaleDateString()}
          className="h-12 truncate"
        />
      )}
      <TextCell text={fmtMSS(song.duration / 1000)} className="h-12 truncate" />
      <Cell className="h-12 truncate">
        <LikedIcon liked={song.liked} setLiked={setLiked} />
        {children}
      </Cell>
    </tr>
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
  const rowCount = useMemo(() => songs?.length ?? 0, [songs]);
  const {
    start,
    end,
    placeholderBottomHeight,
    placeholderTopHeight,
    table,
    handleSentinel,
  } = useRecycle({
    container,
    rowCount,
    rowHeight: 48,
  });

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
        .map((_, i) => (
          <tr key={i}>
            <LoadingCell />
            <LoadingCell />
            <LoadingCell />
          </tr>
        ));
    }
    return songs.slice(start, end).map((song, i) => {
      const playing = checkQueueItemsEqual(
        { song, id: song.playlistId ?? song.id, source },
        songInfo,
      );

      // The key is the index rather than the song ID as the song could > 1
      return (
        <SongTableRow
          song={song}
          index={start + i}
          setSong={() => setQueue({ songs: songs, source, index: start + i })}
          key={`${song.id}///${start + i}`}
          actions={actionsWithAddRemove}
          mode={mode}
          playing={playing}
          paused={!notPaused}
          includeDateAdded={includeDateAdded}
        >
          <SentinelBlock index={start + i} handleSentinel={handleSentinel} />
        </SongTableRow>
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    songs,
    start,
    end,
    loadingRows,
    songInfo?.id,
    songInfo?.source,
    actionsWithAddRemove,
    mode,
    notPaused,
    includeDateAdded,
    handleSentinel,
    // We are ignoring source since they are created each time
    // source,
    setQueue,
  ]);

  return (
    <table className="text-gray-800 table-fixed w-full" ref={table}>
      <thead>
        <tr key={mode}>
          <HeaderCol
            width="42%"
            label={mode === "regular" ? "Title" : "Song"}
            className="py-2 pl-3 ml-5"
            style={{ textIndent: "27px" }}
          />
          {mode === "regular" && <HeaderCol width="32%" label="Artist" className="py-2" />}
          {mode === "regular" && <HeaderCol width="26%" label="Album" className="py-2" />}
          <HeaderCol width="50px" label={<MdMusicNote className="w-5 h-5" />} className="py-2" />
          {includeDateAdded && <HeaderCol width="100px" label="Date Added" className="py-2" />}
          <HeaderCol width="60px" label="" className="py-2" />
          <HeaderCol width="90px" label="" className="py-2" />
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
