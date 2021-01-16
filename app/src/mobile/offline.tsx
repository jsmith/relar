/**
 * THIS FILE IS NOT CURRENTLY USED AND HASN'T BEEN TESTED
 */

import React, { useContext, useEffect, useMemo, useState } from "react";
import { Plugins } from "@capacitor/core";
import { createContext } from "react";
import { createEmitter } from "../events";
import { useStateWithRef } from "../utils";
import { NativeAudioPlugin } from "@capacitor-community/native-audio";

const { NativeAudio } = (Plugins as unknown) as { NativeAudio: NativeAudioPlugin };
const { Storage } = Plugins;

const types = ["playlist", "generated", "album", "artist", "genre", "manual"] as const;
type DownloadGroupType = typeof types[number];
const isDownloadType = (type: string): type is DownloadGroupType => types.includes(type as any);

export const createDownloader = async () => {
  // FIXME add periodic cleanup of stale IDs
  // Also cleanup files that are saved but don't exist here
  const emitter = createEmitter<{ addRemoveGroup: []; songIdsChanged: [] }>();
  let { value: groups } = await Storage.get({ key: "downloaded-groups" });
  if (groups === "") groups = null;

  const downloaded: { [K in DownloadGroupType]: Set<string> } = {
    playlist: new Set(),
    generated: new Set(),
    album: new Set(),
    artist: new Set(),
    genre: new Set(),
    manual: new Set(),
  };

  let songIds: undefined | Set<string>;

  groups?.split(";").forEach((key) => {
    const [type, ids] = key.split(":");
    if (!isDownloadType(type)) return;
    ids.split(",").map((id) => downloaded[type].add(id));
  });

  const writeGroups = async () => {
    groups = types.map((type) => `${type}:` + [...downloaded[type]].join(",")).join(";");
    await Storage.set({ key: "downloaded-groups", value: groups });
  };

  const { remove: removeInitOffline } = NativeAudio.addListener(
    "init-offline",
    ({ songIds: initialSongIds }) => {
      if (songIds) throw Error('"init-offline" called twice');
      songIds = new Set(initialSongIds);
      emitter.emit("songIdsChanged");
    },
  );

  const { remove: removeDownloadComplete } = NativeAudio.addListener(
    "download-complete",
    ({ songId }) => {
      if (!songIds) throw Error('"download-complete" emitted before "init-offline"');
      songIds.add(songId);
      emitter.emit("songIdsChanged");
    },
  );

  return {
    downloaded,
    addDownloaded: (type: DownloadGroupType, id: string) => {
      downloaded[type].add(id);
      emitter.emit("addRemoveGroup");
      writeGroups();
    },
    removeDownloaded: (type: DownloadGroupType, id: string) => {
      if (!downloaded[type].has(id)) return;
      downloaded[type].delete(id);
      emitter.emit("addRemoveGroup");
      writeGroups();
    },
    hasGroup: (type: DownloadGroupType, id: string) => downloaded[type].has(id),
    hasSong: (id: string) => songIds?.has(id),
    onAddDownloadedGroup: (cb: () => void) => emitter.on("addRemoveGroup", cb),
    dispose: () => {
      // FIXME call this
      removeInitOffline();
      removeDownloadComplete();
    },
    onDownloadComplete: (cb: () => void) => emitter.on("songIdsChanged", cb),
  };
};

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;

export type Downloader = ThenArg<ReturnType<typeof createDownloader>>;

const OfflineContext = createContext<{ downloader: Downloader | undefined }>({
  downloader: undefined,
});

export const OfflineProvider = ({ children }: { children: React.ReactNode }) => {
  const [downloader, setDownloader] = useState<Downloader>();

  useEffect(() => {
    createDownloader().then(setDownloader);
  }, []);

  return <OfflineContext.Provider value={{ downloader }}>{children}</OfflineContext.Provider>;
};

const useOffline = () => {
  return useContext(OfflineContext);
};

export const useIsDownloadedGroup = (type: DownloadGroupType, id: string) => {
  const { downloader } = useOffline();
  const [downloaded, setDownloaded, downloadedRef] = useStateWithRef(
    downloader?.hasGroup(type, id),
  );

  useEffect(() => {
    const check = () => {
      const downloaded = downloader?.hasGroup(type, id);
      if (downloaded !== downloadedRef.current) setDownloaded(downloaded);
    };

    // Check right away and then whenever something is added
    check();
    return downloader?.onAddDownloadedGroup(check);
  }, [downloadedRef, downloader, id, setDownloaded, type]);

  return downloaded;
};

export type DownloadedSongState = "downloaded" | "pending" | "not-downloaded";

export const useIsDownloadedSong = (id: string) => {
  const { downloader } = useOffline();
  const [downloaded, setDownloaded, downloadedRef] = useStateWithRef(downloader?.hasSong(id));

  useEffect(() => {
    const check = () => {
      const downloaded = downloader?.hasSong(id);
      if (downloaded !== downloadedRef.current) setDownloaded(downloaded);
    };

    // Check right away and then whenever something is added
    check();
    return downloader?.onAddDownloadedGroup(check);
  }, [downloadedRef, downloader, id, setDownloaded]);

  return downloaded;
};
