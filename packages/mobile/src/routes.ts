import { Home } from "./pages/Home";
import { Library } from "./pages/Library";
import { Login } from "./shared/web/pages/Login";
import { Signup } from "./shared/web/pages/Signup";
import { ForgotPassword } from "./shared/web/pages/ForgotPassword";
import { ForgotPasswordSuccess } from "./shared/web/pages/ForgotPasswordSuccess";
import { Search } from "./shared/web/pages/Search";
import { Settings } from "./pages/Settings";
import { Welcome } from "./pages/Welcome";

export const routes = {
  home: {
    id: "home",
    path: "/home",
    component: Home,
    showBack: false,
    showTabs: true,
  },
  login: {
    id: "login",
    path: "/login",
    component: Login,
    showBack: "Login",
    showTabs: false,
  },
  signup: {
    id: "signup",
    path: "/signup",
    component: Signup,
    showBack: "Sign Up",
    showTabs: false,
  },
  search: {
    id: "search",
    path: "/search",
    component: Search,
    showBack: false,
    showTabs: true,
  },
  library: {
    id: "library",
    path: "/library",
    component: Library,
    showBack: false,
    showTabs: true,
  },
  settings: {
    id: "settings",
    path: "/settings",
    component: Settings,
    showBack: false,
    showTabs: false,
  },
  welcome: {
    id: "welcome",
    path: "/",
    component: Welcome,
    showBack: false,
    showTabs: false,
  },
  forgotPassword: {
    id: "forgot-password",
    path: "/forgot-password",
    component: ForgotPassword,
    showBack: false,
    showTabs: false,
  },
  forgotPasswordSuccess: {
    id: "forgot-password-success",
    path: "/forgot-password-success",
    component: ForgotPasswordSuccess,
    showBack: false,
    showTabs: false,
  },
};
