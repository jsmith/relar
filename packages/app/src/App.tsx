import { hot } from 'react-hot-loader';
import React, { useEffect } from 'react';
import { routes } from "./routes";
import { useRouter } from 'react-tiniest-router'
import { Login } from './pages/Login';
import { useUser } from '~/auth';
import { Sidebar } from './components/Sidebar';
import { Songs } from '~/pages/Songs';
import { FaMusic } from 'react-icons/fa';

interface AppProps { }

export interface SideBarItem {
  label: string;
  onClick: () => void;
}

// items: SideBarItem[]

function App({ }: React.Props<AppProps>) {
  const { isRoute, goTo, routeId } = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) {
      return;
    }

    const route = routes[routeId as keyof typeof routes];
    if (!route) {
      console.warn(`No route for "${routeId}"`)
      return;
    }

    if (route.protected && !user) {
      goTo(routes.login);
    }
  }, [routeId, loading])

  if (loading) {
    return <div>Loading...</div>
  }

  const content = isRoute(routes.songs) ? (
    <Sidebar sidebar={<div className="h-full bg-primary-700 w-48 text-white">
      <ul>
        <li className="flex py-3 mx-5 items-center">
          <FaMusic />
          <span className="ml-4">Songs</span>
        </li>
      </ul>
    </div>}>
      <div className="h-full bg-primary-800">
        {isRoute(routes.songs) && <Songs />}
      </div>
    </Sidebar>
  ) : isRoute(routes.login) ? (
    <Login />
  ) : isRoute(routes.profile) ? (
    <div>About us</div>
  ) : <div>404</div>

  return (
    <div className="h-screen bg-gray-100">
      {/* <header className="App-header bg-primary-500">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      {content}
    </div>
  );
}

export default hot(module)(App);
