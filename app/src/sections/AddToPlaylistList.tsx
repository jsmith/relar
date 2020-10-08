import React from "react";
import { Song } from "../shared/universal/types";
import { usePlaylistAdd } from "../queries/playlists";
import { SearchMagnifyingGlass } from "../illustrations/SearchMagnifyingGlass";
import { pluralSongs, fmtToDate, onConditions } from "../utils";
import { HiChevronRight } from "react-icons/hi";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useCoolPlaylists } from "../db";

export const AddToPlaylistList = ({
  song,
  setLoading,
  setError,
  close,
}: {
  song: Song;
  setLoading: (value: boolean) => void;
  setError: (value: string) => void;
  close: () => void;
}) => {
  const playlists = useCoolPlaylists();
  const addToPlaylist = usePlaylistAdd();

  return !playlists ? (
    <LoadingSpinner />
  ) : playlists.length === 0 ? (
    <div className="flex flex-col items-center space-y-2">
      <SearchMagnifyingGlass className="h-24" />
      <div className="text-gray-600">No playlists found...</div>
    </div>
  ) : (
    <div className="rounded overflow-hidden">
      {playlists.map((playlist) => {
        return (
          <div
            key={playlist.id}
            className="hover:bg-gray-300 py-2 px-3 md:px-2 cursor-pointer flex justify-between items-center"
            tabIndex={0}
            role="button"
            onClick={() => {
              setError("");
              setLoading(true);
              onConditions(
                () =>
                  addToPlaylist({
                    playlistId: playlist.id,
                    songId: song.id,
                  }),
                close,
                () => setError("We couldn't add the song to the playlist... we're working on it!"),
                () => setLoading(false),
              );
            }}
          >
            <div>
              <div className="text-purple-700">{playlist.name}</div>
              <div className="text-gray-600 text-2xs md:text-base">
                {`${playlist.songs?.length ?? 0} ${pluralSongs(
                  playlist.songs?.length,
                )} • Created on ${fmtToDate(playlist.createdAt)}`}
              </div>
            </div>

            <HiChevronRight className="w-5 h-5 text-gray-600" />
          </div>
        );
      })}
    </div>
  );
};
