import React, { useState, useEffect, useRef } from "react";
import type { Song, MetadataAPI } from "../shared/universal/types";
import { OkCancelModal } from "../components/OkCancelModal";
import { Input } from "../components/Input";
import { metadataBackend, getOrUnknownError } from "../backend";
import { useDefinedUser } from "../auth";
import { BlockAlert } from "../components/BlockAlert";
import { useSongRef } from "../firestore";
import { Thumbnail } from "../components/Thumbnail";
import { parseIntOr } from "../utils";
import { useModal } from "react-modal-hook";
import { createEmitter } from "../events";

export const PositionInformation = ({
  label,
  of,
  setOf,
  no,
  setNo,
}: {
  label: string;
  of: number | null;
  no: number | null;
  setOf: (value: number | null) => void;
  setNo: (value: number | null) => void;
}) => {
  return (
    <fieldset className="min-w-0">
      <legend>{label}</legend>
      <div className="flex items-center space-x-1">
        <input
          value={no ?? ""}
          type="number"
          onChange={(e) => setNo(e.target.value ? +e.target.value : null)}
          aria-label="Number"
          className="min-w-0 form-input"
        />
        <span>of</span>
        <input
          value={of ?? ""}
          type="number"
          onChange={(e) => setOf(e.target.value ? +e.target.value : null)}
          aria-label="Total"
          className="min-w-0 form-input"
        />
      </div>
    </fieldset>
  );
};

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
  const [year, setYear] = useState<number>();
  const [error, setError] = useState("");
  const [trackNo, setTrackNo] = useState<number | null>(null);
  const [trackOf, setTrackOf] = useState<number | null>(null);
  const [diskNo, setDiskNo] = useState<number | null>(null);
  const [diskOf, setDiskOf] = useState<number | null>(null);

  useEffect(() => {
    setTitle(song.title ?? "");
    setArtist(song.artist ?? "");
    setAlbumArtist(song.albumArtist ?? "");
    setAlbumName(song.albumName ?? "");
    setGenre(song.genre ?? "");
    setYear(typeof song.year === "number" ? song.year : parseIntOr(song.year, undefined));
    setTrackNo(song.track?.no ?? null);
    setTrackOf(song.track?.of ?? null);
    setDiskNo(song.disk?.no ?? null);
    setDiskOf(song.disk?.of ?? null);
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
      track: {
        no: trackNo,
        of: trackOf,
      },
      disk: {
        no: diskNo,
        of: diskOf,
      },
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
    >
      <div className="flex space-x-4">
        <div className="space-y-2 w-3/5">
          <Input inputId="title-input" value={title} onChange={setTitle} label="Title" />
          <Input value={artist} onChange={setArtist} label="Artist" />
          <Input value={albumArtist} onChange={setAlbumArtist} label="Album Artist" />
          <Input value={albumName} onChange={setAlbumName} label="Album" />
          <Input value={genre} onChange={setGenre} label="Genre" />
          <Input type="number" value={year} onChange={setYear} label="Year" />
        </div>
        <div className="w-2/5 space-y-2">
          <div className="space-y-1">
            <Thumbnail size="128" type="song" object={song} className="w-32 h-32" />
            <p className="text-xs text-gray-700">The thumbnail is not yet editable.</p>
          </div>
          <PositionInformation
            no={trackNo}
            of={trackOf}
            setNo={setTrackNo}
            setOf={setTrackOf}
            label="Track"
          />
          <PositionInformation
            no={diskNo}
            of={diskOf}
            setNo={setDiskNo}
            setOf={setDiskOf}
            label="Disc"
          />
        </div>
      </div>

      {error && <BlockAlert type="error">{error}</BlockAlert>}
    </OkCancelModal>
  );
};

const events = createEmitter<{ show: [Song] }>();

export const showSongEditor = (song: Song) => {
  events.emit("show", song);
};

export const useMetadataEditor = () => {
  const song = useRef<Song>();
  const [showEditorModal, hideEditorModal] = useModal(
    () =>
      song.current ? (
        <MetadataEditor
          setDisplay={() => hideEditorModal()}
          song={song.current}
          onSuccess={() => {}}
        />
      ) : null,
    [],
  );

  useEffect(() => {
    return events.on("show", (newSong) => {
      song.current = newSong;
      showEditorModal();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
