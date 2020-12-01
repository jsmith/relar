import { Modals } from "@capacitor/core";
import { captureException } from "@sentry/browser";
import React from "react";
import { HiPlus } from "react-icons/hi";
import { usePlaylistCreate } from "../queries/playlists";
import { AddToPlaylistList } from "../sections/AddToPlaylistList";
import { Song } from "../shared/universal/types";
import { onConditions } from "../utils";
import { useSlideUpScreen } from "./slide-up-screen";

const AddToPlaylistMenu = ({ song, hide }: { song: Song; hide: () => void }) => {
  return (
    <div className="flex flex-col py-2">
      <AddToPlaylistList
        song={song}
        setLoading={() => {}}
        setError={(error) => error && Modals.alert({ title: "Error", message: error })}
        close={hide}
      />
    </div>
  );
};

export const useAddToPlaylist = (song: Song) => {
  const createPlaylist = usePlaylistCreate();

  const { show } = useSlideUpScreen(
    "Add to Playlist",
    AddToPlaylistMenu,
    { song },
    {
      title: "Add New Playlist",
      icon: HiPlus,
      onClick: async () => {
        const { value, cancelled } = await Modals.prompt({
          message: "What do you want to name your new playlist?",
          title: "Playlist Name",
        });

        if (cancelled) return;
        onConditions(() => createPlaylist(value)).onError((e) => {
          captureException(e);
          Modals.alert({
            title: "Error",
            message: "There was an unknown error creating playlist.",
          });
        });
      },
    },
  );

  return show;
};
