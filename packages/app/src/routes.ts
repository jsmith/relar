import { RouteType } from "react-tiniest-router/dist/types";

export interface CustomRoute extends RouteType {
  protected: boolean;
  sidebar: boolean;
  className: string;
  containerClassName: string;
}

// TODO better names for className and containerClassname
// Also all of these don't *need* these attributes
export const routes = {
  profile: {
    id: "profile",
    path: "/profile",
    protected: true,
    sidebar: false,
    className: "py-2",
    containerClassName: "px-5",
  },
  login: {
    id: "login",
    path: "/login",
    protected: false,
    sidebar: false,
    className: "py-2",
    containerClassName: "px-5",
  },
  signup: {
    id: "signup",
    path: "/signup",
    protected: false,
    sidebar: false,
    className: "py-2",
    containerClassName: "px-5",
  },
  forgotPassword: {
    id: "forgot-password",
    path: "/forgot-password",
    protected: false,
    sidebar: false,
    className: "py-2",
    containerClassName: "px-5",
  },
  forgotPasswordSuccess: {
    id: "forgot-password-success",
    path: "/forgot-password-success",
    protected: false,
    sidebar: false,
    className: "py-2",
    containerClassName: "px-5",
  },
  home: {
    id: "home",
    path: "/",
    protected: true,
    sidebar: true,
    className: "py-2",
    containerClassName: "px-5",
  },
  search: {
    id: "search",
    path: "/search",
    protected: true,
    sidebar: true,
    className: "py-2",
    containerClassName: "px-5",
  },
  songs: {
    id: "songs",
    path: "/library/songs",
    protected: true,
    sidebar: true,
    className: "py-2",
    containerClassName: "px-5",
  },
  albums: {
    id: "albums",
    path: "/library/albums",
    protected: true,
    sidebar: true,
    className: "py-2",
    containerClassName: "px-5",
  },
  album: {
    id: "album",
    path: "/library/albums/:albumId",
    protected: true,
    sidebar: true,
    className: "",
    containerClassName: "px-5",
  },
  artists: {
    id: "artists",
    path: "/library/artists",
    protected: true,
    sidebar: true,
    className: "py-2",
    containerClassName: "px-5",
  },
  // gallery: {
  //   id: 'gallery',
  //   path: '/gallery/:imageId',
  // },
} as const;
