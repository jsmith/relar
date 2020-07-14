import React, { useState } from "react";
import { DocumentSnapshot, QueryDocumentSnapshot } from "src/shared/utils";
import { Song } from "src/shared/types";
import { MdMusicNote, MdPlayArrow } from "react-icons/md";
import { Cell, LoadingCell, TextCell } from "./Cell";
import { MetadataEditor } from "./MetadataEditor";
import { useModal } from "react-modal-hook";
import { LikedIcon } from "./LikedIcon";

export interface SongTableRow {
  /**
   * The song. `undefined` means it is loading.
   */
  song: QueryDocumentSnapshot<Song> | undefined;
  setSong: (song: QueryDocumentSnapshot<Song>) => void;
}

export const SongTableRow = ({ song, setSong }: SongTableRow) => {
  const [showModal, hideModal] = useModal(() => (
    <MetadataEditor display={true} setDisplay={() => hideModal()} song={defined} />
  ));

  if (!song) {
    return (
      <tr>
        <LoadingCell />
        <LoadingCell />
        <LoadingCell />
      </tr>
    );
  }

  const defined = song;
  const data = song.data();
  return (
    <tr className="group hover:bg-gray-300" key={song.id} onClick={() => setSong(defined)}>
      <Cell>
        <MdMusicNote className="w-5 h-5 group-hover:opacity-0 absolute" />
        <MdPlayArrow className="w-5 h-5 group-hover:opacity-100 opacity-0" />
      </Cell>
      <TextCell text={data.title} />
      <TextCell text={data.artist?.name} />
      <TextCell text={data.album?.name} />
      <TextCell text={`${data.played ?? ""}`} />
      <TextCell text={"4:10"} />
      <Cell>
        <LikedIcon song={song} />
      </Cell>
    </tr>
  );
};
