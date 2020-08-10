import {
  useQuery,
  queryCache,
  Query,
  QueryFunction,
  QueryResult,
  QueryKey,
  QueryConfig,
} from "react-query";

export interface QueryCache<TResult, TKey extends QueryKey> {
  getQueryData(key: TKey): TResult | undefined;
  setQueryData(
    key: TKey,
    dataOrUpdater: TResult | ((oldData: TResult | undefined) => TResult),
  ): void;
  invalidateQueries(queryKeyOrPredicateFn: TKey, { exact }?: { exact?: boolean }): Promise<void>;
  removeQueries(queryKeyOrPredicateFn: TKey, { exact }?: { exact?: boolean }): void;
  getQuery(queryKey: TKey): Query<TResult, Error> | undefined;
  isFetching: number;
  clear(): void;
}

export type UseQuery<TResult, TKey extends QueryKey> = (
  queryKey: TKey | false | null | undefined | (() => TKey | false | null | undefined),
  queryFn: QueryFunction<TResult>,
  config?: QueryConfig<TResult, Error>,
) => QueryResult<TResult, Error>;

export const createQueryCache = <TKey extends QueryKey, TResult>(): {
  queryCache: QueryCache<TResult, TKey>;
  useQuery: UseQuery<TResult, TKey>;
} => {
  return {
    queryCache: queryCache as QueryCache<TResult, TKey>,
    useQuery: useQuery as UseQuery<TResult, TKey>,
  };
};
