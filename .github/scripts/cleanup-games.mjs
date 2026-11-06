// Deletes games older than MAX_AGE_HOURS (and any presence entries without a game) from the Realtime Database.
// Run by .github/workflows/cleanup-games.yml with the FIREBASE_SERVICE_ACCOUNT repository secret.
// Uses the REST API with ?shallow=true so it only downloads game codes and timestamps, never the sketches.
import admin from "firebase-admin";

const {FIREBASE_SERVICE_ACCOUNT, DATABASE_URL, MAX_AGE_HOURS = "24"} = process.env;
if (!FIREBASE_SERVICE_ACCOUNT) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT secret. See CLAUDE.md > Clean-up of old games.");
  process.exit(1);
}

const {access_token} = await admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT)).getAccessToken();
const base = DATABASE_URL.replace(/\/$/, "");
async function api(path, {method = "GET", query = ""} = {}) {
  const res = await fetch(`${base}/${path}.json?access_token=${access_token}${query}`, {method});
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}
const keys = async path => Object.keys((await api(path, {query: "&shallow=true"})) || {});

const cutoff = Date.now() - Number(MAX_AGE_HOURS) * 3600e3;
const codes = await keys("games"), kept = new Set();
let removedGames = 0, removedPresence = 0;

for (const code of codes) {
  const createdAt = await api(`games/${encodeURIComponent(code)}/meta/createdAt`);
  if (typeof createdAt === "number" && createdAt > cutoff) { kept.add(code); continue; }
  await api(`games/${encodeURIComponent(code)}`, {method: "DELETE"});
  removedGames++;
}
for (const code of await keys("presence")) {
  if (kept.has(code)) continue;
  await api(`presence/${encodeURIComponent(code)}`, {method: "DELETE"});
  removedPresence++;
}

console.log(`Checked ${codes.length} games: removed ${removedGames} older than ${MAX_AGE_HOURS}h, kept ${kept.size}, removed ${removedPresence} stale presence entries.`);
