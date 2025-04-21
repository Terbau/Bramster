import type { OriginDetails } from "@/types/question"
import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
} from "@tanstack/react-query"

type Response = OriginDetails[]

export const useGetOrigins = (
  options?: Omit<UseQueryOptions<Response>, "queryKey" | "queryFn">
): UseQueryResult<Response> => {
  return useQuery<Response>({
    queryKey: ["origins"],
    queryFn: () => fetch("/api/questions/origins").then((res) => res.json()),
    ...options,
  })
}
