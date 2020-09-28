import React from "react";
import { MdAddToQueue, MdMoreVert, MdPlaylistAdd } from "react-icons/md";
import { Thumbnail } from "../shared/web/components/Thumbnail";
import { useDeleteSong, useSongs } from "../shared/web/queries/songs";
import { fmtMSS, fmtToDate } from "../shared/web/utils";
import { useQueue } from "../shared/web/queue";
import { ListContainer, ListContainerRowProps } from "../components/ListContainer";
import { SentinelBlock } from "../shared/web/recycle";
import { openActionSheet } from "../action-sheet";
import { AiOutlineUser } from "react-icons/ai";
import { RiAlbumLine } from "react-icons/ri";
import { routes } from "../routes";
import type { Song } from "../shared/universal/types";
import { HiPlus, HiTrash } from "react-icons/hi";
import { Modals } from "@capacitor/core";
import { useSlideUpScreen } from "../slide-up-screen";
import { Button } from "../shared/web/components/Button";
import { usePlaylistCreate } from "../shared/web/queries/playlists";
import { AddToPlaylistList } from "../shared/web/sections/AddToPlaylistList";

export interface SongListProps {
  songs: Array<firebase.firestore.QueryDocumentSnapshot<Song>> | undefined;
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
}: ListContainerRowProps<Song>) => {
  const [deleteSong] = useDeleteSong();
  const { setQueue, enqueue } = useQueue();
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

  return (
    <div
      className="flex items-center p-1 space-x-1"
      onClick={() =>
        setQueue({
          source: { type: "library" },
          songs: songs!,
          index,
        })
      }
    >
      <Thumbnail snapshot={song} className="w-12 h-12 flex-shrink-0" size="64" />
      <div className="flex flex-col justify-center min-w-0 flex-grow">
        <SentinelBlock index={absoluteIndex} handleSentinel={handleSentinel} />
        <div className="text-xs truncate">{data.title}</div>
        <div className="text-2xs">{`${data.artist} • ${fmtMSS(data.duration / 1000)}`}</div>
      </div>
      <button
        className="p-1"
        onClick={(e) => {
          e.stopPropagation();
          openActionSheet([
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
          ]);

          // because it's so hard to read with all of the brackets, this is the end of the function
        }}
      >
        <MdMoreVert />
      </button>
    </div>
  );
};

export const SongList = ({ songs }: SongListProps) => {
  return <ListContainer height={57} items={songs} sortKey="title" row={SongListRow} />;
};
