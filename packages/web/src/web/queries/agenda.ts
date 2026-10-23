import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

/** Rejstřík zakázek */

export function useRejstrik(filtr: {
  hledat?: string;
  typ?: string;
  stav?: string;
  rok?: string;
  nezaplaceno?: boolean;
}) {
  return useQuery(orpc.rejstrik.seznam.queryOptions({ input: filtr }));
}

export function useUlozitEvidence() {
  const qc = useQueryClient();
  return useMutation(
    orpc.rejstrik.ulozit.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.rejstrik.key() }),
    }),
  );
}

export function useSmazatEvidence() {
  const qc = useQueryClient();
  return useMutation(
    orpc.rejstrik.smazat.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.rejstrik.key() }),
    }),
  );
}

export function usePrepojitZakazku() {
  const qc = useQueryClient();
  return useMutation(
    orpc.rejstrik.prepojitZakazku.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.rejstrik.key() }),
    }),
  );
}

export function useBezEvidence() {
  return useQuery(orpc.rejstrik.bezEvidence.queryOptions());
}

/** Hlídání revizních lhůt */

export function useRevize() {
  return useQuery(orpc.revize.seznam.queryOptions());
}

export function useUlozitRevizi() {
  const qc = useQueryClient();
  return useMutation(
    orpc.revize.ulozit.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.revize.key() }),
    }),
  );
}

export function useSmazatRevizi() {
  const qc = useQueryClient();
  return useMutation(
    orpc.revize.smazat.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.revize.key() }),
    }),
  );
}

/** Rejstřík norem */

export function useNormy(filtr: {
  hledat?: string;
  druh?: string;
  stav?: string;
  kontrola?: string;
}) {
  return useQuery(orpc.normy.seznam.queryOptions({ input: filtr }));
}

export function useUlozitNormu() {
  const qc = useQueryClient();
  return useMutation(
    orpc.normy.ulozit.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.normy.key() }),
    }),
  );
}

export function useOznacitOvereno() {
  const qc = useQueryClient();
  return useMutation(
    orpc.normy.oznacitOvereno.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.normy.key() }),
    }),
  );
}

export function useSmazatNormu() {
  const qc = useQueryClient();
  return useMutation(
    orpc.normy.smazat.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.normy.key() }),
    }),
  );
}

export function useUlozitTermin() {
  const qc = useQueryClient();
  return useMutation(
    orpc.normy.ulozitTermin.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.normy.key() }),
    }),
  );
}

export function useSmazatTermin() {
  const qc = useQueryClient();
  return useMutation(
    orpc.normy.smazatTermin.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.normy.key() }),
    }),
  );
}

/** E-mailové šablony */

export function useSablony() {
  return useQuery(orpc.maily.sablony.queryOptions());
}

export function useZnacky() {
  return useQuery(orpc.maily.znacky.queryOptions());
}

export function useUlozitSablonu() {
  const qc = useQueryClient();
  return useMutation(
    orpc.maily.ulozitSablonu.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.maily.key() }),
    }),
  );
}

export function useSmazatSablonu() {
  const qc = useQueryClient();
  return useMutation(
    orpc.maily.smazatSablonu.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.maily.key() }),
    }),
  );
}

export function useSestavitMail() {
  return useMutation(orpc.maily.sestavit.mutationOptions());
}

export function useZaznamenatZpravu() {
  const qc = useQueryClient();
  return useMutation(
    orpc.maily.zaznamenat.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.maily.key() }),
    }),
  );
}

export function useHistorieZprav(zakazkaId?: number) {
  return useQuery(
    orpc.maily.historie.queryOptions({ input: zakazkaId ? { zakazkaId } : {} }),
  );
}

export function useSmazatZpravu() {
  const qc = useQueryClient();
  return useMutation(
    orpc.maily.smazatZpravu.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.maily.key() }),
    }),
  );
}