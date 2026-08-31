/**
 * MiLAEDiA admin — the repository is the database.
 *
 * WHY THIS AND NOT A DATABASE
 *
 * The public site is static: 37 pages, no server, no runtime. Adding a real
 * admin the usual way means D1 + R2 + sessions + an SSR rebuild, which is
 * roughly fifty sessions of work, needs Cloudflare resources only the account
 * owner can create, and puts a login form on a public domain to be attacked.
 *
 * For a house with a dozen pieces edited occasionally, the repository already
 * is the database. This module reads and writes `src/data/catalogue.json`
 * through the GitHub Contents API. Saving is a commit; Cloudflare rebuilds on
 * push; the site stays static. Every edit has an author, a diff and a revert.
 *
 * THE TOKEN NEVER LEAVES THE BROWSER. It is held in localStorage on the
 * editor's own device and sent only to api.github.com. It is never committed,
 * never sent to this site, and there is no server here that could receive it.
 * A visitor without a token sees a locked panel and can do nothing.
 */

const API = 'https://api.github.com';
const KEY = 'milaedia:admin:v1';

export interface RepoConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export interface FileHandle {
  /** Needed by the API to prove the edit is against the version you read. */
  sha: string;
  text: string;
}

/* ---------- credentials, device-local only ---------- */

export function loadConfig(): RepoConfig | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    return c?.token && c?.owner && c?.repo ? c : null;
  } catch {
    return null;
  }
}

export function saveConfig(c: RepoConfig) {
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* private mode */ }
}

export function clearConfig() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/* ---------- transport ---------- */

async function call(c: RepoConfig, path: string, init: RequestInit = {}) {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${c.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let hint = '';
    if (res.status === 401) hint = ' — the token is wrong or expired.';
    if (res.status === 403) hint = ' — the token lacks Contents: read and write on this repository.';
    if (res.status === 404) hint = ' — repository, branch or file not found. Check owner/repo and that the token can see a private repo.';
    if (res.status === 409) hint = ' — someone else changed the file. Reload and try again.';
    throw new Error(`GitHub ${res.status}${hint}\n${body.slice(0, 300)}`);
  }
  return res;
}

/** Confirms the token works and reports who it belongs to. */
export async function verify(c: RepoConfig): Promise<string> {
  const me = await (await call(c, '/user')).json();
  await call(c, `/repos/${c.owner}/${c.repo}/branches/${c.branch}`);
  return me.login as string;
}

/* ---------- files ---------- */

const utf8 = {
  decode: (b64: string) => new TextDecoder().decode(
    Uint8Array.from(atob(b64.replace(/\n/g, '')), (ch) => ch.charCodeAt(0)),
  ),
  encode: (s: string) => {
    const bytes = new TextEncoder().encode(s);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  },
};

export async function readFile(c: RepoConfig, path: string): Promise<FileHandle> {
  const res = await call(c, `/repos/${c.owner}/${c.repo}/contents/${path}?ref=${c.branch}`);
  const j = await res.json();
  return { sha: j.sha, text: utf8.decode(j.content) };
}

/**
 * Writes a file and returns the new sha. `sha` is the version being replaced —
 * GitHub rejects the write if the file moved underneath, so two editors cannot
 * silently overwrite each other.
 */
export async function writeFile(
  c: RepoConfig, path: string, text: string, message: string, sha?: string,
): Promise<string> {
  const res = await call(c, `/repos/${c.owner}/${c.repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message, branch: c.branch, content: utf8.encode(text), ...(sha ? { sha } : {}),
    }),
  });
  return (await res.json()).content.sha as string;
}

/** Binary upload, for photography. Takes the raw bytes, not a string. */
export async function writeBinary(
  c: RepoConfig, path: string, bytes: Uint8Array, message: string, sha?: string,
): Promise<string> {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const res = await call(c, `/repos/${c.owner}/${c.repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message, branch: c.branch, content: btoa(bin), ...(sha ? { sha } : {}),
    }),
  });
  return (await res.json()).content.sha as string;
}

/** Lists a directory, so the media panel can show what is already there. */
export async function listDir(c: RepoConfig, path: string) {
  try {
    const res = await call(c, `/repos/${c.owner}/${c.repo}/contents/${path}?ref=${c.branch}`);
    const j = await res.json();
    return Array.isArray(j)
      ? j.filter((e: any) => e.type === 'file').map((e: any) => ({ name: e.name, path: e.path, size: e.size, sha: e.sha }))
      : [];
  } catch {
    return [];
  }
}

/** Most recent commits, so the editor can see that a save landed. */
export async function recentCommits(c: RepoConfig, limit = 8) {
  const res = await call(c, `/repos/${c.owner}/${c.repo}/commits?sha=${c.branch}&per_page=${limit}`);
  const j = await res.json();
  return j.map((x: any) => ({
    sha: x.sha.slice(0, 7),
    message: String(x.commit.message).split('\n')[0],
    author: x.commit.author?.name ?? 'unknown',
    date: x.commit.author?.date ?? '',
  }));
}
