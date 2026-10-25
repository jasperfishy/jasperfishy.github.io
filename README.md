# Jasperfish

The portfolio at https://jasperfish.com, featuring FocusDrop. React and Vite; static hosting through GitHub Pages from `main:/`.

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
