import { RouteType } from "react-tiniest-router/dist/types";

export interface CustomRoute extends RouteType {
  protected: boolean;
  sidebar: boolean;
  className: string;
  containerClassName: string;
  title: string;
}

// TODO better names for className and containerClassname
// Also all of these don't *need* these attributes
export const routes = {
  hero: {
    id: "hero",
    path: "/",
    protected: false,
    sidebar: false,
    className: "py-2",
    containerClassName: "px-5",
    title: "RELAR",
  },
  account: {
    id: "account",
    path: "/account",
    protected: true,
    sidebar: false,
    className: "py-2",
    containerClassName: "px-5",
    title: "Account | RELAR",
  },
  login: {
    id: "login",
    path: "/login",
    protected: false,
    sidebar: false,
    className: "py-2",
    containerClassName: "px-5",
    title: "Login | RELAR",
  },
  signup: {
    id: "signup",
    path: "/signup",
    protected: false,
    sidebar: false,
    className: "py-2",
    containerClassName: "px-5",
    title: "Sign Up | RELAR",
  },
  forgotPassword: {
    id: "forgot-password",
    path: "/forgot-password",
    protected: false,
    sidebar: false,
    className: "py-2",
    containerClassName: "px-5",
    title: "Forgot Password | RELAR",
  },
  forgotPasswordSuccess: {
    id: "forgot-password-success",
    path: "/forgot-password-success",
    protected: false,
    sidebar: false,
    className: "py-2",
    containerClassName: "px-5",
    title: "Forgot Password Confirmation | RELAR",
  },
  home: {
    id: "home",
    path: "/home",
    protected: true,
    sidebar: true,
    className: "py-2",
    containerClassName: "px-5",
    title: "Home | RELAR",
  },
  search: {
    id: "search",
    path: "/search",
    protected: true,
    sidebar: true,
    className: "py-2",
    containerClassName: "px-5",
    title: "Search | RELAR",
  },
  songs: {
    id: "songs",
    path: "/library/songs",
    protected: true,
    sidebar: true,
    className: "py-2",
    containerClassName: "px-5",
    title: "Songs | RELAR",
  },
  albums: {
    id: "albums",
    path: "/library/albums",
    protected: true,
    sidebar: true,
    className: "py-2",
    containerClassName: "px-5",
    title: "Albums | RELAR",
  },
  album: {
    id: "album",
    path: "/library/albums/:albumId",
    protected: true,
    sidebar: true,
    className: "",
    containerClassName: "px-5",
    title: "Album | RELAR",
  },
  artists: {
    id: "artists",
    path: "/library/artists",
    protected: true,
    sidebar: true,
    className: "py-2",
    containerClassName: "px-5",
    title: "Artists | RELAR",
  },
  artist: {
    id: "artist",
    path: "/library/artists/:artistName",
    protected: true,
    sidebar: true,
    className: "py-2",
    containerClassName: "px-5",
    title: "Artist | RELAR",
  },
  invite: {
    id: "invite",
    path: "/invite/:invite",
    protected: false,
    sidebar: false,
    className: "",
    containerClassName: "px-5",
    title: "Invite | RELAR",
  },
  // gallery: {
  //   id: 'gallery',
  //   path: '/gallery/:imageId',
  // },
} as const;
