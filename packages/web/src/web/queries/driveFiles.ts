import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

/**
 * Hook pro načtení metadat souborů v konkrétní složce Google Drive.
 *
 * @param folderId ID složky, ze které chceme získat soubory. Pokud je undefined nebo prázdný,
 *   požadavek se neodešle (hook je deaktivován).
 * @returns React‑Query objekt obsahující data, stav načítání a chybu.
 */
export function useDriveFiles(folderId: string | undefined) {
  return useQuery({
    // orpc generuje metodu queryOptions s typy vstupu/výstupu endpointu driveFiles.soubory
    ...orpc.driveFiles.soubory.queryOptions({
      input: { folderId: folderId ?? "" },
    }),
    // aktivuje pouze když je platný folderId
    enabled: Boolean(folderId),
  });
}
