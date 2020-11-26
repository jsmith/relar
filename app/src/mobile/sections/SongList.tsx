import React, { memo, MutableRefObject, Ref, useEffect, useMemo, useRef } from "react";
import { MdAddToQueue, MdPlaylistAdd } from "react-icons/md";
import { useDeleteSong } from "../../queries/songs";
import { fmtMSS, onConditions, useMySnackbar } from "../../utils";
import {
  checkQueueItemsEqual,
  Queue,
  SetQueueSource,
  SongInfo,
  useIsThePlayingSong,
} from "../../queue";
import {
  ListContainer,
  ListContainerMode,
  ListContainerRowProps,
} from "../components/ListContainer";
import { AiOutlineUser } from "react-icons/ai";
import { RiAlbumLine } from "react-icons/ri";
import { getAlbumRouteParams, getArtistRouteParams } from "../../routes";
import { Song } from "../../shared/universal/types";
import { HiPlus, HiTrash } from "react-icons/hi";
import { Modals } from "@capacitor/core";
import { useSlideUpScreen } from "../slide-up-screen";
import { usePlaylistCreate, usePlaylistRemoveSong } from "../../queries/playlists";
import { AddToPlaylistList } from "../../sections/AddToPlaylistList";
import { MusicListItem, MusicListItemState } from "./MusicListItem";
import { captureException } from "@sentry/browser";
import { areEqual, FixedSizeList } from "react-window";

export interface SongListProps {
  songs: SongInfo[] | undefined;
  mode?: ListContainerMode;
  className?: string;
  disableNavigator?: boolean;
  source: SetQueueSource;
  outerRef?: MutableRefObject<HTMLDivElement | null>;
  containerId?: string;
}

const AddToPlaylistMenu = ({ song, hide }: { song: Song; hide: () => void }) => {
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
  item: song,
  items: songs,
  mode,
  source,
  index,
  style,
}: ListContainerRowProps<SongInfo> & {
  source: SetQueueSource;
}) => {
  const deleteSong = useDeleteSong();
  const createPlaylist = usePlaylistCreate();
  const removeSong = usePlaylistRemoveSong(source.type === "playlist" ? source.id : undefined);
  const open = useMySnackbar();
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
        onConditions(() => createPlaylist(value)).onError((e) => {
          captureException(e);
          Modals.alert({
            title: "Error",
            message: "There was an unknown error creating playlist.",
          });
        });
      },
    },
  );

  const state = useIsThePlayingSong({ song, source });

  return (
    <MusicListItem
      style={style}
      actionItems={[
        {
          type: "click",
          icon: MdAddToQueue,
          label: "Add To Queue",
          onClick: () => Queue.enqueue(song),
        },
        {
          label: "Add To Playlist",
          icon: MdPlaylistAdd,
          type: "click",
          onClick: show,
        },
        song.playlistId
          ? {
              label: "Remove From Playlist",
              icon: MdPlaylistAdd,
              type: "click",
              onClick: () => removeSong(song.playlistId!),
            }
          : undefined,
        song.artist
          ? {
              label: "Go To Artist",
              icon: AiOutlineUser,
              route: "artist",
              type: "link",
              params: getArtistRouteParams(song.artist),
            }
          : undefined,
        {
          label: "Go to Album",
          icon: RiAlbumLine,
          route: "album",
          type: "link",
          params: getAlbumRouteParams(song),
        },
        {
          label: "Delete",
          icon: HiTrash,
          type: "click",
          onClick: () => {
            Modals.confirm({
              title: "Delete Song",
              message: `Are you sure you want to delete ${song.title}?`,
            }).then(({ value }) => {
              if (value) {
                deleteSong(song.id);
                open(`Successfully deleted ${song.title}`);
              }
            });
          },
        },
      ]}
      onClick={() =>
        Queue.setQueue({
          source,
          songs: songs!,
          index: index,
        })
      }
      title={song.title}
      subTitle={`${song.artist ?? "Unknown Artist"} • ${fmtMSS(song.duration / 1000)}`}
      song={song}
      mode={mode}
      state={state}
    />
  );
};

const SongListRowMemo = memo(SongListRow, areEqual);

export const SongList = ({
  songs,
  mode,
  className,
  disableNavigator,
  source,
  outerRef,
  containerId,
}: SongListProps) => {
  const firstRender = useRef(true);
  const list = useRef<FixedSizeList | null>(null);

  useEffect(() => {
    // TODO
    console.log(firstRender.current, source.type, list.current);
    if (!firstRender.current || source.type !== "queue" || !list.current) return;
    firstRender.current = false;
    const index = songs?.findIndex(
      (song) => (song.playlistId ?? song.id) === Queue.getCurrentlyPlaying()?.id,
    );

    console.log(index, "WOW");
    if (index === -1 || index === undefined) return;
    console.log(`Scrolling to ${index} (${index * 73})`);
    list.current.scrollTo(index * 73);
  }, [songs, source]);

  return (
    <ListContainer
      // FIXME this might not work in non condensed mode
      height={73}
      items={songs}
      sortKey="title"
      row={SongListRowMemo}
      mode={mode}
      className={className}
      disableNavigator={disableNavigator}
      extra={{ source }}
      outerRef={outerRef}
      listRef={list}
      containerId={containerId}
    />
  );
};
