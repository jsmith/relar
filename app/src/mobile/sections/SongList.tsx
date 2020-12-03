import React, { memo, MutableRefObject, useEffect, useRef } from "react";
import { MdAddToQueue, MdPlaylistAdd } from "react-icons/md";
import { useDeleteSong } from "../../queries/songs";
import { fmtMSS, useMySnackbar } from "../../utils";
import { Queue, SetQueueSource, SongInfo, useIsThePlayingSong } from "../../queue";
import {
  ListContainer,
  ListContainerMode,
  ListContainerRowProps,
} from "../components/ListContainer";
import { AiOutlineUser } from "react-icons/ai";
import { RiAlbumLine } from "react-icons/ri";
import { getAlbumRouteParams, getArtistRouteParams } from "../../routes";
import { HiTrash } from "react-icons/hi";
import { Modals } from "@capacitor/core";
import { usePlaylistRemoveSong } from "../../queries/playlists";
import { MusicListItem } from "./MusicListItem";
import { areEqual, FixedSizeList } from "react-window";
import { useAddToPlaylist } from "../add-to-playlist";

export interface SongListProps {
  songs: SongInfo[] | undefined;
  mode?: ListContainerMode;
  className?: string;
  disableNavigator?: boolean;
  source: SetQueueSource;
  outerRef?: MutableRefObject<HTMLDivElement | null>;
  containerId?: string;
}

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
  const removeSong = usePlaylistRemoveSong(source.type === "playlist" ? source.id : undefined);
  const open = useMySnackbar();
  const showAddPlaylist = useAddToPlaylist(song);
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
          onClick: showAddPlaylist,
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
    if (!firstRender.current || source.type !== "queue" || !list.current) return;
    firstRender.current = false;
    const index = songs?.findIndex(
      (song) => (song.playlistId ?? song.id) === Queue.getCurrentlyPlaying()?.id,
    );

    if (index === -1 || index === undefined) return;
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
