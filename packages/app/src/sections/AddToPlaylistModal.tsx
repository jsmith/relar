import React, { useState } from "react";
import { Song } from "../shared/universal/types";
import { Input } from "../shared/web/components/Input";
import { ErrorTemplate } from "../shared/web/components/ErrorTemplate";
import { usePlaylists, usePlaylistCreate, usePlaylistAdd } from "../shared/web/queries/playlists";
import { LoadingSpinner } from "../shared/web/components/LoadingSpinner";
import { Modal } from "../shared/web/components/Modal";
import { SearchMagnifyingGlass } from "../illustrations/SearchMagnifyingGlass";
import { BlockAlert } from "../shared/web/components/BlockAlert";
import { pluralSongs, fmtToDate } from "../shared/web/utils";
import { HiChevronRight } from "react-icons/hi";
import { getCachedOr } from "../shared/web/watcher";

export interface MetadataEditorProps {
  setDisplay: (display: boolean) => void;
  song: firebase.firestore.QueryDocumentSnapshot<Song>;
}

export const AddToPlaylistEditor = ({ song, setDisplay }: MetadataEditorProps) => {
  const playlists = usePlaylists();
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [loading, setLoading] = useState(false);
  const [createPlaylist] = usePlaylistCreate();
  const [error, setError] = useState("");
  const [addToPlaylist] = usePlaylistAdd();
  const [playlistAddError, setPlaylistAddError] = useState("");

  const createNewPlaylist = async () => {
    setLoading(true);
    setError("");
    await createPlaylist(newPlaylistName, {
      onSettled: () => setLoading(false),
      onSuccess: () => {
        setNewPlaylistName("");
        setLoading(false);
      },
      onError: () => setError("Unable to create playlist :( We've been notified."),
    });
  };

  return (
    <Modal
      titleText="Add To Playlist"
      onExit={() => setDisplay(false)}
      className="space-y-2 max-w-full px-6 py-5"
      style={{ width: "30rem" }}
      loading={loading}
    >
      <h1 className="text-xl">Add To Playlist</h1>
      {playlists.data && (
        <div className="relative">
          <Input
            inputId="playlist-add-input"
            placeholder="Playlist name"
            value={newPlaylistName}
            onChange={setNewPlaylistName}
            onEnter={createNewPlaylist}
            autoFocus
          />
          <div className="absolute right-0 h-full flex flex-col justify-center top-0 mr-2">
            <button
              className="bg-purple-500 text-white px-2 py-1 rounded"
              onClick={createNewPlaylist}
              title="Add new playlist"
            >
              Add
            </button>
          </div>
        </div>
      )}
      {error && <BlockAlert type="error">{error}</BlockAlert>}
      {playlists.status === "error" ? (
        <ErrorTemplate />
      ) : !playlists.data ? (
        <LoadingSpinner />
      ) : playlists.data.length === 0 ? (
        <div className="flex flex-col items-center space-y-2">
          <SearchMagnifyingGlass className="h-24" />
          <div className="text-gray-600">No playlists found...</div>
        </div>
      ) : playlists.data.length > 0 ? (
        <div className="rounded overflow-hidden">
          {playlists.data.map((playlist) => {
            const data = getCachedOr(playlist);
            return (
              <div
                key={playlist.id}
                className="hover:bg-gray-300 py-2 px-2 cursor-pointer flex justify-between items-center"
                tabIndex={0}
                role="button"
                onClick={() => {
                  setPlaylistAddError("");
                  setLoading(true);
                  addToPlaylist(
                    {
                      playlistId: playlist.id,
                      songId: song.id,
                    },
                    {
                      onSettled: () => setLoading(false),
                      onSuccess: () => setDisplay(false),
                      onError: () =>
                        setPlaylistAddError(
                          "Unable to add song to playlist?? We're working on it!",
                        ),
                    },
                  );
                }}
              >
                <div>
                  <div className="text-purple-700">{data.name}</div>
                  <div className="text-gray-600 text-sm">
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
      ) : undefined}
      {playlistAddError && <BlockAlert type="error">{playlistAddError}</BlockAlert>}
    </Modal>
  );
};
