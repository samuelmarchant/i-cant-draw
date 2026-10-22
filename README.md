# I can't draw

A multiplayer sketch game for up to 10 players. Draw the prompt with your non dominant hand, then vote for your favourite.

## Files

- `index.html` : the game
- `firebase-config.js` : your Firebase settings (fill this in)
- `database.rules.json` : security rules to paste into Firebase

## Setup

1. Create a Firebase project at https://console.firebase.google.com (Google Analytics can be turned off).
2. Build > Authentication > Get started > Sign-in method > enable **Anonymous**.
3. Build > Realtime Database > Create database > choose a location > start in **locked mode**.
4. In the Realtime Database **Rules** tab, replace everything with the contents of `database.rules.json` and click **Publish**.
5. Project settings (gear icon) > General > Your apps > click the web icon `</>` > register an app (no hosting needed) > copy the `firebaseConfig` values into `firebase-config.js`.
   Make sure `databaseURL` is included; copy it from the Realtime Database page if it is missing.
6. Authentication > Settings > Authorized domains > add `samuelmarchant.github.io`.
7. Upload all files to the repository, then Settings > Pages > Deploy from a branch > `main` / `(root)` > Save.

The game will be live at `https://samuelmarchant.github.io/<repo-name>/` after a minute or two.

The Firebase web config is safe to publish; access is controlled by the security rules and anonymous sign-in.
