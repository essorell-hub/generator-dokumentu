import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useZakazky(hledat = "", stav = "") {
  return useQuery(
    orpc.zakazky.seznam.queryOptions({
      input: { hledat: hledat.trim() || undefined, stav: stav.trim() || undefined },
    }),
  );
}

export function useZakazka(id: number) {
  return useQuery({
    ...orpc.zakazky.detail.queryOptions({ input: { id } }),
    enabled: id > 0,
  });
}

export function useDalsiCislo() {
  return useQuery(orpc.zakazky.dalsiCislo.queryOptions());
}

export function useVytvoritZakazku() {
  const qc = useQueryClient();
  return useMutation(
    orpc.zakazky.vytvorit.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.zakazky.key() }),
    }),
  );
}

export function useUpravitZakazku() {
  const qc = useQueryClient();
  return useMutation(
    orpc.zakazky.upravit.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.zakazky.key() }),
    }),
  );
}

export function useSmazatZakazku() {
  const qc = useQueryClient();
  return useMutation(
    orpc.zakazky.smazat.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.zakazky.key() }),
    }),
  );
}
