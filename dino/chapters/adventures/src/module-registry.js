const modules = new Map();

export function registerModule(id, mount) {
  if (typeof id !== "string" || typeof mount !== "function") {
    throw new TypeError("A game module needs an id and a mount function.");
  }
  if (modules.has(id)) throw new Error("A game module is already registered: " + id);
  modules.set(id, mount);
}

export function getModule(id) {
  return modules.get(id) || null;
}
