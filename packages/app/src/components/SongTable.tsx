import React, { useMemo } from "react";
import { Song } from "../shared/types";
import { usePlayer } from "../player";
import classNames from "classnames";
import { MdMusicNote, MdPlayArrow, MdMoreVert } from "react-icons/md";
import { MetadataEditor } from "./MetadataEditor";
import { useModal } from "react-modal-hook";
import { LikedIcon } from "./LikedIcon";
import { QueryDocumentSnapshot } from "src/shared/utils";
import { IconButton } from "./IconButton";
import * as reactAccessibleDropdown from "react-accessible-dropdown-menu-hook";
import { bgApp } from "src/classes";

const useDropdownMenu: typeof reactAccessibleDropdown.default = (reactAccessibleDropdown.default as any)
  .default;

export interface SongsTableProps {
  /**
   * The songs. Passing in `undefined` indicates that the songs are still loading.
   */
  songs?: Array<QueryDocumentSnapshot<Song>>;
  loadingRows?: number;
}

export const HeaderCol = ({
  label,
  width,
  className,
}: {
  label: React.ReactNode;
  width: string;
  className?: string;
}) => {
  return (
    <th
      className={classNames(
        "border-b border-gray-700 border-opacity-25 text-left text-gray-800 text-xs font-medium uppercase tracking-wider",
        className,
      )}
      style={{ width }}
    >
      {label}
    </th>
  );
};

export interface SongTableRow {
  /**
   * The song. `undefined` means it is loading.
   */
  song: QueryDocumentSnapshot<Song> | undefined;
  setSong: (song: QueryDocumentSnapshot<Song>) => void;
}

export const Cell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <td
      className={classNames(
        "h-12 whitespace-no-wrap border-b border-gray-200 border-opacity-25 cursor-pointer",
        className,
      )}
    >
      {children}
    </td>
  );
};

export const LoadingCell = ({ width }: { width?: number }) => {
  return (
    <Cell className="px-6 py-4">
      <div className="pr-3">{/* <Skeleton width={width} /> */}</div>
    </Cell>
  );
};

export const TextCell = ({
  text,
  className,
  title,
}: {
  text?: string;
  className: string;
  title?: string;
}) => {
  return (
    <Cell className={className}>
      <div title={title}>{text}</div>
    </Cell>
  );
};

export const SongTableRow = ({ song, setSong }: SongTableRow) => {
  const { buttonProps, itemProps, isOpen, setIsOpen } = useDropdownMenu(2);
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
    <tr
      className="group hover:bg-gray-300 text-gray-700 text-sm"
      key={song.id}
      onClick={() => setSong(defined)}
    >
      <Cell className="flex space-x-2 items-center h-12">
        <div className="w-5 h-5">
          <MdMusicNote className="w-5 h-5 group-hover:opacity-0 absolute" />
          <MdPlayArrow className="w-5 h-5 group-hover:opacity-100 opacity-0" />
        </div>

        <div title={data.title} className="truncate">
          {data.title}
        </div>
        <IconButton
          icon={MdMoreVert}
          className="group-hover:w-16 focus:w-16 w-0 overflow-hidden py-1 pl-1"
          hoverClassName="hover:bg-gray-400"
          iconClassName="w-0 w-6 h-6"
          {...buttonProps}
          onClick={(e) => {
            buttonProps.onClick && buttonProps.onClick(e);
            setIsOpen(true);
          }}
        />
        <div className="relative">
          <div
            className={classNames(
              isOpen ? "display" : "display",
              "absolute flex flex-col bg-gray-100",
            )}
            style={{ backgroundColor: bgApp }}
            role="menu"
          >
            <a {...itemProps[0]} href="https://example.com">
              Regular link
            </a>
            <a {...itemProps[1]}>With click handler</a>
          </div>
        </div>
      </Cell>
      {/* <TextCell text={data.title} /> */}
      <TextCell title={data.artist?.name} text={data.artist?.name} className="h-12 truncate" />
      <TextCell title={data.album?.name} text={data.album?.name} className="h-12 truncate" />
      <TextCell text={`${data.played ?? ""}`} className="h-12 truncate" />
      <TextCell text={"4:10"} className="h-12 truncate" />
      <Cell className="h-12 truncate">
        <LikedIcon song={song} />
      </Cell>
    </tr>
  );
};

export const SongTable = ({ songs: docs, loadingRows = 20 }: SongsTableProps) => {
  const [_, setSong] = usePlayer();

  const rows = useMemo(() => {
    const snapshots: Array<QueryDocumentSnapshot<Song> | undefined> = docs
      ? docs
      : Array(loadingRows)
          .fill(undefined)
          .map(() => undefined);

    return snapshots.map((song, i) => (
      <SongTableRow song={song} setSong={setSong} key={song?.id ?? i} />
    ));
  }, [loadingRows, setSong, docs]);

  return (
    <table className="text-gray-800 table-fixed w-full">
      <thead>
        <tr>
          {/* <HeaderCol label={""} className={""} /> */}
          <HeaderCol width="42%" label="Title" className="py-3" />
          <HeaderCol width="32%" label="Artist" className="py-3" />
          <HeaderCol width="26%" label="Album" className="py-3" />
          <HeaderCol width="50px" label={<MdMusicNote className="w-5 h-5" />} className="py-3" />
          <HeaderCol width="60px" label="" className="py-3" />
          <HeaderCol width="90px" label="" className="py-3" />
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
};
