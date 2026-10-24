import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useStavZalohy() {
  return useQuery(orpc.zaloha.stav.queryOptions());
}

export function useZalohovatNaDisk() {
  const qc = useQueryClient();
  return useMutation(
    orpc.zaloha.naDisk.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.zaloha.key() }),
    }),
  );
}
