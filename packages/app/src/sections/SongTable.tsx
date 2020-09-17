import React, { useMemo, useState, CSSProperties } from "react";
import { Song } from "../shared/universal/types";
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
import { MetadataEditor } from "../shared/web/sections/MetadataEditor";
import { useModal } from "react-modal-hook";
import { LikedIcon } from "../shared/web/components/LikedIcon";
import { IconButton } from "../shared/web/components/IconButton";
import useDropdownMenuImport from "react-accessible-dropdown-menu-hook";
import { ContextMenu, ContextMenuItem } from "../shared/web/components/ContextMenu";
import { useConfirmAction } from "../confirm-actions";
import { useLikeSong, useDeleteSong } from "../shared/web/queries/songs";
import { useFirebaseUpdater } from "../shared/web/watcher";
import { fmtMSS } from "../shared/web/utils";
import { Link } from "../shared/web/components/Link";
import { routes } from "../routes";
import { link } from "../shared/web/classes";
import { AddToPlaylistEditor } from "../shared/web/sections/AddToPlaylistModal";
import { Skeleton } from "../shared/web/components/Skeleton";
import { useQueue, SetQueueSource, SongInfo, isSongInfo } from "../shared/web/queue";
import { useRecycle, SentinelBlock } from "../shared/web/recycle";
import { Audio } from "@jsmith21/svg-loaders-react";

// I really wish I didn't have to do this but for some reason this is the only thing that works
// Before I was getting an issue in production
let useDropdownMenu = useDropdownMenuImport;

if ((useDropdownMenu as any).default) {
  useDropdownMenu = (useDropdownMenu as any).default;
}

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

export interface SongTableItem extends Omit<ContextMenuItem, "onClick" | "props"> {
  onClick: (song: firebase.firestore.QueryDocumentSnapshot<Song>, index: number) => void;
}

export interface SongTableRowProps {
  /**
   * The song. `undefined` means it is loading.
   */
  song: firebase.firestore.QueryDocumentSnapshot<Song>;
  setSong: (song: firebase.firestore.QueryDocumentSnapshot<Song>) => void;
  actions: SongTableItem[] | undefined;
  mode: "regular" | "condensed";
  playing: boolean;
  paused: boolean;
  children?: React.ReactNode;
  includeDateAdded?: boolean;
  index: number;
}

export const SongTableRow = ({
  song,
  setSong,
  actions,
  mode,
  playing,
  paused,
  children,
  includeDateAdded,
  index,
}: SongTableRowProps) => {
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
  const [deleteSong] = useDeleteSong();

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
            title: `Delete ${data.title}`,
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
  }, [
    actions,
    confirmAction,
    data.title,
    deleteSong,
    index,
    showAddPlaylistModal,
    showEditorModal,
    song,
  ]);

  const artist = data.artist && (
    <Link
      className={classNames(link({ color: "" }), mode === "condensed" && "text-2xs")}
      label={data.artist}
      route={routes.artist}
      params={{ artistName: data.artist }}
    />
  );

  const album = data.albumId && (
    <Link
      className={classNames(link({ color: "" }), mode === "condensed" && "text-2xs")}
      label={data.albumName}
      route={routes.album}
      params={{ albumId: data.albumId }}
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
                title={`Play ${data.title}`}
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
            title={data.title}
            className={classNames("truncate", mode === "condensed" && "text-xs")}
          >
            {data.title}
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
      {mode === "regular" && (
        <TextCell title={data.artist} text={artist} className="h-12 truncate" />
      )}
      {mode === "regular" && (
        <TextCell title={data.albumName} text={album} className="h-12 truncate" />
      )}
      <TextCell text={`${data.played ?? ""}`} className="h-12 truncate" />
      {includeDateAdded && (
        <TextCell
          title={data.createdAt.toDate().toLocaleDateString()}
          text={data.createdAt.toDate().toLocaleDateString()}
          className="h-12 truncate"
        />
      )}
      <TextCell text={fmtMSS(data.duration / 1000)} className="h-12 truncate" />
      <Cell className="h-12 truncate">
        <LikedIcon liked={data.liked} setLiked={setLiked} />
        {children}
      </Cell>
    </tr>
  );
};

export interface SongTableProps {
  /**
   * The songs. Passing in `undefined` indicates that the songs are still loading.
   */
  songs?: Array<firebase.firestore.QueryDocumentSnapshot<Song> | SongInfo>;
  loadingRows?: number;
  container: HTMLElement | null;
  actions?: SongTableItem[];

  includeDateAdded?: boolean;

  // Queue source
  source: SetQueueSource;

  mode?: "regular" | "condensed";
}

export const SongTable = ({
  songs: songsMixed,
  loadingRows = 5,
  container,
  actions,
  source,
  mode = "regular",
  includeDateAdded,
}: SongTableProps) => {
  const songs = useMemo(
    () => songsMixed?.map((song) => (isSongInfo(song) ? song : { song, id: song.id })),
    [songsMixed],
  );
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
    return songs.slice(start, end).map(({ song, id }, i) => {
      // Default not playing
      let playing = false;

      // But if they do have the same ID...
      if (id === songInfo?.id) {
        // Check the source since these IDs are only unique within a source!!
        switch (source.type) {
          case "album":
          case "artist":
          case "generated":
          case "playlist":
            playing = source.type === songInfo.source.type && source.id === songInfo.source.id;
            break;
          case "queue":
            playing = true;
            break;
          case "library":
            playing = songInfo.source.type === source.type;
            break;
          case "manuel":
            throw Error("????????");
          // It should never reach this point...
        }
        console.log(
          `Source -> ${source.type} vs. ${songInfo.source.type} ({ start: ${start}, end: ${end}})`,
        );
      }

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
          <SentinelBlock index={start + i} ref={handleSentinel} />
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