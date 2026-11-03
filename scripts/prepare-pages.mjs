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
const appWorker = await readFile(path.join(dinoSource, "sw.js"), "utf8");
const versionedAppWorker = appWorker.replace(/const VERSION = "[^"]+";/, 'const VERSION = "' + revision + '";');
if (versionedAppWorker === appWorker) throw new Error("Could not version the Dinosaur Universe service worker.");
const adventurePath = path.join(dinoSource, "chapters", "adventures", "sw.js");
const adventureWorker = await readFile(adventurePath, "utf8");
const versionedAdventureWorker = adventureWorker.replace(/const CACHE_NAME = "[^"]+";/, 'const CACHE_NAME = "dinosaur-universe-shell-' + revision + '";');
if (versionedAdventureWorker === adventureWorker) throw new Error("Could not version the Adventures service worker.");
const release = JSON.stringify({ name: "Dinosaur Universe", revision, source: "jasperfish.com", builtAt: new Date().toISOString() }, null, 2) + "\n";
for (const directory of [dinoSource, dinoTarget]) {
  await writeFile(path.join(directory, "sw.js"), versionedAppWorker);
  await writeFile(path.join(directory, "chapters", "adventures", "sw.js"), versionedAdventureWorker);
  await writeFile(path.join(directory, "version.json"), release);
}

console.log("Dinosaur Universe release " + revision);
