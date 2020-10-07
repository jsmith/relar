import React, { useState, useEffect } from "react";
import type { Song, MetadataAPI } from "../shared/universal/types";
import { OkCancelModal } from "../components/OkCancelModal";
import { Input } from "../components/Input";
import { metadataBackend, getOrUnknownError } from "../backend";
import { useDefinedUser } from "../auth";
import { BlockAlert } from "../components/BlockAlert";
import { useSongRef } from "../firestore";

export interface MetadataEditorProps {
  setDisplay: (display: boolean) => void;
  song: Song;
  onSuccess: (song: Song) => void;
}

export const MetadataEditor = ({ song, setDisplay, onSuccess }: MetadataEditorProps) => {
  const user = useDefinedUser();
  const ref = useSongRef(song);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [albumArtist, setAlbumArtist] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(song.title ?? "");
    setArtist(song.artist ?? "");
    setAlbumArtist(song.albumArtist ?? "");
    setAlbumName(song.albumName ?? "");
    setGenre(song.genre ?? "");
    setYear(song.year ?? "");
  }, [song]);

  const submit = async () => {
    setError("");

    const update: MetadataAPI["/edit"]["POST"]["body"]["update"] = {
      title: title,
      artist: artist,
      albumArtist: albumArtist,
      albumName: albumName,
      genre: genre,
      year: year,
    };

    const idToken = await user.getIdToken();
    const result = await getOrUnknownError(() =>
      metadataBackend().post("/edit", {
        idToken,
        songId: song.id,
        update,
      }),
    );

    if (result.data.type === "success") {
      setDisplay(false);

      ref.get().then((snapshot) => {
        const data = snapshot.data();
        if (data) {
          // TODO
          // setData(data);
          onSuccess(data);
        }
      });

      return;
    }

    switch (result.data.code) {
      case "missing-title":
        setError("A title is required.");
        break;
      default:
        setError("An unknown error occurred. Please try again!");
    }
  };

  return (
    <OkCancelModal
      titleText="Metadata Editor"
      initialFocus="#title-input"
      onCancel={() => setDisplay(false)}
      onOk={submit}
      wrapperClassName="space-y-2"
    >
      <Input inputId="title-input" value={title} onChange={setTitle} label="Title" />
      <Input value={artist} onChange={setArtist} label="Artist" />
      <Input value={albumArtist} onChange={setAlbumArtist} label="Album Artist" />
      <Input value={albumName} onChange={setAlbumName} label="Album" />
      <Input value={genre} onChange={setGenre} label="Genre" />
      <Input value={year} onChange={setYear} label="Year" />

      {error && <BlockAlert type="error">{error}</BlockAlert>}
    </OkCancelModal>
  );
};
