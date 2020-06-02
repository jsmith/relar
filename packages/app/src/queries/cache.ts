import {
  useQuery,
  useMutation,
  queryCache,
  QueryOptions,
  AnyQueryKey,
  CachedQuery,
  QueryFunction,
  QueryFunctionWithVariables,
  AnyVariables,
  QueryResult,
} from "react-query";

export interface QueryCache<TResult, TKey extends AnyQueryKey> {
  prefetchQuery(
    queryKey: TKey,
    queryFn: QueryFunction<TResult, TKey>,
    config?: QueryOptions<TResult>,
  ): Promise<TResult>;
  getQueryData(key: TKey): TResult | undefined;
  setQueryData(
    key: TKey,
    dataOrUpdater: TResult | ((oldData: TResult | undefined) => TResult),
  ): void;
  refetchQueries(
    queryKeyOrPredicateFn: TKey,
    {
      exact,
      throwOnError,
      force,
    }?: { exact?: boolean; throwOnError?: boolean; force?: boolean },
  ): Promise<void>;
  removeQueries(
    queryKeyOrPredicateFn: TKey,
    { exact }?: { exact?: boolean },
  ): Promise<void>;
  getQuery(queryKey: TKey): CachedQuery<TResult> | undefined;
  getQueries(queryKey: TKey): CachedQuery<TResult>[];
  isFetching: number;
  clear(): void;
}

export type UseQuery<TResult, TKey extends AnyQueryKey> = (
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  queryFn: QueryFunction<TResult, TKey>,
  config?: QueryOptions<TResult>,
) => QueryResult<TResult>;

export const createQueryCache = <TKey extends AnyQueryKey, TResult>(): {
  queryCache: QueryCache<TResult, TKey>;
  useQuery: UseQuery<TResult, TKey>;
} => {
  return {
    queryCache: queryCache as QueryCache<TResult, TKey>,
    useQuery: useQuery as UseQuery<TResult, TKey>,
  };
};
