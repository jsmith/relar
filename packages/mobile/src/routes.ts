import { Home } from "./pages/Home";
import { Library } from "./pages/Library";
import { Login } from "./shared/web/pages/Login";
import { Signup } from "./shared/web/pages/Signup";
import { ForgotPassword } from "./shared/web/pages/ForgotPassword";
import { ForgotPasswordSuccess } from "./shared/web/pages/ForgotPasswordSuccess";
import { Search } from "./shared/web/pages/Search";
import { PrivacyPolicy } from "./shared/web/pages/PrivacyPolicy";
import { TermsAndConditions } from "./shared/web/pages/TermsAndConditions";
import { Settings } from "./pages/Settings";
import { Welcome } from "./pages/Welcome";
import { Songs } from "./pages/Songs";
import { Albums } from "./pages/Albums";
import { Artists } from "./pages/Artists";
import { Playlists } from "./pages/Playlists";
import { AlbumOverview } from "./pages/AlbumOverview";
import { ArtistOverview } from "./pages/ArtistOverview";
import { PlaylistOverview } from "./pages/PlaylistOverview";
import Generated from "./pages/Generated";

type Route<ID extends string> = {
  id: ID;
  path: string;
  component: () => JSX.Element;
  showTabs: boolean;
  protected: boolean;
} & ({ title: string; showBack: boolean } | { title: false });

const createRoutes = <K extends string, T extends { [_: string]: Route<K> }>(routes: T): T =>
  routes;

export const routes = createRoutes({
  home: {
    id: "home",
    path: "/home",
    component: Home,
    showBack: false,
    title: "Home",
    showTabs: true,
    protected: true,
  },
  login: {
    id: "login",
    path: "/login",
    component: Login,
    showBack: true,
    title: "Login",
    showTabs: false,
    protected: false,
  },
  signup: {
    id: "signup",
    path: "/signup",
    component: Signup,
    showBack: true,
    title: "Sign Up",
    showTabs: false,
    protected: false,
  },
  search: {
    id: "search",
    path: "/search",
    component: Search,
    showBack: false,
    title: "Search",
    showTabs: true,
    protected: true,
  },
  library: {
    id: "library",
    path: "/library",
    component: Library,
    showBack: false,
    title: "Library",
    showTabs: true,
    protected: true,
  },
  settings: {
    id: "settings",
    path: "/settings",
    component: Settings,
    showBack: true,
    title: "Settings",
    showTabs: false,
    protected: true,
  },
  welcome: {
    id: "welcome",
    path: "/",
    component: Welcome,
    title: false,
    showTabs: false,
    protected: false,
  },
  forgotPassword: {
    id: "forgot-password",
    path: "/forgot-password",
    component: ForgotPassword,
    title: false,
    showTabs: false,
    protected: false,
  },
  forgotPasswordSuccess: {
    id: "forgot-password-success",
    path: "/forgot-password-success",
    component: ForgotPasswordSuccess,
    title: false,
    showTabs: false,
    protected: false,
  },
  songs: {
    id: "songs",
    path: "/library/songs",
    component: Songs,
    showBack: true,
    title: "Songs",
    showTabs: true,
    protected: true,
  },
  albums: {
    id: "albums",
    path: "/library/albums",
    component: Albums,
    showBack: true,
    title: "Albums",
    showTabs: true,
    protected: true,
  },
  album: {
    id: "album",
    path: "/library/albums/:albumId",
    component: AlbumOverview,
    title: false,
    showTabs: true,
    protected: true,
  },
  artists: {
    id: "artists",
    path: "/library/artists",
    component: Artists,
    showBack: true,
    title: "Artists",
    showTabs: true,
    protected: true,
  },
  artist: {
    id: "artist",
    path: "/library/artists/:artistName",
    component: ArtistOverview,
    title: false,
    showTabs: true,
    protected: true,
  },
  playlists: {
    id: "playlists",
    path: "/library/playlists",
    component: Playlists,
    showBack: true,
    title: "Playlists",
    showTabs: true,
    protected: true,
  },
  playlist: {
    id: "playlist",
    path: "/library/playlists/:playlistId",
    component: PlaylistOverview,
    title: false,
    showTabs: true,
    protected: true,
  },
  generated: {
    id: "generated",
    path: "/library/generated/:generatedType",
    component: Generated,
    title: false,
    showTabs: true,
    protected: true,
  },
  privacy: {
    id: "privacy",
    path: "/privacy",
    component: PrivacyPolicy,
    showBack: true,
    title: "Privacy",
    showTabs: false,
    protected: true,
  },
  terms: {
    id: "terms",
    path: "/terms",
    component: TermsAndConditions,
    showBack: true,
    title: "Terms",
    showTabs: false,
    protected: true,
  },
});
