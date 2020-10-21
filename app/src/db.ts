import { openDB, IDBPDatabase } from "idb";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "./auth";
import { Album, Artist, Playlist, Song } from "./shared/universal/types";
import { clientDb } from "./shared/universal/utils";
import firebase from "firebase/app";
import { createEmitter } from "./events";
import { captureMessage, Severity } from "@sentry/browser";

export const DATABASE_NAME = "firebase-collections";

const withPerformanceAndAnalytics = async <T>(
  cb: () => Promise<T[]>,
  name: string,
): Promise<T[]> => {
  const eventName = `${name}_initial_load`;
  const trace = firebase.performance().trace(eventName);
  trace.start();

  const result = await cb();

  // If result errors out, the trace is never ended and nothing actually happens
  trace.stop();
  trace.putMetric("count", result.length);
  firebase.analytics().logEvent(eventName, {
    value: result.length,
  });

  return result;
};

let cache: { [path: string]: unknown[] | undefined } = {};
const watchers = createEmitter<Record<string, [unknown]>>();

export type IndexDBModels = "songs" | "albums" | "artists" | "playlists";

export type IndexDBTypes = IndexDBModels | "lastUpdated";

export type IndexDBTypeMap = {
  songs: Song;
  albums: Album;
  artists: Artist;
  playlists: Playlist;
};

export type Model = IndexDBTypeMap[IndexDBModels];

export class IndexedDb {
  private database: string;
  private db: IDBPDatabase<unknown> | undefined;

  constructor(database: string) {
    this.database = database;
  }

  public async createObjectStore(tableNames: string[]) {
    this.db = await openDB(this.database, undefined, {
      upgrade(db, oldVersion, newVersion, transaction) {
        for (const { name: tableName, id } of [
          { name: "songs", id: "id" },
          { name: "albums", id: "id" },
          { name: "artists", id: "name" },
          { name: "playlists", id: "id" },
          { name: "lastUpdated", id: "name" },
        ]) {
          if (db.objectStoreNames.contains(tableName)) {
            continue;
          }

          db.createObjectStore(tableName, { keyPath: id });
        }
      },
      blocked() {
        console.log("BLOCKED");
      },
      blocking() {
        console.log("BLOCKING");
      },
      terminated() {
        console.log("TERMINATED");
      },
    });
  }

  public async getValue(tableName: IndexDBTypes, id: string) {
    const tx = this.getOrError().transaction(tableName, "readonly");
    const store = tx.objectStore(tableName);
    const result = await store.get(id);
    return result;
  }

  public async getAllValue(tableName: IndexDBTypes) {
    const tx = this.getOrError().transaction(tableName, "readonly");
    const store = tx.objectStore(tableName);
    const result = await store.getAll();
    return result;
  }

  public async putValue(tableName: IndexDBTypes, value: object) {
    const tx = this.getOrError().transaction(tableName, "readwrite");
    const store = tx.objectStore(tableName);
    const result = await store.put(value);
    return result;
  }

  public async putBulkValue(tableName: IndexDBTypes, values: object[]) {
    const tx = this.getOrError().transaction(tableName, "readwrite");
    const store = tx.objectStore(tableName);
    for (const value of values) {
      const result = await store.put(value);
    }
    return this.getAllValue(tableName);
  }

  public async deleteValue(tableName: string, id: string) {
    const tx = this.getOrError().transaction(tableName, "readwrite");
    const store = tx.objectStore(tableName);
    const result = await store.get(id);
    if (!result) {
      console.log("Id not found", id);
      return result;
    }
    await store.delete(id);
    console.log("Deleted Data", id);
    return id;
  }

  private getOrError() {
    if (!this.db) throw Error("Please call createObjectStore first");
    return this.db;
  }
}

/**
 *
 * @param songs The songs to check.
 * @returns The time (in nanoseconds) of the max last updated time. 0 is returned by default.
 */
export const getMaxUpdatedAt = (songs: Model[]): number => {
  let maxUpdatedAt = 0;

  songs.forEach((song) => {
    maxUpdatedAt = Math.max(
      maxUpdatedAt,
      // Turn into milliseconds
      // I've found that only the 3 most significant values are defined and everything else is
      // zeros (ie. XXX 000 000)
      song.updatedAt.seconds * 1000 + Math.round(song.updatedAt.nanoseconds / 1000000),
    );
  });

  return maxUpdatedAt;
};

