import React, { useState } from "react";
import type { Song } from "../../shared/universal/types";
import { Input } from "../../components/Input";
import { usePlaylistCreate } from "../../queries/playlists";
import { Modal } from "../../components/Modal";
import { BlockAlert } from "../../components/BlockAlert";
import { AddToPlaylistList } from "../../sections/AddToPlaylistList";
import { onConditions } from "../../utils";
import { useCoolPlaylists } from "../../db";

export interface MetadataEditorProps {
  setDisplay: (display: boolean) => void;
  song: Song;
}

export const AddToPlaylistEditor = ({ song, setDisplay }: MetadataEditorProps) => {
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const playlists = useCoolPlaylists();
  const [loading, setLoading] = useState(false);
  const createPlaylist = usePlaylistCreate();
  const [error, setError] = useState("");
  const [playlistAddError, setPlaylistAddError] = useState("");

  const createNewPlaylist = () => {
    setLoading(true);
    setError("");
    onConditions(
      () => createPlaylist(newPlaylistName),
      () => {
        setNewPlaylistName("");
        setLoading(false);
      },
      () => setError("Unable to create playlist :("),
      () => setLoading(false),
    );
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
      {playlists && (
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
      <AddToPlaylistList
        song={song}
        setLoading={setLoading}
        setError={setPlaylistAddError}
        close={() => setDisplay(false)}
      />
      {playlistAddError && <BlockAlert type="error">{playlistAddError}</BlockAlert>}
    </Modal>
  );
};
