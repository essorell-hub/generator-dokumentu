/**
 * Google Drive — OAuth 2.0 klientský tok a nahrávání souborů.
 *
 * Aplikace se jednou přihlásí účtem kanceláře (Nastavení → Připojit Drive),
 * uloží si refresh token do databáze a dál už funguje bez přihlašování.
 */
import { KLICE, nacti, smaz, uloz } from "./nastaveni";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const SCOPE = "https://www.googleapis.com/auth/drive";
const FOLDER_MIME = "application/vnd.google-apps.folder";

export class DriveChyba extends Error {
  constructor(
    message: string,
    readonly stav = 400,
  ) {
    super(message);
    this.name = "DriveChyba";
  }
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new DriveChyba(`Chybí ${name} v .env`, 500);
  return value;
}

export function maKonfiguraci(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Adresa, na kterou Google vrací přihlášení. Když `GOOGLE_REDIRECT_URI` není
 * vyplněné, odvodí se z `WEBSITE_URL`, aby stačilo nastavit jen client id a secret.
 */
export function prehlasovaciUri(): string {
  const primo = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (primo) return primo;
  const zaklad = process.env.WEBSITE_URL?.trim().replace(/\/+$/, "");
  return zaklad ? `${zaklad}/api/drive/callback` : "";
}

/** Adresa, na kterou se posílá uživatel pro souhlas s přístupem. */
export function autorizacniUrl(stav: string): string {
  const params = new URLSearchParams({
    client_id: env("GOOGLE_CLIENT_ID"),
    redirect_uri: prehlasovaciUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: stav,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

interface TokenOdpoved {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  id_token?: string;
}

async function vymenKod(kod: string): Promise<TokenOdpoved> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: kod,
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      redirect_uri: prehlasovaciUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new DriveChyba(`Výměna autorizačního kódu selhala: ${await res.text()}`, 400);
  }
  return (await res.json()) as TokenOdpoved;
}

/** Dokončí přihlášení — uloží refresh token a e-mail účtu. */
export async function dokonciPrihlaseni(kod: string): Promise<string> {
  const tokeny = await vymenKod(kod);
  if (!tokeny.refresh_token) {
    throw new DriveChyba(
      "Google nevrátil refresh token. Odeberte aplikaci přístup v účtu Google a připojte ji znovu.",
      400,
    );
  }
  await uloz(KLICE.driveRefreshToken, tokeny.refresh_token);
  const email = await zjistiEmail(tokeny.access_token);
  await uloz(KLICE.driveEmail, email);
  return email;
}

async function zjistiEmail(accessToken: string): Promise<string> {
  const res = await fetch(`${DRIVE_API}/about?fields=user(emailAddress,displayName)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return "";
  const data = (await res.json()) as { user?: { emailAddress?: string } };
  return data.user?.emailAddress ?? "";
}

export async function jePripojeno(): Promise<boolean> {
  return (await nacti(KLICE.driveRefreshToken)) !== "";
}

export async function stavPripojeni(): Promise<{
  nakonfigurovano: boolean;
  pripojeno: boolean;
  email: string;
  slozkaId: string;
  slozkaNazev: string;
  prehlasovaciUri: string;
}> {
  const [token, email, slozkaId, slozkaNazev] = await Promise.all([
    nacti(KLICE.driveRefreshToken),
    nacti(KLICE.driveEmail),
    nacti(KLICE.driveFolderId),
    nacti(KLICE.driveFolderNazev),
  ]);
  return {
    nakonfigurovano: maKonfiguraci(),
    pripojeno: token !== "",
    email,
    slozkaId,
    slozkaNazev,
    prehlasovaciUri: prehlasovaciUri(),
  };
}

export async function odpoj(): Promise<void> {
  await Promise.all([smaz(KLICE.driveRefreshToken), smaz(KLICE.driveEmail)]);
}

export async function ulozSlozku(id: string, nazev: string): Promise<void> {
  await Promise.all([uloz(KLICE.driveFolderId, id), uloz(KLICE.driveFolderNazev, nazev)]);
}

/**
 * Načte obsah souboru z Google Drive jako Uint8Array.
 * Používá přístupový token získaný přes OAuth.
 * Vrací raw data (např. DOCX, XLSX) bez dalšího zpracování.
 */
export async function nactiSoubor(id: string): Promise<Uint8Array> {
  const token = await pristupovyToken();
  const res = await fetch(`${DRIVE_API}/files/${id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new DriveChyba(`Stahování souboru selhalo ${res.status}: ${await res.text()}`, res.status);
  }
  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}
  await Promise.all([uloz(KLICE.driveFolderId, id), uloz(KLICE.driveFolderNazev, nazev)]);
}

async function pristupovyToken(): Promise<string> {
  const refresh = await nacti(KLICE.driveRefreshToken);
  if (!refresh) throw new DriveChyba("Google Drive není připojen. Připojte ho v Nastavení.", 400);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refresh,
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new DriveChyba(
      "Přihlášení k Google Drive vypršelo. Připojte Drive v Nastavení znovu.",
      401,
    );
  }
  const data = (await res.json()) as TokenOdpoved;
  return data.access_token;
}

async function driveFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await pristupovyToken();
  const res = await fetch(`${DRIVE_API}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new DriveChyba(`Google Drive vrátil chybu ${res.status}: ${await res.text()}`, res.status);
  }
  return res;
}

export interface DriveSlozka {
  id: string;
  nazev: string;
  upraveno: string;
}

/** Složky v daném rodiči — pro výběr cílové složky v Nastavení. */
export async function seznamSlozek(rodic = "root"): Promise<DriveSlozka[]> {
  const q = `mimeType='${FOLDER_MIME}' and trashed=false and '${rodic}' in parents`;
  const params = new URLSearchParams({
    q,
    fields: "files(id,name,modifiedTime)",
    orderBy: "name",
    pageSize: "200",
  });
  const res = await driveFetch(`/files?${params.toString()}`);
  const data = (await res.json()) as {
    files?: { id: string; name: string; modifiedTime: string }[];
  };
  return (data.files ?? []).map((f) => ({ id: f.id, nazev: f.name, upraveno: f.modifiedTime }));
}

/** Najde podsložku podle názvu, případně ji založí. */
export async function zajistiSlozku(nazev: string, rodic: string): Promise<string> {
  const escaped = nazev.replace(/'/g, "\\'");
  const q = `mimeType='${FOLDER_MIME}' and trashed=false and name='${escaped}' and '${rodic}' in parents`;
  const res = await driveFetch(
    `/files?${new URLSearchParams({ q, fields: "files(id,name)", pageSize: "10" }).toString()}`,
  );
  const data = (await res.json()) as { files?: { id: string }[] };
  if (data.files?.length) return data.files[0].id;

  const vytvoreno = await driveFetch(`/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: nazev, mimeType: FOLDER_MIME, parents: [rodic] }),
  });
  const slozka = (await vytvoreno.json()) as { id: string };
  return slozka.id;
}

