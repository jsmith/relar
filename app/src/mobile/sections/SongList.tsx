import React, { useMemo } from "react";
import { MdAddToQueue, MdPlaylistAdd } from "react-icons/md";
import { useDeleteSong } from "../../queries/songs";
import { fmtMSS } from "../../utils";
import {
  checkQueueItemsEqual,
  checkSourcesEqual,
  isSongInfo,
  SetQueueSource,
  SongInfo,
  useQueue,
} from "../../queue";
import {
  ListContainer,
  ListContainerMode,
  ListContainerRowProps,
} from "../components/ListContainer";
import { AiOutlineUser } from "react-icons/ai";
import { RiAlbumLine } from "react-icons/ri";
import { routes } from "../../routes";
import type { Song } from "../../shared/universal/types";
import { HiPlus, HiTrash } from "react-icons/hi";
import { Modals } from "@capacitor/core";
import { useSlideUpScreen } from "../slide-up-screen";
import { usePlaylistCreate } from "../../queries/playlists";
import { AddToPlaylistList } from "../../sections/AddToPlaylistList";
import { MusicListItem, MusicListItemState } from "./MusicListItem";

export interface SongListProps {
  songs: Array<firebase.firestore.QueryDocumentSnapshot<Song> | SongInfo> | undefined;
  mode?: ListContainerMode;
  className?: string;
  disableNavigator?: boolean;
  source: SetQueueSource;
}

const AddToPlaylistMenu = ({
  song,
  hide,
}: {
  song: firebase.firestore.QueryDocumentSnapshot<Song>;
  hide: () => void;
}) => {
  return (
    <div className="flex flex-col py-2">
      <AddToPlaylistList
        song={song}
        setLoading={() => {}}
        setError={(error) => error && Modals.alert({ title: "Error", message: error })}
        close={hide}
      />
    </div>
  );
};

const SongListRow = ({
  item: data,
  handleSentinel,
  index,
  snapshot: song,
  snapshots: songs,
  absoluteIndex,
  mode,
  source,
  songsMixed,
}: ListContainerRowProps<Song> & {
  source: SetQueueSource;
  songsMixed: Array<firebase.firestore.QueryDocumentSnapshot<Song> | SongInfo> | undefined;
}) => {
  const [deleteSong] = useDeleteSong();
  const { setQueue, enqueue, songInfo, playing } = useQueue();
  const [createPlaylist] = usePlaylistCreate();
  const { show } = useSlideUpScreen(
    "Add to Playlist",
    AddToPlaylistMenu,
    { song },
    {
      title: "Add New Playlist",
      icon: HiPlus,
      onClick: async () => {
        const { value, cancelled } = await Modals.prompt({
          message: "What do you want to name your new playlist?",
          title: "Playlist Name",
        });

        if (cancelled) return;
        createPlaylist(value, {
          onError: () =>
            Modals.alert({
              title: "Error",
              message: "There was an unknown error creating playlist.",
            }),
        });
      },
    },
  );

  const state = useMemo((): MusicListItemState => {
    if (!songsMixed) return "not-playing";
    const id = songsMixed[absoluteIndex].id;
    if (!checkQueueItemsEqual({ song, id, source }, songInfo)) return "not-playing";
    return playing ? "playing" : "paused";
  }, [absoluteIndex, playing, song, songInfo, songsMixed, source]);

  return (
    <MusicListItem
      actionItems={[
        {
          type: "click",
          icon: MdAddToQueue,
          label: "Add To Queue",
          onClick: () => enqueue(song),
        },
        {
          label: "Add To Playlist",
          icon: MdPlaylistAdd,
          type: "click",
          onClick: show,
        },
        data.artist
          ? {
              label: "Go To Artist",
              icon: AiOutlineUser,
              route: routes.artist,
              type: "link",
              params: { artistName: data.artist },
            }
          : undefined,
        data.albumId
          ? {
              label: "Go to Album",
              icon: RiAlbumLine,
              route: routes.album,
              type: "link",
              params: { albumId: data.albumId },
            }
          : undefined,
        {
          label: "Delete",
          icon: HiTrash,
          type: "click",
          onClick: () => {
            Modals.confirm({
              title: "Delete Song",
              message: `Are you sure you want to delete ${data.title}?`,
            }).then(({ value }) => {
              if (value) {
                deleteSong(song.id);
                // TODO notification
              }
            });
          },
        },
      ]}
      onClick={() =>
        setQueue({
          source,
          songs: songs!,
          index: absoluteIndex,
        })
      }
      title={data.title}
      subTitle={`${data.artist} • ${fmtMSS(data.duration / 1000)}`}
      handleSentinel={handleSentinel}
      absoluteIndex={absoluteIndex}
      snapshot={song}
      mode={mode}
      state={state}
    />
  );
};

export const SongList = ({
  songs: songsMixed,
  mode,
  className,
  disableNavigator,
  source,
}: SongListProps) => {
  // FIXME duplication
  const songs = useMemo(() => songsMixed?.map((item) => (isSongInfo(item) ? item.song : item)), [
    songsMixed,
  ]);

  return (
    <ListContainer
      height={57}
      items={songs}
      sortKey="title"
      row={SongListRow}
      mode={mode}
      className={className}
      disableNavigator={disableNavigator}
      extra={{ source, songsMixed }}
    />
  );
};
