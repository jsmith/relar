import React from "react";
import type { Playlist, Song } from "../../universal/types";
import { usePlaylistAdd, usePlaylists } from "../queries/playlists";
import { SearchMagnifyingGlass } from "../illustrations/SearchMagnifyingGlass";
import { pluralSongs, fmtToDate } from "../utils";
import { HiChevronRight } from "react-icons/hi";
import { getCachedOr } from "../watcher";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorTemplate } from "../components/ErrorTemplate";

export const AddToPlaylistList = ({
  song,
  setLoading,
  setError,
  close,
}: {
  song: firebase.firestore.QueryDocumentSnapshot<Song>;
  setLoading: (value: boolean) => void;
  setError: (value: string) => void;
  close: () => void;
}) => {
  const playlists = usePlaylists();
  const [addToPlaylist] = usePlaylistAdd();

  return playlists.status === "error" ? (
    <ErrorTemplate />
  ) : !playlists.data ? (
    <LoadingSpinner />
  ) : playlists.data.length === 0 ? (
    <div className="flex flex-col items-center space-y-2">
      <SearchMagnifyingGlass className="h-24" />
      <div className="text-gray-600">No playlists found...</div>
    </div>
  ) : (
    <div className="rounded overflow-hidden">
      {playlists.data.map((playlist) => {
        const data = getCachedOr(playlist);
        return (
          <div
            key={playlist.id}
            className="hover:bg-gray-300 py-2 px-3 md:px-2 cursor-pointer flex justify-between items-center"
            tabIndex={0}
            role="button"
            onClick={() => {
              setError("");
              setLoading(true);
              addToPlaylist(
                {
                  playlistId: playlist.id,
                  songId: song.id,
                },
                {
                  onSettled: () => setLoading(false),
                  onSuccess: close,
                  onError: () => setError("Unable to add song to playlist?? We're working on it!"),
                },
              );
            }}
          >
            <div>
              <div className="text-purple-700">{data.name}</div>
              <div className="text-gray-600 text-2xs md:text-base">
                {`${data.songs?.length ?? 0} ${pluralSongs(
                  data.songs?.length,
                )} • Created on ${fmtToDate(data.createdAt)}`}
              </div>
            </div>

            <HiChevronRight className="w-5 h-5 text-gray-600" />
          </div>
        );
      })}
    </div>
  );
};
