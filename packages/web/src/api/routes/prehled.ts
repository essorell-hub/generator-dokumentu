/** Úvodní přehled termínů napříč agendou (revize, provoz, normy). */
import { base } from "../__core/app";
import { seznamRevizi, souhrnNormy } from "../lib/agenda/data";
import { upozorneni } from "../lib/provoz";

export const prehledRouter = {
  terminy: base.handler(async () => {
    const [revize, provoz, normy] = await Promise.all([seznamRevizi(), upozorneni(), souhrnNormy()]);

    const revizeProblem = revize.filter((r) => r.stav === "PO TERMÍNU" || r.stav === "Blíží se");
    const provozProsle = provoz.filter((p) => p.stav === "Prošlé");
    const provozBlizi = provoz.filter((p) => p.stav === "Blíží se");

    return {
      revize: {
        poTerminu: revizeProblem.filter((r) => r.stav === "PO TERMÍNU").length,
        bliziSe: revizeProblem.filter((r) => r.stav === "Blíží se").length,
        polozky: revizeProblem.slice(0, 5).map((r) => ({
          kdo: [r.klient, r.objekt].filter(Boolean).join(" – ") || "Bez názvu",
          datum: r.datumPristiRevize,
          dni: r.dniDoTerminu,
          stav: r.stav,
        })),
      },
      provoz: {
        prosle: provozProsle.length,
        bliziSe: provozBlizi.length,
        polozky: provoz.slice(0, 5).map((p) => ({
          kdo: `${p.kde}: ${p.kdo}`,
          co: p.co,
          datum: p.datum,
          dni: p.dni,
          stav: p.stav,
        })),
      },
      normy: { poTerminu: normy.poTerminu, aktualizovat: normy.aktualizovat },
    };
  }),
};
