export const routes = {
  profile: {
    id: 'profile',
    path: '/profile',
    protected: true,
  },
  login: {
    id: 'login',
    path: '/login',
    protected: false,
  },
  home: {
    id: 'home',
    path: '/',
    protected: true,
  },
  search: {
    id: 'search',
    path: '/search',
    protected: true,
  },
  songs: {
    id: 'songs',
    path: '/library/songs',
    protected: true,
  },
  albums: {
    id: 'albums',
    path: '/library/albums',
    protected: true,
  },
  artists: {
    id: 'artists',
    path: '/library/artists',
    protected: true,
  },
  // gallery: {
  //   id: 'gallery',
  //   path: '/gallery/:imageId',
  // },
};
