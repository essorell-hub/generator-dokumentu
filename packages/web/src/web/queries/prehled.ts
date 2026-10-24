import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function usePrehledTerminu() {
  return useQuery(orpc.prehled.terminy.queryOptions());
}
