import React, { useMemo, useState } from "react";
import { Song } from "../shared/types";
import { usePlayer } from "../player";
import classNames from "classnames";
import { MdMusicNote, MdPlayArrow, MdMoreVert, MdEdit, MdDelete } from "react-icons/md";
import { MetadataEditor } from "./MetadataEditor";
import { useModal } from "react-modal-hook";
import { LikedIcon } from "./LikedIcon";
import { IconButton } from "./IconButton";
import useDropdownMenu from "react-accessible-dropdown-menu-hook";
import { ContextMenu } from "./ContextMenu";
import { useConfirmAction } from "../confirm-actions";

// console.log(reactAccessibleDropdown);
// const useDropdownMenu: typeof reactAccessibleDropdown.default = (reactAccessibleDropdown.default as any)
//   .default;

export interface SongsTableProps {
  /**
   * The songs. Passing in `undefined` indicates that the songs are still loading.
   */
  songs?: Array<firebase.firestore.QueryDocumentSnapshot<Song>>;
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

export interface SongTableRowProps {
  /**
   * The song. `undefined` means it is loading.
   */
  song: firebase.firestore.QueryDocumentSnapshot<Song> | undefined;
  setSong: (song: firebase.firestore.QueryDocumentSnapshot<Song>) => void;
}

export const SongTableRow = ({ song, setSong }: SongTableRowProps) => {
  const { buttonProps, itemProps, isOpen, setIsOpen } = useDropdownMenu(2);
  const [focusedPlay, setFocusedPlay] = useState(false);
  const [showEditorModal, hideEditorModal] = useModal(() => (
    <MetadataEditor display={true} setDisplay={() => hideEditorModal()} song={defined} />
  ));
  const { confirmAction } = useConfirmAction();

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
          <MdMusicNote
            className={classNames(
              "w-5 h-5 group-hover:opacity-0 absolute",
              focusedPlay && "opacity-0",
            )}
          />
          <button
            title={`Play ${data.title}`}
            className="focus:opacity-100 group-hover:opacity-100 opacity-0"
            onFocus={() => setFocusedPlay(true)}
            onBlur={() => setFocusedPlay(false)}
            onClick={() => {}}
          >
            <MdPlayArrow className="w-5 h-5" />
          </button>
        </div>

        <div title={data.title} className="truncate">
          {data.title}
        </div>
        <IconButton
          icon={MdMoreVert}
          className="group-hover:w-8 focus:w-8 w-0 overflow-hidden py-1 pl-1 flex-shrink-0"
          hoverClassName="hover:bg-gray-400"
          iconClassName="w-0 w-6 h-6"
          {...buttonProps}
          onClick={(e) => {
            e.stopPropagation();
            buttonProps.onClick && buttonProps.onClick(e);
            setIsOpen(true);
          }}
        />
        <ContextMenu
          items={[
            {
              label: "Edit Info",
              icon: MdEdit,
              onClick: () => {
                showEditorModal();
                setIsOpen(false);
              },
              props: itemProps[0],
            },
            {
              label: "Delete",
              icon: MdDelete,
              onClick: async () => {
                setIsOpen(false);
                const confirmed = await confirmAction({
                  title: `Delete ${data.title}`,
                  subtitle: "Are you sure you want to delete this song?",
                  confirmText: "Delete Song",
                });

                if (confirmed) {
                  await song.ref.delete();
                }
              },
              props: itemProps[1],
            },
          ]}
          isOpen={isOpen}
          className="transform -translate-x-4"
        />
      </Cell>
      {/* <TextCell text={data.title} /> */}
      <TextCell title={data.artist} text={data.artist} className="h-12 truncate" />
      <TextCell title={data.albumName} text={data.albumName} className="h-12 truncate" />
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
    const snapshots: Array<firebase.firestore.QueryDocumentSnapshot<Song> | undefined> = docs
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
