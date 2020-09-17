import React, { useState, useMemo } from "react";
import { fmtMSS, pluralSongs, useGradient } from "../shared/web/utils";
import classNames from "classnames";
import { SongTable, SongTableItem } from "./SongTable";
import { ErrorTemplate } from "../shared/web/components/ErrorTemplate";
import { MdPlayCircleOutline } from "react-icons/md";
import { HiDotsHorizontal, HiPencil, HiTrash } from "react-icons/hi";
import { ContentEditable } from "../shared/web/components/ContentEditable";
import { Skeleton } from "../shared/web/components/Skeleton";
import { Collage } from "../shared/web/components/Collage";
import { useQueue, SetQueueSource, SongInfo, isSongInfo } from "../shared/web/queue";
import { Song } from "../shared/universal/types";
import { useSongsDuration } from "../shared/web/queries/songs";
import { QueryStatus } from "react-query";
import { ContextMenuItem, ContextMenu } from "../shared/web/components/ContextMenu";

export interface SongsOverviewProps {
  container: HTMLElement | null;
  /**
   * Define this if you can rename the title. It should return whether or not the rename was successful.
   */
  onRename?: (newValue: string) => Promise<boolean>;
  onDelete?: () => Promise<void>;
  status: QueryStatus;
  /** The title string. Undefined means that it is still loading. */
  title: string | undefined;
  /** The songs. */
  songs: Array<SongInfo | firebase.firestore.QueryDocumentSnapshot<Song>>;
  infoPoints?: Array<string | undefined>;
  songActions?: SongTableItem[];
  source: SetQueueSource;
  includeDateAdded?: boolean;
}

export const SongsOverview = ({
  container,
  onRename,
  onDelete,
  status,
  title,
  songs: songsMixed,
  infoPoints,
  songActions,
  source,
  includeDateAdded,
}: SongsOverviewProps) => {
  const { setQueue } = useQueue();
  const [averageColor, setAverageColor] = useState("#cbd5e0");
  const { from, to, isLight } = useGradient(averageColor);
  const [editingName, setEditingName] = useState(false);
  const songs = useMemo(() => songsMixed.map((item) => (isSongInfo(item) ? item.song : item)), [
    songsMixed,
  ]);
  const songDuration = useSongsDuration(songs);

  const options = useMemo(() => {
    const options: ContextMenuItem[] = [];

    if (onRename) {
      options.push({
        icon: HiPencil,
        label: "Edit Name",
        onClick: () => setEditingName(true),
      });
    }

    if (onDelete) {
      options.push({
        icon: HiTrash,
        label: "Delete",
        onClick: onDelete,
      });
    }

    return options;
  }, [onDelete, onRename]);

  const infoPointsString = useMemo(() => {
    return [
      ...(infoPoints?.filter((value) => !!value) ?? []),
      `${songs.length} ${pluralSongs(songs.length)}`,
      fmtMSS(songDuration / 1000),
    ].join(" • ");
  }, [infoPoints, songDuration, songs.length]);

  return (
    <div>
      <div
        className="flex items-end p-8"
        style={{
          height: "400px",
          backgroundImage: `linear-gradient(to bottom, ${from}, ${to})`,
        }}
      >
        <Collage
          size="256"
          snapshots={songs}
          className="w-64 h-64"
          setAverageColor={setAverageColor}
        />
        {status === "error" ? (
          <ErrorTemplate />
        ) : (
          <div className={classNames("ml-4", isLight ? "text-gray-700" : "text-gray-200")}>
            <div className="flex items-center">
              {title ? (
                <ContentEditable
                  initial={title}
                  cancelEditing={() => setEditingName(false)}
                  editable={editingName}
                  onSave={(name) => {
                    if (!onRename) return false;
                    return onRename(name);
                  }}
                  className="font-bold text-5xl"
                />
              ) : (
                <Skeleton className="opacity-25 w-48 h-10 my-4" />
              )}

              <ContextMenu
                button={(props) => (
                  <button {...props} className="ml-3">
                    <HiDotsHorizontal className="w-8 h-8" />
                  </button>
                )}
                items={options}
                className="transform -translate-x-4"
                menuClassName="w-48"
              />
              <button
                onClick={() =>
                  setQueue({
                    songs,
                    source,
                  })
                }
                className="ml-3"
              >
                <MdPlayCircleOutline className="w-10 h-10" />
              </button>
            </div>
            {status === "loading" ? (
              <Skeleton className="opacity-25 w-full" />
            ) : (
              <span>{infoPointsString}</span>
            )}
          </div>
        )}
      </div>
      <div>
        <div>
          {status === "error" ? (
            <ErrorTemplate />
          ) : (
            <SongTable
              songs={status === "loading" ? undefined : songs}
              container={container}
              actions={songActions}
              source={source}
              includeDateAdded={includeDateAdded}
            />
          )}
        </div>
      </div>
    </div>
  );
};
