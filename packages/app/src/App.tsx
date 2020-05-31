import { hot } from 'react-hot-loader';
import React, { useEffect } from 'react';
import { routes } from './routes';
import { useRouter } from 'react-tiniest-router';
import { Login } from './pages/Login';
import { useUser } from '~/auth';
import { Sidebar } from './components/Sidebar';
import { Songs } from '~/pages/Songs';
import { FaMusic } from 'react-icons/fa';
import { GiSwordSpin } from 'react-icons/gi';
import classNames from 'classnames';
import { Player } from '~/components/Player';
import { MdLibraryMusic, MdSearch } from 'react-icons/md';
import { Artists } from '~/pages/Artists';
import { Albums } from '~/pages/Albums';

interface AppProps {}

export interface SideBarItem {
  label: string;
  onClick: () => void;
}

const sideLinks = [
  {
    label: 'Home',
    icon: FaMusic,
    route: routes.home,
  },
  {
    label: 'Search',
    icon: MdSearch,
    route: routes.search,
  },
  {
    // TODO save most recent inner tab
    label: 'Library',
    icon: MdLibraryMusic,
    route: routes.songs,
  },
];

const libraryLinks = [
  {
    label: 'Songs',
    route: routes.songs,
  },
  {
    label: 'Artists',
    route: routes.artists,
  },
  {
    label: 'Albums',
    route: routes.albums,
  },
];

// items: SideBarItem[]

function App({}: React.Props<AppProps>) {
  const { isRoute, goTo, routeId } = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) {
      return;
    }

    const route = routes[routeId as keyof typeof routes];
    if (!route) {
      console.warn(`No route for "${routeId}"`);
      return;
    }

    if (route.protected && !user) {
      goTo(routes.login);
    }
  }, [routeId, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const content =
    isRoute(routes.home) ||
    isRoute(routes.search) ||
    isRoute(routes.songs) ||
    isRoute(routes.albums) ||
    isRoute(routes.artists) ? (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="relative flex-grow">
          <Sidebar
            sidebar={
              <div className="h-full bg-primary-700 w-56">
                <div className="flex items-center">
                  <h1 className="pl-5 pr-3 py-3 text-2xl tracking-wider">
                    RELAR
                  </h1>
                  <GiSwordSpin className="w-6 h-6" />
                </div>
                <ul>
                  {sideLinks.map(({ icon: Icon, route, label }) => (
                    <li
                      className={classNames(
                        'flex py-2 px-5 items-center hover:bg-primary-600 cursor-pointer',
                        isRoute(route) ? 'bg-primary-600' : undefined,
                      )}
                      onClick={() => goTo(route)}
                      key={label}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="ml-4">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            }
          >
            <div className="h-full bg-primary-800 px-5">
              <div>
                {(isRoute(routes.songs) ||
                  isRoute(routes.artists) ||
                  isRoute(routes.albums)) && (
                  <ul className="flex space-x-4 text-xl">
                    {libraryLinks.map(({ label, route }) => (
                      <li
                        key={label}
                        className={classNames(
                          'my-2 border-gray-300 cursor-pointer hover:text-gray-200',
                          isRoute(route)
                            ? 'border-b text-gray-200'
                            : ' text-gray-400',
                        )}
                        onClick={() => goTo(route)}
                      >
                        {label}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="py-3">
                  {isRoute(routes.songs) && <Songs />}
                  {isRoute(routes.artists) && <Artists />}
                  {isRoute(routes.albums) && <Albums />}
                </div>
              </div>
            </div>
          </Sidebar>
        </div>
        <Player />
      </div>
    ) : isRoute(routes.login) ? (
      <Login />
    ) : isRoute(routes.profile) ? (
      <div>Profile</div>
    ) : (
      <div>404</div>
    );

  return (
    <div className="h-screen text-white">
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
