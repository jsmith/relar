import React, { useEffect } from "react";
import { RouterContextType, RouteType, useRouter } from "@graywolfai/react-tiniest-router";
import { isMobile, IS_WEB_VIEW } from "./utils";
import { createEmitter } from "./events";
import { GeneratedType } from "./queue";
import { Song } from "./shared/universal/types";
import { getAlbumArtistFromSong } from "./queries/album";
const Genres = React.lazy(() => import("./web/pages/Genres"));
const GenreOverview = React.lazy(() => import("./web/pages/GenreOverview"));
const ReleaseNotes = React.lazy(() => import("./pages/ReleaseNotes"));
const BetaGuide = React.lazy(() => import("./pages/BetaGuide"));
const Login = React.lazy(() => import("./pages/Login"));
const Settings = React.lazy(() => import("./mobile/pages/Settings"));
// FIXME this is def not what we want to show on mobile
const Search = React.lazy(() => import("./pages/Search"));
const Signup = React.lazy(() => import("./pages/Signup"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const Home = React.lazy(() =>
  IS_WEB_VIEW
    ? import("./mobile/pages/Home")
    : isMobile()
    ? import("./pages/UseDesktop")
    : import("./web/pages/Home"),
);
const Songs = React.lazy(() =>
  IS_WEB_VIEW
    ? import("./mobile/pages/Songs")
    : isMobile()
    ? import("./pages/UseDesktop")
    : import("./web/pages/Songs"),
);
const Artists = React.lazy(() =>
  IS_WEB_VIEW
    ? import("./mobile/pages/Artists")
    : isMobile()
    ? import("./pages/UseDesktop")
    : import("./web/pages/Artists"),
);
const Albums = React.lazy(() =>
  IS_WEB_VIEW
    ? import("./mobile/pages/Albums")
    : isMobile()
    ? import("./pages/UseDesktop")
    : import("./web/pages/Albums"),
);
const Playlists = React.lazy(() =>
  IS_WEB_VIEW
    ? import("./mobile/pages/Playlists")
    : isMobile()
    ? import("./pages/UseDesktop")
    : import("./web/pages/Playlists"),
);
const AlbumOverview = React.lazy(() =>
  IS_WEB_VIEW
    ? import("./mobile/pages/AlbumOverview")
    : isMobile()
    ? import("./pages/UseDesktop")
    : import("./web/pages/AlbumOverview"),
);
const ArtistOverview = React.lazy(() =>
  IS_WEB_VIEW
    ? import("./mobile/pages/ArtistOverview")
    : isMobile()
    ? import("./pages/UseDesktop")
    : import("./web/pages/ArtistOverview"),
);
const Generated = React.lazy(() =>
  IS_WEB_VIEW
    ? import("./mobile/pages/Generated")
    : isMobile()
    ? import("./pages/UseDesktop")
    : import("./web/pages/Generated"),
);
const PlaylistOverview = React.lazy(() =>
  IS_WEB_VIEW
    ? import("./mobile/pages/PlaylistOverview")
    : isMobile()
    ? import("./pages/UseDesktop")
    : import("./web/pages/PlaylistOverview"),
);
const ForgotPasswordSuccess = React.lazy(() => import("./pages/ForgotPasswordSuccess"));
const Hero = React.lazy(() =>
  IS_WEB_VIEW ? import("./mobile/pages/Hero") : import("./web/pages/Hero"),
);
const Account = React.lazy(() => import("./web/pages/Account"));
const Library = React.lazy(() => import("./mobile/pages/Library"));
const Invite = React.lazy(() => import("./web/pages/Invite"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = React.lazy(() => import("./pages/TermsAndConditions"));

type Route<ID extends string> = {
  id: ID;
  path: string;
  component: React.LazyExoticComponent<() => JSX.Element>;
  showTabs: boolean;
  protected: boolean;
  className?: string;
  mobileClassName?: string;
  sidebar: boolean;
  title: string | false;
  showBack: boolean;
  /** What screen color the background is (mobile only). */
  dark?: boolean;
};

const createRoutes = <K extends string>(routes: Record<K, Route<K>>) => routes;

export type NavigatorRoutes = {
  hero: {
    params: {};
    queryParams: {};
  };

  account: {
    params: {};
    queryParams: {};
  };
  login: {
    params: {};
    queryParams: {};
  };
  signup: {
    params: {};
    queryParams: {};
  };
  forgotPassword: {
    params: {};
    queryParams: {};
  };
  forgotPasswordSuccess: {
    params: {};
    queryParams: {};
  };
  home: {
    params: {};
    queryParams: {};
  };
  search: {
    params: {};
    queryParams: {
      query: string;
    };
  };
  songs: {
    params: {};
    queryParams: {};
  };
  albums: {
    params: {};
    queryParams: {};
  };
  album: {
    params: { album: string; artist: string };
    queryParams: {};
  };
  "release-notes": {
    params: {};
    queryParams: {};
  };
  terms: {
    params: {};
    queryParams: {};
  };
  privacy: {
    params: {};
    queryParams: {};
  };
  artists: {
    params: {};
    queryParams: {};
  };
  artist: {
    params: { artistName: string };
    queryParams: {};
  };
  invite: {
    params: { invite: string };
    queryParams: {};
  };
  playlist: {
    params: { playlistId: string };
    queryParams: {};
  };
  playlists: {
    params: {};
    queryParams: {};
  };
  "beta-guide": {
    params: {};
    queryParams: {};
  };
  generated: {
    params: { generatedType: GeneratedType };
    queryParams: {};
  };
  settings: {
    params: {};
    queryParams: {};
  };
  library: {
    params: {};
    queryParams: {};
  };
  genres: {
    params: {};
    queryParams: {};
  };
  genre: {
    params: { genre: string };
    queryParams: {};
  };
};

const emitter = createEmitter<{
  navigate: [
    Route<keyof NavigatorRoutes>,
    RouterContextType["params"] | undefined,
    RouterContextType["queryParams"] | undefined,
  ];
}>();

export const navigateTo = <K extends keyof NavigatorRoutes>(
  route: K,
  params?: NavigatorRoutes[K]["params"],
  queryParams?: NavigatorRoutes[K]["queryParams"],
) => {
  emitter.emit("navigate", routes[route], params, queryParams);
};

export const useNavigator = <K extends keyof NavigatorRoutes>(_route: K) => {
  return useRouter() as {
    isRoute: (route: RouteType) => boolean;
    routeId: keyof NavigatorRoutes;
    params: NavigatorRoutes[K]["params"];
    queryParams: NavigatorRoutes[K]["queryParams"];
  };
};

export const useNavigation = () => {
  const { goTo } = useRouter();
  useEffect(() => {
    return emitter.on("navigate", (route, params, queryParams) => {
      goTo(route, params, queryParams);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

// FIXME how can we make titles dynamic?? It would be nice to have something generic
// But the easiest solution would probably be some kind of hook
export const routes = createRoutes<keyof NavigatorRoutes>({
  hero: {
    id: "hero",
    path: "/",
    component: Hero,
    protected: false,
    sidebar: false,
    className: "py-2",
    mobileClassName: "bg-gray-900",
    title: "",
    showBack: false,
    showTabs: false,
    dark: true,
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
    showBack: true,
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
    showBack: true,
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
    showBack: true,
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
    className: "py-2 overflow-y-auto",
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
    title: "Songs",
    showBack: true,
    showTabs: true,
  },
  "release-notes": {
    id: "release-notes",
    path: "/release-notes",
    component: ReleaseNotes,
    protected: false,
    sidebar: false,
    title: "Release Notes",
    showBack: true,
    showTabs: false,
  },
  albums: {
    id: "albums",
    path: "/library/albums",
    component: Albums,
    protected: true,
    sidebar: true,
    title: "Albums",
    showBack: true,
    showTabs: true,
  },
  album: {
    id: "album",
    path: "/library/albums/:artist/:album",
    component: AlbumOverview,
    protected: true,
    sidebar: true,
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
    title: "Playlists",
    showBack: true,
    showTabs: true,
  },
  playlist: {
    id: "playlist",
    path: "/library/playlists/:playlistId",
    component: PlaylistOverview,
    protected: true,
    sidebar: true,
    title: "Playlist",
    showBack: true,
    showTabs: true,
  },
  "beta-guide": {
    id: "beta-guide",
    path: "/beta-guide",
    component: BetaGuide,
    protected: false,
    sidebar: false,
    title: "Beta Guide",
    showBack: true,
    showTabs: false,
  },
  generated: {
    id: "generated",
    path: "/library/generated/:generatedType",
    component: Generated,
    protected: true,
    sidebar: true,
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
  },
  genres: {
    id: "genres",
    path: "/library/genres",
    component: Genres,
    protected: true,
    sidebar: true,
    title: "Genres",
    showBack: true,
    showTabs: true,
  },
  genre: {
    id: "genre",
    path: "/library/genres/:genre",
    component: GenreOverview,
    protected: true,
    sidebar: true,
    title: "Genre",
    showBack: true,
    showTabs: true,
  },
});

export const getAlbumRouteParams = (song: Song) => {
  return getAlbumParams({
    album: song.albumName ?? "",
    artist: getAlbumArtistFromSong(song),
  });
};

export const getAlbumParams = ({ artist, album }: { artist: string; album: string }) => {
  return {
    album: encodeURIComponent(album),
    artist: encodeURIComponent(artist),
  };
};

export const getArtistRouteParams = (artistName: string) => {
  return { artistName: encodeURIComponent(artistName) };
};

export const useAlbumParams = () => {
  const { params } = useNavigator("album");

  // Since the regex can return undefined if the group is empty, we need to handle this situation
  return {
    artist: decodeURIComponent(params.artist ?? ""),
    album: decodeURIComponent(params.album ?? ""),
  };
};

export const useArtistNameFromParams = (): string => {
  const { params } = useRouter();
  const { artistName } = params as {
    artistName: string;
  };
  return decodeURIComponent(artistName);
};
