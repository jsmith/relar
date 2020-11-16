import { openDB, IDBPDatabase, deleteDB } from "idb";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "./auth";
import { Playlist, Song } from "./shared/universal/types";
import firebase from "firebase/app";
import { createEmitter } from "./events";
import { captureMessage, Severity } from "@sentry/browser";
import { useStateWithRef, clientDb } from "./utils";

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

export type DBChange<T> = { type: "mutate" | "add" | "delete"; item: T };

let cache: { [path: string]: unknown[] | undefined } = {};
const watchers = createEmitter<
  Record<string, [unknown[], unknown[] | null, DBChange<unknown>[] | null]>
>();

export type IndexDBModels = "songs" | "playlists";

export type IndexDBTypes = IndexDBModels | "lastUpdated";

export type IndexDBTypeMap = {
  songs: Song;
  playlists: Playlist;
};

export type Model = IndexDBTypeMap[IndexDBModels];

const emitter = createEmitter<{ close: [] }>();

export const resetDB = (db: string) => {
  emitter.emit("close");

  // Give the databases enough time to hopefully close
  setTimeout(() => {
    deleteDB(db, {
      blocked: () => {
        console.log("BLOCKED");
      },
    }).then(() => {
      window.location.reload();
    });
  }, 3000);
};

export class IndexedDb {
  public dispose: () => void;
  private database: string;
  private db: IDBPDatabase<unknown> | undefined;

  constructor(database: string) {
    this.database = database;
    this.dispose = emitter.on("close", () => {
      console.log("CLOSING DB");
      this.db && this.db.close();
    });
  }

