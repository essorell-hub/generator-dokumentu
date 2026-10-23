import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

/** Provoz kanceláře — osoby, měřidla, oprávnění, provozní deník. */

function useZneplatnit() {
  const qc = useQueryClient();
  // Údaje z provozu se propisují do dokumentů, proto se přepočítá i kontrola vyplnění.
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: orpc.provoz.key() }),
      qc.invalidateQueries({ queryKey: orpc.generovani.key() }),
    ]);
}

export function useProvozCiselniky() {
  return useQuery(orpc.provoz.ciselniky.queryOptions());
}

export function useProvozUpozorneni() {
  return useQuery(orpc.provoz.upozorneni.queryOptions());
}

export function useOsoby() {
  return useQuery(orpc.provoz.osoby.queryOptions());
}

export function useUlozitOsobu() {
  const z = useZneplatnit();
  return useMutation(orpc.provoz.ulozitOsobu.mutationOptions({ onSuccess: z }));
}

export function useSmazatOsobu() {
  const z = useZneplatnit();
  return useMutation(orpc.provoz.smazatOsobu.mutationOptions({ onSuccess: z }));
}

export function useMeridla() {
  return useQuery(orpc.provoz.meridla.queryOptions());
}

export function useUlozitMeridlo() {
  const z = useZneplatnit();
  return useMutation(orpc.provoz.ulozitMeridlo.mutationOptions({ onSuccess: z }));
}

export function useSmazatMeridlo() {
  const z = useZneplatnit();
  return useMutation(orpc.provoz.smazatMeridlo.mutationOptions({ onSuccess: z }));
}

export function useOpravneni() {
  return useQuery(orpc.provoz.opravneni.queryOptions());
}

export function useUlozitOpravneni() {
  const z = useZneplatnit();
  return useMutation(orpc.provoz.ulozitOpravneni.mutationOptions({ onSuccess: z }));
}

export function useSmazatOpravneni() {
  const z = useZneplatnit();
  return useMutation(orpc.provoz.smazatOpravneni.mutationOptions({ onSuccess: z }));
}

export function useProhlidky(zakazkaId?: number) {
  return useQuery(orpc.provoz.prohlidky.queryOptions({ input: { zakazkaId } }));
}

export function useUlozitProhlidku() {
  const z = useZneplatnit();
  return useMutation(orpc.provoz.ulozitProhlidku.mutationOptions({ onSuccess: z }));
}

export function useSmazatProhlidku() {
  const z = useZneplatnit();
  return useMutation(orpc.provoz.smazatProhlidku.mutationOptions({ onSuccess: z }));
}
