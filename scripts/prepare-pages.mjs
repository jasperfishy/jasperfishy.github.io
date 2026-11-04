import { createHash } from "node:crypto";
import { cp, copyFile, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const source = name => fileURLToPath(new URL("dist/" + name, root));
const target = name => fileURLToPath(new URL(name, root));

// GitHub Pages serves main:/, while Vite builds from index.source.html.
// Keep older hashed bundles available for visitors with cached HTML.
await cp(source("assets"), target("assets"), { recursive: true });
await cp(source("fonts"), target("fonts"), { recursive: true });
await copyFile(source("favicon.svg"), target("favicon.svg"));
await copyFile(source("og-jasperfish.png"), target("og-jasperfish.png"));
await copyFile(source("index.source.html"), target("index.html"));
// Publish every discovered local app, not only the first one added.
const apps = JSON.parse(await readFile(new URL("src/data/apps.json", root), "utf8"));
for (const app of apps) if (app.folder) await cp(source(app.folder), target(app.folder), { recursive: true });

// Tie the Dinosaur Universe service-worker bytes to every published game file.
// This lets the browser notice a game-only change during its daily update check.
const dinoSource = source("dino");
const dinoTarget = target("dino");
async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}
const files = (await listFiles(dinoSource)).sort();
const digest = createHash("sha256");
for (const file of files) {
  const relative = path.relative(dinoSource, file).split(path.sep).join("/");
  if (relative === "version.json") continue;
  let contents = await readFile(file);
  if (relative === "sw.js") contents = Buffer.from(contents.toString("utf8").replace(/const VERSION = "[^"]+";/, 'const VERSION = "__DU_VERSION__";'));
  if (relative === "chapters/adventures/sw.js") contents = Buffer.from(contents.toString("utf8").replace(/const CACHE_NAME = "[^"]+";/, 'const CACHE_NAME = "__DU_VERSION__";'));
  digest.update(relative).update(Buffer.from([0])).update(contents).update(Buffer.from([0]));
}
const revision = "du-" + digest.digest("hex").slice(0, 16);

function withReleaseQuery(url) {
  const hashIndex = url.indexOf("#");
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const queryIndex = withoutHash.indexOf("?");
  const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const query = new URLSearchParams(queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "");
  query.set("v", revision);
  return pathname + "?" + query.toString() + hash;
}

function versionCacheEntries(workerSource, name) {
  const marker = "const " + name + " = [";
  const start = workerSource.indexOf(marker);
  const end = workerSource.indexOf("\n];", start);
  if (start < 0 || end < 0) throw new Error("Could not find " + name + " in the service worker.");
  const entriesStart = start + marker.length;
  const entries = workerSource.slice(entriesStart, end).replace(/(["'])(\.\/[^"']*)\1/g, (_match, quote, url) =>
    quote + withReleaseQuery(url) + quote
  );
  return workerSource.slice(0, entriesStart) + entries + workerSource.slice(end);
}

async function versionHtmlAssets() {
  let changedUrls = 0;
  const origin = "https://jasperfish.com";
  const appBase = origin + "/dino/";
  for (const file of files.filter((item) => item.toLowerCase().endsWith(".html"))) {
    const relative = path.relative(dinoSource, file).split(path.sep).join("/");
    const outputPath = path.join(dinoTarget, ...relative.split("/"));
    const pageUrl = new URL(relative, appBase);
    const html = await readFile(outputPath, "utf8");
    const versioned = html.replace(/(\b(?:src|href)\s*=\s*)(["'])([^"']+)\2/gi, (match, prefix, quote, url) => {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#|data:)/i.test(url)) return match;
      let resolved;
      try { resolved = new URL(url, pageUrl); } catch { return match; }
      if (resolved.origin !== origin || !resolved.pathname.startsWith("/dino/")) return match;
      if (!/\.(?:html?|js|mjs|cjs|css|svg|webmanifest|json|png|jpe?g|webp|gif|avif|woff2?|ttf|otf|mp3|wav|ogg|mp4|webm)$/i.test(resolved.pathname)) return match;
      const hashIndex = url.indexOf("#");
      const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
      const withoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
      const queryIndex = withoutHash.indexOf("?");
      const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
      const query = new URLSearchParams(queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "");
      query.set("v", revision);
      changedUrls += 1;
      return prefix + quote + pathname + "?" + query.toString() + hash + quote;
    });
    await writeFile(outputPath, versioned);
  }
  if (!changedUrls) throw new Error("No Dinosaur Universe page assets were release-versioned.");
  return changedUrls;
}

// Give browser module imports the release URL too; HTML-only cache busting would leave
// imports such as chapters.js vulnerable to the same long CDN cache.
async function versionJavaScriptImports() {
  let changedImports = 0;
  const origin = "https://jasperfish.com";
  const appBase = origin + "/dino/";
  for (const file of files.filter((item) => /\.m?js$/i.test(item))) {
    const relative = path.relative(dinoSource, file).split(path.sep).join("/");
    const outputPath = path.join(dinoTarget, ...relative.split("/"));
    const moduleUrl = new URL(relative, appBase);
    const source = await readFile(outputPath, "utf8");
    const versioned = source.replace(/(\bfrom\s*|\bimport\s*(?:\(\s*)?)(["'])(\.\.?\/[^"'\r\n]+)\2/g, (match, prefix, quote, specifier) => {
      let resolved;
      try { resolved = new URL(specifier, moduleUrl); } catch { return match; }
      if (resolved.origin !== origin || !resolved.pathname.startsWith("/dino/")) return match;
      if (!/\.(?:m?js|css|json)(?:$|[?#])/i.test(resolved.pathname)) return match;
      changedImports += 1;
      return prefix + quote + withReleaseQuery(specifier) + quote;
    });
    if (versioned !== source) await writeFile(outputPath, versioned);
  }
  if (!changedImports) throw new Error("No local JavaScript module imports were release-versioned.");
  return changedImports;
}

const versionedModuleImports = await versionJavaScriptImports();
const appWorker = await readFile(path.join(dinoSource, "sw.js"), "utf8");
const versionedAppWorker = versionCacheEntries(
  appWorker.replace(/const VERSION = "[^"]+";/, 'const VERSION = "' + revision + '";'),
  "ASSETS"
);
if (versionedAppWorker === appWorker) throw new Error("Could not version the Dinosaur Universe service worker.");
const adventurePath = path.join(dinoSource, "chapters", "adventures", "sw.js");
const adventureWorker = await readFile(adventurePath, "utf8");
const versionedAdventureWorker = versionCacheEntries(
  adventureWorker.replace(/const CACHE_NAME = "[^"]+";/, 'const CACHE_NAME = "dinosaur-universe-shell-' + revision + '";'),
  "CORE_FILES"
);
if (versionedAdventureWorker === adventureWorker) throw new Error("Could not version the Adventures service worker.");
const versionedHtmlAssets = await versionHtmlAssets();
const release = JSON.stringify({ name: "Dinosaur Universe", revision, source: "jasperfish.com", builtAt: new Date().toISOString() }, null, 2) + "\n";
for (const directory of [dinoSource, dinoTarget]) {
  await writeFile(path.join(directory, "sw.js"), versionedAppWorker);
  await writeFile(path.join(directory, "chapters", "adventures", "sw.js"), versionedAdventureWorker);
  await writeFile(path.join(directory, "version.json"), release);
}

console.log("Dinosaur Universe release " + revision + " with " + versionedHtmlAssets + " versioned page asset URLs and " + versionedModuleImports + " module imports.");
