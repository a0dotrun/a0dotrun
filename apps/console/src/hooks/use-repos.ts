import useSWR from 'swr'
import type { GitHubRepo } from '@riverly/app/ty'

const fetcher = (
  ...args: [RequestInfo, RequestInit?]
): Promise<{ repos: Array<GitHubRepo>; isInstalled: boolean }> =>
  fetch(...args).then((res) => res.json())

export function useRepos(owner?: string) {
  const url = owner
    ? `/api/github/repos?owner=${encodeURIComponent(owner)}`
    : `/api/github/repos`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher)

  return {
    data: data,
    isLoading,
    isError: error,
    mutate,
  }
}
