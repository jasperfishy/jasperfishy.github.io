# Jasperfish

The app directory at https://jasperfish.com, featuring FocusDrop and Dino Meadow. React and Vite; static hosting through GitHub Pages from `main:/`.

## Adding an app

- Local apps: put the app in `public/<app-name>/` with an `index.html` and a `manifest.webmanifest` (or `manifest.json`) containing `name`, `description`, and optionally `icons`. The build discovers these apps, creates homepage cards, and copies them to their published folders.
- Apps hosted elsewhere or on a subdomain: add an entry to `apps.external.json` with a unique `id`, `name`, `description`, HTTPS `url`, and optional `category`.
- Run `npm run build:pages`, review, commit and push. `src/data/apps.json` is generated; do not edit it by hand. Discovery happens at build time, not by scanning DNS or live hosting accounts. To remove a local listing, remove its source manifest/app from the public tree; old published folders require separate deliberate cleanup.

## Development

```sh
npm install
npm run dev
```

Open `/index.source.html` during development. `index.html` is the compiled Pages entry, not the editable source.

```sh
npm run lint
npm run build:pages
npm run preview -- --host 127.0.0.1 --port 4187
```

The Pages command builds the source, copies the generated assets and self-hosted fonts to the repository root, and updates `index.html`. Previous hashed bundles remain available for cached page loads. Committing and pushing the prepared files to `main` triggers Pages deployment.

## Design and behaviour

See [DESIGN.md](DESIGN.md). The capture demo is temporary React state only; it does not store or send thoughts. Opening FocusDrop loads the existing app in a native dialog, with keyboard dismissal, focus restoration, and an external link. The installation link goes directly to the app's own installation guidance.

The actual FocusDrop app is maintained in a separate repository. Editing this website must not overwrite its code or browser data. Manrope's font licence is included under `public/fonts/OFL.txt`.
