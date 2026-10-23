import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useFirma() {
  return useQuery(orpc.nastaveni.firma.queryOptions());
}

export function useUlozFirmu() {
  const qc = useQueryClient();
  return useMutation(
    orpc.nastaveni.ulozFirmu.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.nastaveni.key() }),
    }),
  );
}

export function useVolby() {
  return useQuery(orpc.nastaveni.volby.queryOptions());
}

export function useUlozVolby() {
  const qc = useQueryClient();
  return useMutation(
    orpc.nastaveni.ulozVolby.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.nastaveni.key() }),
    }),
  );
}

export function useDriveStav() {
  return useQuery(orpc.nastaveni.driveStav.queryOptions());
}

export function useDriveDiagnostika() {
  return useQuery(orpc.nastaveni.driveDiagnostika.queryOptions());
}

export function useDriveSlozky(rodic: string) {
  return useQuery({
    ...orpc.nastaveni.driveSlozky.queryOptions({ input: { rodic } }),
    enabled: rodic !== "",
  });
}

export function useVybratSlozku() {
  const qc = useQueryClient();
  return useMutation(
    orpc.nastaveni.driveVybratSlozku.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.nastaveni.key() }),
    }),
  );
}

export function useZrusitSlozku() {
  const qc = useQueryClient();
  return useMutation(
    orpc.nastaveni.driveZrusitSlozku.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.nastaveni.key() }),
    }),
  );
}

export function useDriveOdpojit() {
  const qc = useQueryClient();
  return useMutation(
    orpc.nastaveni.driveOdpojit.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.nastaveni.key() }),
    }),
  );
}
