import useSWR from 'swr'
import type { GitHub } from '@riverly/app'

const fetcher = (
  ...args: [RequestInfo, RequestInit?]
): Promise<{ installs: GitHub.UserInstalls }> =>
  fetch(...args).then((res) => res.json())

export function useGitHubInstalls() {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/github/installs`,
    fetcher,
  )

  return {
    data: data,
    isLoading,
    isError: error,
    mutate,
  }
}
