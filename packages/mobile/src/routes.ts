import { Home } from "./pages/Home";
import { Library } from "./pages/Library";
import { Login } from "./pages/Login";
import { Signup } from "./shared/web/pages/Signup";
import { Search } from "./pages/Search";
import { Settings } from "./pages/Settings";
import { Welcome } from "./pages/Welcome";

export const routes = {
  home: {
    id: "home",
    path: "/home",
    component: Home,
  },
  login: {
    id: "login",
    path: "/login",
    component: Login,
  },
  signup: {
    id: "signup",
    path: "/signup",
    component: Signup,
  },
  search: {
    id: "search",
    path: "/search",
    component: Search,
  },
  library: {
    id: "library",
    path: "/library",
    component: Library,
  },
  settings: {
    id: "settings",
    path: "/settings",
    component: Settings,
  },
  welcome: {
    id: "welcome",
    path: "/",
    component: Welcome,
  },
};
