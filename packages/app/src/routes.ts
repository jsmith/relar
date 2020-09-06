import { RouteType } from "react-tiniest-router/dist/types";

export interface CustomRoute extends RouteType {
  protected: boolean;
  sidebar: boolean;
  className: string;
  title: string;
}

// FIXME how can we make titles dynamic?? It would be nice to have something generic
// But the easiest solution would probably be some kind of hook
export const routes = {
  hero: {
    id: "hero",
    path: "/",
    protected: false,
    sidebar: false,
    className: "py-2",
    title: "RELAR",
  },
  account: {
    id: "account",
    path: "/account",
    protected: true,
    sidebar: false,
    className: "py-2",
    title: "Account | RELAR",
  },
  login: {
    id: "login",
    path: "/login",
    protected: false,
    sidebar: false,
    className: "py-2",
    title: "Login | RELAR",
  },
  signup: {
    id: "signup",
    path: "/signup",
    protected: false,
    sidebar: false,
    className: "py-2",
    title: "Sign Up | RELAR",
  },
  forgotPassword: {
    id: "forgot-password",
    path: "/forgot-password",
    protected: false,
    sidebar: false,
    className: "py-2",
    title: "Forgot Password | RELAR",
  },
  forgotPasswordSuccess: {
    id: "forgot-password-success",
    path: "/forgot-password-success",
    protected: false,
    sidebar: false,
    className: "py-2",
    title: "Forgot Password Confirmation | RELAR",
  },
  home: {
    id: "home",
    path: "/home",
    protected: true,
    sidebar: true,
    className: "py-2",
    title: "Home | RELAR",
  },
  search: {
    id: "search",
    path: "/search",
    protected: true,
    sidebar: true,
    className: "py-2",
    title: "Search | RELAR",
  },
  songs: {
    id: "songs",
    path: "/library/songs",
    protected: true,
    sidebar: true,
    className: "py-2",
    title: "Songs | RELAR",
  },
  albums: {
    id: "albums",
    path: "/library/albums",
    protected: true,
    sidebar: true,
    className: "py-2",
    title: "Albums | RELAR",
  },
  album: {
    id: "album",
    path: "/library/albums/:albumId",
    protected: true,
    sidebar: true,
    className: "",
    title: "Album | RELAR",
  },
  artists: {
    id: "artists",
    path: "/library/artists",
    protected: true,
    sidebar: true,
    className: "py-2",
    title: "Artists | RELAR",
  },
  artist: {
    id: "artist",
    path: "/library/artists/:artistName",
    protected: true,
    sidebar: true,
    className: "",
    title: "Artist | RELAR",
  },
  invite: {
    id: "invite",
    path: "/invite/:invite",
    protected: false,
    sidebar: false,
    className: "",
    title: "Invite | RELAR",
  },
  playlists: {
    id: "playlists",
    path: "/library/playlists",
    protected: true,
    sidebar: true,
    className: "py-2",
    title: "Playlists | RELAR",
  },
  playlist: {
    id: "playlist",
    path: "/library/playlists/:playlistId",
    protected: true,
    sidebar: true,
    className: "",
    title: "Playlist | RELAR",
  },
  generated: {
    id: "generated",
    path: "/library/generated/:generatedType",
    protected: true,
    sidebar: true,
    className: "",
    title: "Generated | RELAR",
  },
} as const;
