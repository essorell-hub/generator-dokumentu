import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useKatalog() {
  return useQuery(orpc.generovani.katalog.queryOptions());
}

export function useKontrola(zakazkaId: number, klice: string[]) {
  return useQuery({
    ...orpc.generovani.kontrola.queryOptions({ input: { zakazkaId, klice } }),
    enabled: zakazkaId > 0 && klice.length > 0,
  });
}

export function useGenerovat() {
  const qc = useQueryClient();
  return useMutation(
    orpc.generovani.generovat.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: orpc.generovani.key() });
        qc.invalidateQueries({ queryKey: orpc.zakazky.key() });
      },
    }),
  );
}

export function useHistorie(zakazkaId: number) {
  return useQuery({
    ...orpc.generovani.historie.queryOptions({ input: { zakazkaId } }),
    enabled: zakazkaId > 0,
  });
}
