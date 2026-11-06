# I can't draw

A multiplayer sketch game (up to 10 players). Players draw a prompt with their non dominant hand, then vote for their favourite. Live at https://samuelmarchant.github.io/i-cant-draw/

## Stack

- Plain static site: no build step, no package.json, no bundler. What is in `main` is exactly what is served.
- Hosted on GitHub Pages, deployed from `main` / `(root)`.
- Backend is Firebase (project `i-cant-draw-41bf8`): Realtime Database plus Anonymous Auth. Firebase SDK 10.12.2 is loaded as ES modules from `gstatic.com`.
- The game does NOT use claude.ai storage (`window.storage`) or anything from the old claude.ai artifact version. Do not reintroduce it.

## Files

- `index.html`: the whole game. CSS in the `<style>` block at the top, all logic in one `<script type="module">`. Code is written in a compact, minified-ish style (short names, one-liners); match it when editing.
- `firebase-config.js`: sets `window.FIREBASE_CONFIG`. The web config is safe to publish; access is controlled by the rules.
- `database.rules.json`: Realtime Database rules. Changing this file does nothing on its own; it has to be pasted into the Firebase console (Realtime Database > Rules > Publish).
- `README.md`: first time Firebase and Pages setup.

## How the game works (index.html)

- `makeDb()` is a small adapter that gives a Firestore-like `doc` / `collection` / `onSnapshot` API on top of Realtime Database. A two segment path like `games/ABCDE` maps to `games/ABCDE/meta`.
- Data lives under `games/<code>/` (`meta`, `players`, `sketches`, `votes`, `reactions`) and `presence/<code>/<uid>`. Reactions are one doc per player per round, `{round, voter, r: {pid: "010"}}`, where each digit toggles one of `RX`; they never affect scores.
- The player's name is remembered in `localStorage` (`icd-name`) via the `LS` helper, which fails quietly in private windows.
- Finished games stay in the database so the final screen's sketch gallery works. Ending a game deletes it 5 seconds later; everything else is removed by the clean-up job below.
- Phases: `lobby` > `drawing` > `voting` > `results` > (next round or `final`); `ended` when someone ends the game.
- No server: the effective host's browser advances phases in `hostDrive()`, which runs every 500ms. If the host drops, `effHost()` hands control to the first active player.
- Tunables near the top of the script: `WORDS`, `ROUNDS`, `DRAW_MS`, `VOTE_MS`, `MAX`, `COLORS`, `THEMES`.
- Game codes are 5 characters and are put in the URL hash for invites.

## Testing locally

Serve the folder over HTTP (ES modules do not load from `file://`):

```bash
python3 -m http.server 8000
```

The Firebase API key is restricted to the live site, so on localhost the game shows "Couldn't connect" (`auth/requests-from-referer-http://localhost:8000-are-blocked`). Leave that restriction in place. To test UI changes locally, serve a throwaway copy (outside the repo) whose three Firebase `import` lines point at a small in-memory fake exposing the same functions (`initializeApp`, `getDatabase`, `ref`, `get`, `set`, `update`, `remove`, `onValue`, `onDisconnect`, `getAuth`, `signInAnonymously`). Solo test mode lets one player play through every phase. Check mobile at 375px wide; the mobile styles are in the `@media(max-width:600px)` block at the end of the `<style>`.

## Clean-up of old games

`.github/workflows/cleanup-games.yml` runs `.github/scripts/cleanup-games.mjs` daily (and on demand from the Actions tab). It deletes games whose `meta/createdAt` is older than `MAX_AGE_HOURS` (24) or missing, plus presence entries with no game. It reads with `?shallow=true`, so sketches are never downloaded.

It needs the repository secret `FIREBASE_SERVICE_ACCOUNT`: the full JSON of a key from Firebase console > Project settings > Service accounts > Generate new private key. Sam adds it in GitHub (Settings > Secrets and variables > Actions); never ask for, print or commit the key. Pushing changes under `.github/workflows/` needs a GitHub login with the `workflow` scope (`gh auth refresh -h github.com -s workflow`).

## Making an update

1. Edit the files.
2. Test locally as above.
3. Commit to `main` with a clear message.
4. `git push origin main`. GitHub Pages republishes in a minute or two; hard refresh to see it.
5. If `database.rules.json` changed, remind Sam to publish the new rules in the Firebase console, since that is not automatic.

Only commit and push when Sam asks.