  public async createObjectStore(tableNames: string[]) {
    this.db = await openDB(this.database, undefined, {
      upgrade(db, oldVersion, newVersion, transaction) {
        for (const { name: tableName, id } of [
          { name: "songs", id: "id" },
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
      await store.put(value);
    }
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
 * This should be called *once*.
 */
export const useCoolDB = () => {
  const { user } = useUser();

  useEffect(() => {
    const disposers: Array<() => void> = [];
    const init = async () => {
      if (!user) return;
      cache = {};
      // Use the name of the user so that the data from one user doesn't mess with the data from another user
      // FIXME is this secure?
      const db = new IndexedDb(user.uid);
      await db.createObjectStore([]);
      const songs = clientDb(user.uid).songs();
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
          console.info(
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

          console.info(`[${model}] Success! Got ${items.length} items from collection.`);
          await db.putBulkValue(model, items);
          console.info(`[${model}] Success! Wrote ${items.length} items to IndexedDB`);

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

          console.info(`[${model}] Loaded ${items.length} ${model} from IndexedDB`);
        }

        // Emit and cache right away so users get the items
        cache[model] = items;
        watchers.emit(model, items, [], []);

        const updateItems = async (
          newItems: Item[],
          changedItems: Item[],
          changes: DBChange<IndexDBTypeMap[M]>[],
        ) => {
          cache[model] = newItems;
          items = newItems;
          watchers.emit(model, newItems, changedItems, changes);
          await db.putBulkValue(model, newItems);
        };

        const lastUpdatedDate = new Date(lastUpdated?.value ?? 0);
        console.info(
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

        // Process the changes from the changes array
        // If there are no changes, terminate the processor
        // I wrote this so that changes are always processed in order
        // This "running" variable acts as a lock so that the following code
        // is only running once at a time
        // If there is an exception... that would break things
        // I've never seem an exception in this code though
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

          console.info(
            `[${model}] Got ${model} snapshot with ${changesToProcess.length} changes!`,
            changesToProcess,
          );
          const copy = [...items];

          const dbChanges: DBChange<IndexDBTypeMap[M]>[] = [];
          const add = (change: firebase.firestore.DocumentChange<IndexDBTypeMap[M]>) => {
            const data = change.doc.data();
            // I see no scenarios where this happens but like.. just to be safe
            // Edit: There are scenarios where this could happen (e.g. I modify the data in a script)
            if (data.deleted) {
              console.warn(
                `[${model}] Document "${change.doc.id}" not being added to the ${model} collection as it's been deleted`,
              );
              return;
            }

            console.info(
              `[${model}] Adding document "${change.doc.id}" to the ${model} collection`,
            );

            dbChanges.push({ type: "add", item: data });
            copy.push(data);
          };

          const mutate = (
            change: firebase.firestore.DocumentChange<IndexDBTypeMap[M]>,
            index: number,
          ) => {
            const data = change.doc.data();

            // When any mutation comes that set "delete" to true remove our local copy
            if (data.deleted) {
              console.info(
                `[${model}] Deleting document "${change.doc.id}" in the ${model} collection (index ${index})`,
              );

              dbChanges.push({ type: "delete", item: copy[index] });
              copy.splice(index, 1);
              return;
            }

            console.info(
              `[${model}] Mutating document "${change.doc.id}" in the ${model} collection (index ${index})`,
            );

            if (copy[index].updatedAt.toMillis() > data.updatedAt.toMillis()) {
              console.warn(
                `[${model}] Received a change that is out-of-date with the current state of "${data.id}". ${copy[index].updatedAt} vs. ${data.updatedAt}`,
              );
              return;
            }

            dbChanges.push({ type: "mutate", item: data });
            copy[index] = data;
          };

          const changedItems: Item[] = [];
          changesToProcess.forEach((change) => {
            changedItems.push(change.doc.data());
            if (change.type === "removed") {
              // SKIP (see comments above)
              return;
            }
            // At this point, it's an "added" or "removed" event
            // We can't trust this event to give us songs that we don't have for numerous reasons
            // First being the reason I described above and secondly because we just can't be sure
            // about the state of our local data
            // Because of this, we first check to see if the song exists
            const index = copy.findIndex((item) => item.id === change.doc.id);
            if (index === -1) add(change);
            else mutate(change, index);
          });

          const maxUpdatedAt = getMaxUpdatedAt(changedItems);
          await updateItems(copy, changedItems, dbChanges);

          if (maxUpdatedAt < latestLastUpdated) {
            const warning = `The snapshot (${maxUpdatedAt}) was received out-of-order. The previous snapshot time was ${latestLastUpdated}.`;
            captureMessage(warning, Severity.Warning);
            console.warn(warning);
          }

          console.info(
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

      disposers.push(await watchModel("songs", songs));
      disposers.push(await watchModel("playlists", playlists));
    };

    init();
    return () => {
      disposers.forEach((dispose) => dispose());
      disposers.splice(0, disposers.length);
    };
  }, [user]);
};

const useCoolItems = function <T extends IndexDBModels>(model: T, onlyNew?: boolean) {
  const [items, setItems, itemsRef] = useStateWithRef<IndexDBTypeMap[T][] | undefined>(
    cache[model] as IndexDBTypeMap[T][],
  );

  useEffect(() => {
    if (cache[model] && !itemsRef.current) {
      console.info(`Initializing ${model} to cache`, cache[model]);
      setItems(cache[model] as IndexDBTypeMap[T][]);
    }

    return watchers.on(model, (items, _, changes) => {
      if (onlyNew && changes && changes.every((change) => change.type === "mutate")) {
        console.info(
          `[${model}] Skipped updating, no added documents in ${changes.length} changes.`,
        );
        return;
      }

      console.info(`[${model}] Updating due to ${changes?.length ?? "null"} changes.`);
      setItems(items as IndexDBTypeMap[T][]);
    });
  }, [model, setItems, itemsRef, onlyNew]);

  return items;
};

const useSort = <T>(items: T[] | undefined, sort: (a: T, b: T) => number) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => items?.sort(sort), [items]);
};

export const useChangedSongs = (cb: (songs: Song[]) => void) => {
  useEffect(() => {
    return watchers.on("songs", (_, changedDocuments) => {
      cb(changedDocuments as Song[]);
    });
  }, [cb]);
};

// The following two functions are used but I'm leaving them in since
// we might want to use them soon
// export const getSongs= () => cache["songs"] as Song[] | undefined;

// export const onDidUpdateSongs = (
//   cb: (items: { songs: Song[] | null; changed: Song[] | null }) => void,
// ) =>
//   watchers.on("songs", (songs, changed) =>
//     cb({ songs: songs as Song[] | null, changed: changed as Song[] | null }),
//   );

export const useCoolSongs = () =>
  useSort(useCoolItems("songs"), (a, b) => a.title.localeCompare(b.title));

export const useCoolPlaylists = () =>
  useSort(useCoolItems("playlists"), (a, b) => a.name.localeCompare(b.name));
