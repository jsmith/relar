importScripts("https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js");

// StaleWhileRevalidate
// Always request files to update the cache if possible
// But if the network connection doesn't exist, fallback to the cache

// CacheFirst
// Go to the cache and don't refetch if they are there

// TODO "1" *needs* to be updated when the website updates
workbox.precaching.precache([{ url: "/index.html", revision: "1" }]);

const handler = workbox.precaching.createHandlerBoundToURL("/index.html");
const navigationRoute = new workbox.routing.NavigationRoute(handler);
workbox.routing.registerRoute(navigationRoute);

workbox.routing.registerRoute(
  /\.(css|js|ttf)$/,
  // TODO StaleWhileRevalidate if in dev else StaleWhileRevalidate
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: "assets",
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 90 * 24 * 60 * 60, // cache for 90 days
      }),
    ],
  }),
);

workbox.routing.registerRoute(
  /\.(png|jpe?g|gif)$/,
  new workbox.strategies.CacheFirst({
    cacheName: "images",
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        // Cache 1000 images since there could be a *lot*
        // We may may to increase this actually since users will eventually download *lots* of
        // small artwork when scrolling down their song list
        maxEntries: 10000,
        maxAgeSeconds: 365 * 24 * 60 * 60, // cache for 30 days
      }),
    ],
  }),
);