/**
 * The songs provider. undefined means the songs are loading.
 */
export const useCoolDB = () => {
  const { user } = useUser();

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      cache = {};
      const db = new IndexedDb(DATABASE_NAME);
      await db.createObjectStore([]);
      const songs = clientDb(user.uid).songs();
      const artists = clientDb(user.uid).artists();
      const albums = clientDb(user.uid).albums();
      const playlists = clientDb(user.uid).playlists();

      const watchModel = async <M extends IndexDBModels>(
        model: M,
        collection: firebase.firestore.CollectionReference<IndexDBTypeMap[M]>,
      ) => {
        let lastUpdated: { name: string; value: number } | undefined = await db.getValue(
          "lastUpdated",
          model,
        );

        type Item = IndexDBTypeMap[M];

        let items: Item[];
        if (lastUpdated === undefined) {
          console.log(
            `[${model}] The last updated time was undefined. Fetching entire collection...`,
          );

          // Ensure we initially read only items where "deleted" != true
          // If we didn't do this, users would get old data that would never go away
          items = await withPerformanceAndAnalytics(
            () =>
              collection
                .where("deleted", "==", false)
                .get()
                .then((r) => r.docs.map((doc) => doc.data())),
            model,
          );

          console.log(`[${model}] Success! Got ${items.length} items from collection.`);
          await db.putBulkValue(model, items);
          console.log(`[${model}] Success! Wrote ${items.length} items to IndexedDB`);

          const maxUpdatedAt = getMaxUpdatedAt(items);
          lastUpdated = { name: model, value: maxUpdatedAt };
          await db.putValue("lastUpdated", lastUpdated);
        } else {
          items = await db.getAllValue(model).then((items: Item[]) =>
            items.map((item) => ({
              ...item,
              // When we get the updatedAt value from IndexDB, it's been converted into a simple object
              updatedAt: new firebase.firestore.Timestamp(
                item.updatedAt.seconds,
                item.updatedAt.nanoseconds,
              ),
              // FIXME This is kinda a hack!!
              createdAt:
                (item as any).createdAt &&
                new firebase.firestore.Timestamp(
                  (item as any).createdAt.seconds,
                  (item as any).createdAt.nanoseconds,
                ),
            })),
          );

          console.log(`[${model}] Loaded ${items.length} ${model} from IndexedDB`);
        }

        // Emit and cache right away so users get the items
        cache[model] = items;
        watchers.emit(model, items);

        const updateItems = async (newItems: Item[]) => {
          cache[model] = newItems;
          items = newItems;
          watchers.emit(model, newItems);
          await db.putBulkValue(model, newItems);
        };

        const lastUpdatedDate = new Date(lastUpdated?.value ?? 0);
        console.log(
          `[${model}] Looking for data updated >= ${
            lastUpdated?.value ?? 0
          } (${lastUpdatedDate.toLocaleDateString("en", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true,
          })})`,
        );

        // This "running" variable acts as a lock so that the following code
        // is only running once at a time
        let running = false;
        const changes: Array<firebase.firestore.DocumentChange<IndexDBTypeMap[M]>> = [];
        const startProcessor = async () => {
          if (running) return;
          if (changes.length === 0) return;
          running = true;
          const changesToProcess = changes.splice(0, changes.length);

          const eventName = `${model}_snapshot`;
          const trace = firebase.performance().trace(eventName);
          trace.start();

          firebase.analytics().logEvent(eventName, {
            value: changesToProcess.length,
          });

          console.log(
            `[${model}] Got ${model} snapshot with ${changesToProcess.length} changes!`,
            changesToProcess,
          );
          const copy = [...items];

          const add = (change: firebase.firestore.DocumentChange<IndexDBTypeMap[M]>) => {
            const data = change.doc.data();
            // I see no scenarios where this happens but like.. just to be safe
            if (data.deleted) {
              console.warn(
                `[${model}] Document "${change.doc.id}" not being added to the ${model} collection as it's been deleted`,
              );
              return;
            }

            console.log(`[${model}] Adding document "${change.doc.id}" to the ${model} collection`);

            copy.push(data);
          };

          const mutate = (
            change: firebase.firestore.DocumentChange<IndexDBTypeMap[M]>,
            index: number,
          ) => {
            const data = change.doc.data();

            // When any mutation comes that set "delete" to true remove our local copy
            if (data.deleted) {
              console.log(
                `[${model}] Deleting document "${change.doc.id}" in the ${model} collection (index ${index})`,
              );

              copy.splice(index, 1);
              return;
            }

            console.log(
              `[${model}] Mutating document "${change.doc.id}" in the ${model} collection (index ${index})`,
            );

            if (copy[index].updatedAt.toMillis() > data.updatedAt.toMillis()) {
              console.warn(
                `[${model}] Received a change that is out-of-date with the current state of "${data.id}". ${copy[index].updatedAt} vs. ${data.updatedAt}`,
              );
              return;
            }

            copy[index] = data;
          };

          const changedSongs: Item[] = [];
          changesToProcess.forEach((change) => {
            changedSongs.push(change.doc.data());
            if (change.type === "removed") {
              // SKIP (see comments above)
            } else if (change.type === "added") {
              // We can't trust this event to give us songs that we don't have for numerous reasons
              // First being the reason I described above and secondly because we just can't be sure
              // about the state of our local data
              // Because of this, we first check to see if the song exists
              const index = copy.findIndex((item) => item.id === change.doc.id);
              if (index === -1) add(change);
              else mutate(change, index);
            } else {
              const index = copy.findIndex((item) => item.id === change.doc.id);
              if (index === -1) add(change);
              mutate(change, index);
            }
          });

          const maxUpdatedAt = getMaxUpdatedAt(changedSongs);
          await updateItems(copy);

          if (maxUpdatedAt < latestLastUpdated) {
            const warning = `The snapshot (${maxUpdatedAt}) was received out-of-order. The previous snapshot time was ${latestLastUpdated}.`;
            captureMessage(warning, Severity.Warning);
            console.warn(warning);
          }

          console.log(
            `[${model}] The previous last updated time was ${latestLastUpdated}. Setting to ${maxUpdatedAt}.`,
          );
          // This should be fine but like... it all depends on how firebase manages snapshots
          // Like, am I guaranteed to get all snapshots that occurred on or before a particular time?
          // Or will do snapshots ever arrive out of order?
          // I add 1 since we've already
          await db.putValue("lastUpdated", { name: model, value: maxUpdatedAt });
          latestLastUpdated = maxUpdatedAt;

          trace.stop();
          trace.putMetric("count", changesToProcess.length);

          running = false;
          startProcessor();
        };

        // Keep an in memory version of the last updated time
        let latestLastUpdated = lastUpdated.value;
        return (
          collection
            .orderBy("updatedAt", "asc")
            .where("updatedAt", ">=", lastUpdatedDate)
            // When a document that currently exists in the snapshot is modified, two events are
            // emitted! The first is a "removed" event and the second is an "added" event
            .onSnapshot({}, (snapshot) => {
              // "removed" events are worthless in my scenario
              // I initially planned on this firing when a song was deleted but I realized that
              // will only happen if it was previously in the snapshot range
              // Furthermore, this event is triggered when a document currently in the snapshot
              // is mutated which... kinda makes no sense but oh well
              changes.push(...snapshot.docChanges().filter((change) => change.type !== "removed"));
              startProcessor();
            })
        );
      };

      await watchModel("albums", albums);
      await watchModel("songs", songs);
      await watchModel("artists", artists);
      await watchModel("playlists", playlists);
    };

    init();
  }, [user]);
};

const useCoolItems = function <T extends IndexDBModels>(model: T) {
  const [items, setItems] = useState<IndexDBTypeMap[T][]>();

  useEffect(() => {
    if (cache[model]) {
      console.debug(`Initializing ${model} to cache`, cache[model]);
      setItems(cache[model] as IndexDBTypeMap[T][]);
    }

    return watchers.on(model, (items) => {
      console.debug(`Updating ${model}`);
      setItems(items as IndexDBTypeMap[T][]);
    });
  }, [model]);

  return items;
};

const useSort = <T>(items: T[] | undefined, sort: (a: T, b: T) => number) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => items?.sort(sort), [items]);
};

export const useCoolSongs = () =>
  useSort(useCoolItems("songs"), (a, b) => a.title.localeCompare(b.title));
export const useCoolAlbums = () =>
  useSort(useCoolItems("albums"), (a, b) => a.id.localeCompare(b.id));
export const useCoolArtists = () =>
  useSort(useCoolItems("artists"), (a, b) => a.name.localeCompare(b.name));
export const useCoolPlaylists = () =>
  useSort(useCoolItems("playlists"), (a, b) => a.name.localeCompare(b.name));