export interface NahranySoubor {
  id: string;
  url: string;
}

/** Nahraje soubor do složky; existující stejný název nahradí novým obsahem. */
export async function nahrajSoubor(
  nazev: string,
  obsah: Uint8Array,
  slozkaId: string,
  typ = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
): Promise<NahranySoubor> {
  const escaped = nazev.replace(/'/g, "\\'");
  const q = `trashed=false and name='${escaped}' and '${slozkaId}' in parents`;
  const existujici = await driveFetch(
    `/files?${new URLSearchParams({ q, fields: "files(id)", pageSize: "1" }).toString()}`,
  );
  const data = (await existujici.json()) as { files?: { id: string }[] };
  const fileId = data.files?.[0]?.id;

  const boundary = `lh${Date.now()}${Math.random().toString(36).slice(2)}`;
  const metadata = fileId
    ? { name: nazev }
    : { name: nazev, parents: [slozkaId] };
  const telo = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: ${typ}\r\n\r\n`,
    new Blob([obsah as unknown as BlobPart]),
    `\r\n--${boundary}--`,
  ]);

  const url = fileId
    ? `${UPLOAD_API}/files/${fileId}?uploadType=multipart&fields=id,webViewLink`
    : `${UPLOAD_API}/files?uploadType=multipart&fields=id,webViewLink`;

  const token = await pristupovyToken();
  const res = await fetch(url, {
    method: fileId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: telo,
  });
  if (!res.ok) {
    throw new DriveChyba(`Nahrání souboru „${nazev}“ selhalo (${res.status}): ${await res.text()}`, res.status);
  }
  const vysledek = (await res.json()) as { id: string; webViewLink?: string };
  return { id: vysledek.id, url: vysledek.webViewLink ?? `https://drive.google.com/file/d/${vysledek.id}/view` };
}

export function urlSlozky(id: string): string {
  return `https://drive.google.com/drive/folders/${id}`;
}
