import React from "react";
import { RouteType } from "@graywolfai/react-tiniest-router";
import { isMobile } from "./utils";
const Login = React.lazy(() => import("./pages/Login"));
const Settings = React.lazy(() => import("./mobile/pages/Settings"));
const Search = React.lazy(() => import("./pages/Search"));
const Signup = React.lazy(() => import("./pages/Signup"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const Home = React.lazy(() =>
  isMobile() ? import("./mobile/pages/Home") : import("./web/pages/Home"),
);
const Songs = React.lazy(() =>
  isMobile() ? import("./mobile/pages/Songs") : import("./web/pages/Songs"),
);
const Artists = React.lazy(() =>
  isMobile() ? import("./mobile/pages/Artists") : import("./web/pages/Artists"),
);
const Albums = React.lazy(() =>
  isMobile() ? import("./mobile/pages/Albums") : import("./web/pages/Albums"),
);
const Playlists = React.lazy(() =>
  isMobile() ? import("./mobile/pages/Playlists") : import("./web/pages/Playlists"),
);
const AlbumOverview = React.lazy(() =>
  isMobile() ? import("./mobile/pages/AlbumOverview") : import("./web/pages/AlbumOverview"),
);
const ArtistOverview = React.lazy(() =>
  isMobile() ? import("./mobile/pages/ArtistOverview") : import("./web/pages/ArtistOverview"),
);
const Generated = React.lazy(() =>
  isMobile() ? import("./mobile/pages/Generated") : import("./web/pages/Generated"),
);
const PlaylistOverview = React.lazy(() =>
  isMobile() ? import("./mobile/pages/PlaylistOverview") : import("./web/pages/PlaylistOverview"),
);
const ForgotPasswordSuccess = React.lazy(() => import("./pages/ForgotPasswordSuccess"));
const Hero = React.lazy(() =>
  isMobile() ? import("./mobile/pages/Hero") : import("./web/pages/Hero"),
);
const Account = React.lazy(() => import("./web/pages/Account"));
const Library = React.lazy(() => import("./mobile/pages/Library"));
const Invite = React.lazy(() => import("./web/pages/Invite"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = React.lazy(() => import("./pages/TermsAndConditions"));

type Route<ID extends string> = {
  id: ID;
  path: string;
  component: React.LazyExoticComponent<(opts: { container: HTMLElement | null }) => JSX.Element>;
  showTabs: boolean;
  protected: boolean;
  className: string;
  sidebar: boolean;
  title: string;
  showBack: boolean;
};

const createRoutes = <K extends string>(routes: Record<K, Route<K>>) => routes;

export interface CustomRoute extends RouteType {
  protected: boolean;
  sidebar: boolean;
  className: string;
  title: string;
}

// FIXME how can we make titles dynamic?? It would be nice to have something generic
// But the easiest solution would probably be some kind of hook
export const routes = createRoutes({
  hero: {
    id: "hero",
    path: "/",
    component: Hero,
    protected: false,
    sidebar: false,
    className: "py-2",
    title: "",
    showBack: false,
    showTabs: false,
  },
  account: {
    id: "account",
    path: "/account",
    component: Account,
    protected: true,
    sidebar: false,
    className: "py-2",
    title: "Account",
    showBack: false,
    showTabs: false,
  },
  login: {
    id: "login",
    path: "/login",
    component: Login,
    protected: false,
    sidebar: false,
    className: "py-2",
    title: "Login",
    showBack: false,
    showTabs: false,
  },
  signup: {
    id: "signup",
    path: "/signup",
    component: Signup,
    protected: false,
    sidebar: false,
    className: "py-2",
    title: "Sign Up",
    showBack: false,
    showTabs: false,
  },
  forgotPassword: {
    id: "forgotPassword",
    path: "/forgot-password",
    component: ForgotPassword,
    protected: false,
    sidebar: false,
    className: "py-2",
    title: "Forgot Password",
    showBack: false,
    showTabs: false,
  },
  forgotPasswordSuccess: {
    id: "forgotPasswordSuccess",
    path: "/forgot-password-success",
    component: ForgotPasswordSuccess,
    protected: false,
    sidebar: false,
    className: "py-2",
    title: "Forgot Password Confirmation",
    showBack: false,
    showTabs: false,
  },
  home: {
    id: "home",
    path: "/home",
    component: Home,
    protected: true,
    sidebar: true,
    className: "py-2",
    title: "Home",
    showBack: false,
    showTabs: true,
  },
  search: {
    id: "search",
    path: "/search",
    component: Search,
    protected: true,
    sidebar: true,
    className: "py-2",
    title: "Search",
    showBack: false,
    showTabs: true,
  },
  songs: {
    id: "songs",
    path: "/library/songs",
    component: Songs,
    protected: true,
    sidebar: true,
    className: "py-2",
    title: "Songs",
    showBack: true,
    showTabs: true,
  },
  albums: {
    id: "albums",
    path: "/library/albums",
    component: Albums,
    protected: true,
    sidebar: true,
    className: "py-2",
    title: "Albums",
    showBack: true,
    showTabs: true,
  },
  album: {
    id: "album",
    path: "/library/albums/:albumId",
    component: AlbumOverview,
    protected: true,
    sidebar: true,
    className: "",
    title: "Album",
    showBack: true,
    showTabs: true,
  },
  artists: {
    id: "artists",
    path: "/library/artists",
    component: Artists,
    protected: true,
    sidebar: true,
    className: "py-2",
    title: "Artists",
    showBack: true,
    showTabs: true,
  },
  artist: {
    id: "artist",
    path: "/library/artists/:artistName",
    component: ArtistOverview,
    protected: true,
    sidebar: true,
    className: "",
    title: "Artist",
    showBack: true,
    showTabs: true,
  },
  invite: {
    id: "invite",
    path: "/invite/:invite",
    component: Invite,
    protected: false,
    sidebar: false,
    className: "",
    title: "Invite",
    showBack: false,
    showTabs: false,
  },
  playlists: {
    id: "playlists",
    path: "/library/playlists",
    component: Playlists,
    protected: true,
    sidebar: true,
    className: "py-2",
    title: "Playlists",
    showBack: false,
    showTabs: true,
  },
  playlist: {
    id: "playlist",
    path: "/library/playlists/:playlistId",
    component: PlaylistOverview,
    protected: true,
    sidebar: true,
    className: "",
    title: "Playlist",
    showBack: true,
    showTabs: true,
  },
  generated: {
    id: "generated",
    path: "/library/generated/:generatedType",
    component: Generated,
    protected: true,
    sidebar: true,
    className: "",
    title: "Generated",
    showBack: true,
    showTabs: true,
  },
  privacy: {
    id: "privacy",
    path: "/privacy",
    component: PrivacyPolicy,
    protected: false,
    sidebar: false,
    className: "",
    title: "Privacy Policy",
    showBack: false,
    showTabs: false,
  },
  terms: {
    id: "terms",
    path: "/terms",
    component: TermsAndConditions,
    protected: false,
    sidebar: false,
    className: "",
    title: "Terms and Conditions",
    showBack: false,
    showTabs: false,
  },
  settings: {
    id: "settings",
    path: "/settings",
    component: Settings,
    protected: true,
    sidebar: false,
    className: "",
    title: "Settings",
    showBack: true,
    showTabs: false,
  },
  library: {
    id: "library",
    path: "/library",
    component: Library,
    showBack: false,
    title: "Library",
    showTabs: true,
    protected: true,
    sidebar: false,
    className: "",
  },
});
