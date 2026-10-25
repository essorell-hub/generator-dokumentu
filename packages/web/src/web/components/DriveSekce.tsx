import React, { useState } from "react";
import {
  useDriveStav,
  useDriveSlozky,
  useVybratSlozku,
  useDriveOdpojit,
} from "../queries/nastaveni";
import { useDriveFiles } from "../queries/driveFiles";
import { SectionTitle, Hr } from "../components/layout";
import { Tlacitko, Field, TextInput } from "../components/fields";

/**
 * UI sekce na nastavení Google Drive.
 * - Zobrazuje stav připojení.
 * - Umožňuje procházet složky (rekurzivně).
 * - Uloží vybranou složku.
 * - Po uložení zobrazí soubory ve složce.
 */
export default function DriveSekce() {
  // stav připojení
  const driveStav = useDriveStav();
  // odpojení drive (pro úplnost, nevyužívá se v UI nyní)
  const odpojit = useDriveOdpojit();

  // aktuální procházená složka – undefined == kořen
  const [folderId, setFolderId] = useState<string | undefined>(undefined);

  // načtení složek v aktuální složce
  const slozkyQuery = useDriveSlozky({ parentId: folderId });

  // vybraná složka – po úspěšném uložení, chceme zobrazit soubory
  const [vybranaSlozka, setVybranaSlozka] = useState<string | undefined>(undefined);
  const vybrat = useVybratSlozku();

  // načtení souborů pokud je složka vybraná
  const souboryQuery = useDriveFiles(vybranaSlozka);

  const ulozSlozku = (id: string) => {
    vybrat.mutate({ slozkaId: id }, {
      onSuccess: () => {
        setVybranaSlozka(id);
      },
    });
  };

  return (
    <section className="my-6">
      <SectionTitle>Google Drive</SectionTitle>

      {/* stav připojení */}
      <div className="mb-4">
        {driveStav.isLoading ? (
          <span>Načítám stav…</span>
        ) : driveStav.data?.stav ? (
          <span className="text-moss">{driveStav.data.stav}</span>
        ) : (
          <span className="text-alert">Neznámý stav</span>
        )}
      </div>

      {/* seznam složek */}
      <div>
        <h3 className="font-medium mb-2">Složky</h3>
        {slozkyQuery.isLoading && <p>Načítám složky…</p>}
        {slozkyQuery.isError && <p className="text-alert">Chyba: {slozkyQuery.error?.message}</p>}
        {slozkyQuery.data?.slozky?.length ? (
          <ul className="list-disc pl-5 space-y-1">
            {slozkyQuery.data.slozky.map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <span>{s.nazev}</span>
                <div className="flex gap-2">
                  <Tlacitko onClick={() => setFolderId(s.id)}>Otevřít</Tlacitko>
                  <Tlacitko onClick={() => ulozSlozku(s.id)}>Vybrat</Tlacitko>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Žádné složky</p>
        )}
        {/* zpětný krok */}
        {folderId && (
          <Tlacitko className="mt-2" onClick={() => setFolderId(undefined)}>
            Zpět do kořene
          </Tlacitko>
        )}
      </div>

      <Hr />

      {/* soubory ve vybrané složce */}
      {vybranaSlozka && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Soubory v vybrané složce</h3>
          {souboryQuery.isLoading && <p>Načítám soubory…</p>}
          {souboryQuery.isError && (
            <p className="text-alert">Chyba: {souboryQuery.error?.message}</p>
          )}
          {souboryQuery.data?.files?.length ? (
            <ul className="list-disc pl-5 space-y-1">
              {souboryQuery.data.files.map((f) => (
                <li key={f.id}>
                  {f.nazev} – {f.mimeType} – {f.upraveno}
                </li>
              ))}
            </ul>
          ) : (
            <p>Žádné soubory</p>
          )}
        </div>
      )}
    </section>
  );
}
