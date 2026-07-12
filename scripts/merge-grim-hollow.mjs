/**
 * merge-grim-hollow.mjs
 *
 * Merges Grim Hollow 2024 homebrew content (Campaign Guide, Player's Guide,
 * Monster Grimoire) from TheGiddyLimit/homebrew into the app's resolved JSON
 * data files under public/data/resolved/.
 *
 * Idempotent: any entity whose `source` starts with "GrimHollow" is stripped
 * before re-appending, so the script is safe to re-run.
 *
 * Usage:
 *   node scripts/merge-grim-hollow.mjs            # read from scripts/vendor/
 *   node scripts/merge-grim-hollow.mjs --fetch     # download vendor files first
 *
 * Requires Node >= 20. No external dependencies.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RESOLVED_DIR = join(ROOT, "public", "data", "resolved");
const BOOKS_DIR = join(RESOLVED_DIR, "books");
const VENDOR_DIR = join(__dirname, "vendor");

const SOURCE_PREFIX = "GrimHollow";
const NOW = new Date().toISOString();

/** Upstream vendor file specs. */
const VENDOR_FILES = {
  CG24: { file: "CG24.json", source: "GrimHollowCG24" },
  PG24: { file: "PG24.json", source: "GrimHollowPG24" },
  MG24: { file: "MG24.json", source: "GrimHollowMG24" },
};

const VENDOR_URLS = {
  CG24: "https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Ghostfire%20Gaming%3B%20Grim%20Hollow%20-%20Campaign%20Guide%20-%202024.json",
  PG24: "https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Ghostfire%20Gaming%3B%20Grim%20Hollow%20-%20Player%27s%20Guide%20-%202024.json",
  MG24: "https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Ghostfire%20Gaming%3B%20Grim%20Hollow%20-%20Monster%20Grimoire%20-%202024.json",
};

/**
 * Map from upstream top-level array key to the resolved-file basename and
 * `__prop` discriminator (items.json packs multiple kinds into one file).
 * @type {Record<string, { file: string, prop?: string }>}
 */
const TYPE_MAP = {
  spell: { file: "spells.json" },
  monster: { file: "bestiary.json" },
  item: { file: "items.json", prop: "item" },
  itemGroup: { file: "items.json", prop: "itemGroup" },
  magicvariant: { file: "items.json", prop: "magicvariant" },
  baseitem: { file: "items.json", prop: "baseitem" },
  class: { file: "classes.json" },
  subclass: { file: "subclasses.json" },
  background: { file: "backgrounds.json" },
  race: { file: "species.json" },
  feat: { file: "feats.json" },
  variantrule: { file: "variantrules.json" },
  condition: { file: "conditions.json" },
  deity: { file: "deities.json" },
  disease: { file: "diseases.json" },
  language: { file: "languages.json" },
  legendaryGroup: { file: "legendarygroups.json" },
  table: { file: "tables.json" },
  charoption: { file: "transformations.json" },
  optionalfeature: { file: "optionalfeatures.json" },
};

// ---------- helpers ----------

/** @param {string} p */
async function readJson(p) {
  return JSON.parse(await readFile(p, "utf8"));
}

/** @param {string} p, @param {unknown} v */
async function writeJson(p, v) {
  await writeFile(p, JSON.stringify(v, null, 2) + "\n", "utf8");
}

/** Strip any entity whose source starts with the Grim Hollow prefix. */
function stripGrimHollow(entities) {
  return entities.filter(
    (e) => !(e && typeof e === "object" && typeof e.source === "string" && e.source.startsWith(SOURCE_PREFIX)),
  );
}

/**
 * Load a resolved file if it exists, else synthesize an empty envelope.
 * @param {string} basename
 */
async function loadResolved(basename) {
  const p = join(RESOLVED_DIR, basename);
  if (existsSync(p)) {
    const data = await readJson(p);
    if (!Array.isArray(data.entities)) {
      throw new Error(`${basename}: expected entities array, got ${typeof data.entities}`);
    }
    return data;
  }
  return {
    entities: [],
    generatedAt: NOW,
    source: "5etools-src (One/2024 edition, build-time pre-merged)",
    edition: "one",
  };
}

/**
 * Append `__prop` discriminator to items that lack it (items.json convention).
 * @param {any[]} entities
 * @param {string} prop
 */
function withProp(entities, prop) {
  if (!prop) return entities;
  return entities.map((e) => ({ ...e, __prop: e.__prop ?? prop }));
}

// ---------- main ----------

/**
 * Resolve classFeatures/subclassFeatures UID references into ClassFeature[][]
 * for every Grim Hollow class and subclass in the resolved files.
 *
 * Upstream format: `classFeatures` is a flat array of strings
 *   "FeatureName|ClassName|ClassSource|Level"
 * and objects `{ classFeature: "...", gainSubclassFeature: true }`.
 *
 * Target format: `ClassFeature[][]` indexed by [level-1], each element the
 * full feature object (looked up from the upstream classFeature array).
 *
 * @param {Record<string, any>} brews
 */
function resolveClassFeatures(brews) {
  // Build lookup indexes from the upstream feature arrays.
  // classFeature key: "Name|ClassName|ClassSource|Level"
  // subclassFeature key: "Name|ClassName|ClassSource|SubclassShortName|SubclassSource|Level"
  /** @type {Map<string, any>} */
  const classFeatureIndex = new Map();
  /** @type {Map<string, any>} */
  const subclassFeatureIndex = new Map();
  let cfCount = 0;
  let sfCount = 0;

  for (const brew of Object.values(brews)) {
    for (const cf of brew.classFeature ?? []) {
      const key = `${cf.name}|${cf.className}|${cf.classSource}|${cf.level}`;
      classFeatureIndex.set(key, cf);
      cfCount++;
    }
    for (const sf of brew.subclassFeature ?? []) {
      const key = `${sf.name}|${sf.className}|${sf.classSource}|${sf.subclassShortName}|${sf.subclassSource}|${sf.level}`;
      subclassFeatureIndex.set(key, sf);
      sfCount++;
    }
  }

  if (cfCount === 0 && sfCount === 0) {
    console.log("  no classFeature/subclassFeature entries to resolve");
    return;
  }

  // Helper: resolve a single reference entry (string or {classFeature, gainSubclassFeature}).
  function resolveRef(ref) {
    const uid = typeof ref === "string" ? ref : ref?.classFeature;
    if (!uid) return null;
    const feature = classFeatureIndex.get(uid);
    if (!feature) return null;
    if (typeof ref === "object" && ref.gainSubclassFeature) {
      return { ...feature, gainSubclassFeature: true };
    }
    return feature;
  }

  function resolveSubclassRef(ref) {
    const uid = typeof ref === "string" ? ref : ref?.subclassFeature;
    if (!uid) return null;
    const feature = subclassFeatureIndex.get(uid);
    if (!feature) return null;
    if (typeof ref === "object" && ref.gainSubclassFeature) {
      return { ...feature, gainSubclassFeature: true };
    }
    return feature;
  }

  /**
   * Convert a flat reference array into ClassFeature[][] grouped by level.
   * @param {any[]} refs - flat array of UID strings / objects
   * @param {(ref: any) => any | null} resolver
   * @returns {any[][]} 2D array indexed [level-1]
   */
  function toLevelGroups(refs, resolver) {
    /** @type {any[][]} */
    const groups = [];
    for (const ref of refs) {
      const feature = resolver(ref);
      if (!feature) continue;
      const lvl = feature.level;
      const idx = lvl - 1;
      if (idx < 0) continue;
      if (!groups[idx]) groups[idx] = [];
      groups[idx].push(feature);
    }
    // Fill missing levels with empty arrays so groups[level-1] always exists.
    for (let i = 0; i < groups.length; i++) {
      if (!groups[i]) groups[i] = [];
    }
    return groups;
  }

  // Patch classes.json
  const classesPath = join(RESOLVED_DIR, "classes.json");
  const classes = readJsonSync(classesPath);
  let classCount = 0;
  for (const entity of classes.entities) {
    if (typeof entity.source !== "string" || !entity.source.startsWith(SOURCE_PREFIX)) continue;
    if (!Array.isArray(entity.classFeatures)) continue;
    entity.classFeatures = toLevelGroups(entity.classFeatures, resolveRef);
    classCount++;
  }
  writeJsonSync(classesPath, classes);
  console.log(`  classes.json: resolved classFeatures for ${classCount} Grim Hollow class(es)`);

  // Patch subclasses.json
  const subclassesPath = join(RESOLVED_DIR, "subclasses.json");
  const subclasses = readJsonSync(subclassesPath);
  let subclassCount = 0;
  for (const entity of subclasses.entities) {
    if (typeof entity.source !== "string" || !entity.source.startsWith(SOURCE_PREFIX)) continue;
    if (!Array.isArray(entity.subclassFeatures)) continue;
    entity.subclassFeatures = toLevelGroups(entity.subclassFeatures, resolveSubclassRef);
    subclassCount++;
  }
  writeJsonSync(subclassesPath, subclasses);
  console.log(`  subclasses.json: resolved subclassFeatures for ${subclassCount} Grim Hollow subclass(es)`);

  console.log(`  (index: ${cfCount} classFeatures, ${sfCount} subclassFeatures)`);
}

/** Synchronous JSON read/write (used by resolveClassFeatures after initial load). */
function readJsonSync(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}
function writeJsonSync(p, v) {
  writeFileSync(p, JSON.stringify(v, null, 2) + "\n", "utf8");
}

async function fetchVendor() {
  console.log("→ Fetching vendor files…");
  await mkdir(VENDOR_DIR, { recursive: true });
  for (const [key, url] of Object.entries(VENDOR_URLS)) {
    const dest = join(VENDOR_DIR, VENDOR_FILES[key].file);
    if (existsSync(dest)) {
      console.log(`  ✓ ${key}: already vendored`);
      continue;
    }
    console.log(`  ↓ ${key}: ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${key}: ${res.status} ${res.statusText}`);
    await writeFile(dest, await res.text(), "utf8");
    console.log(`  ✓ ${key}: saved`);
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--fetch")) await fetchVendor();

  // 1. Load the 3 upstream homebrew collections.
  /** @type {Record<string, any>} */
  const brews = {};
  for (const [key, spec] of Object.entries(VENDOR_FILES)) {
    const p = join(VENDOR_DIR, spec.file);
    if (!existsSync(p)) {
      throw new Error(
        `Missing vendor file ${spec.file}. Re-run with --fetch, or place the file at ${p}.`,
      );
    }
    brews[key] = await readJson(p);
    console.log(`Loaded ${key} (${spec.source})`);
  }

  // 2. Aggregate entities per resolved file. Each basename maps to an array of
  //    { entities, prop? } contributions to concatenate.
  /** @type {Map<string, { entities: any[], prop?: string }[]>} */
  const contributions = new Map();
  const counts = new Map();

  for (const brew of Object.values(brews)) {
    for (const [upstreamKey, spec] of Object.entries(TYPE_MAP)) {
      const arr = brew[upstreamKey];
      if (!Array.isArray(arr) || arr.length === 0) continue;
      const list = contributions.get(spec.file) ?? [];
      list.push({ entities: arr, prop: spec.prop });
      contributions.set(spec.file, list);
      counts.set(upstreamKey, (counts.get(upstreamKey) ?? 0) + arr.length);
    }
  }

  // 3. Merge into each resolved file.
  /** @type {string[]} */
  const touchedFiles = [];
  for (const [basename, contribs] of contributions) {
    const data = await loadResolved(basename);
    const kept = stripGrimHollow(data.entities);
    const added = contribs.flatMap((c) => withProp(c.entities, c.prop));
    data.entities = [...kept, ...added];
    data.generatedAt = NOW;
    if (!("edition" in data) && basename !== "books.json") data.edition = "one";
    await writeJson(join(RESOLVED_DIR, basename), data);
    touchedFiles.push(basename);
    console.log(`  ${basename}: kept ${kept.length}, added ${added.length} → ${data.entities.length}`);
  }

  // 3b. Resolve class/subclass feature references.
  // Upstream homebrew ships classFeatures/subclassFeatures as flat arrays of
  // UID reference strings ("Name|Class|Source|Level"). The app's renderer
  // expects ClassFeature[][] — a 2D array indexed by [level-1] of fully
  // expanded feature objects. Build a lookup index from the upstream
  // classFeature/subclassFeature arrays, then resolve each entity's references.
  resolveClassFeatures(brews);

  // 4. Books: append book metadata + write per-book readable content files.
  await mergeBooks(brews);

  // 5. Summary.
  console.log("\n✓ Merge complete.");
  console.log("Per-type counts (appended):");
  for (const [k, v] of [...counts.entries()].sort()) {
    console.log(`  ${k.padEnd(20)} ${v}`);
  }
  console.log(`Resolved files touched: ${touchedFiles.length}`);
}

/**
 * Append the 3 Grim Hollow `book` entries to books.json (which uses
 * edition:"all"), and write per-book readable content files from bookData.
 *
 * The upstream `cover` uses `{ type:"external", url }`; the app renders only
 * `{ type:"internal", path }`. We remap to an internal path that the BookCard
 * `onError` fallback will gracefully handle (no cover asset is shipped).
 *
 * @param {Record<string, any>} brews
 */
async function mergeBooks(brews) {
  const booksPath = join(RESOLVED_DIR, "books.json");
  const books = await loadResolved("books.json");
  const kept = stripGrimHollow(books.entities);
  /** @type {any[]} */
  const newBooks = [];
  await mkdir(BOOKS_DIR, { recursive: true });

  for (const brew of Object.values(brews)) {
    const bookEntries = brew.book;
    const bookDataEntries = brew.bookData;
    if (!Array.isArray(bookEntries)) continue;
    for (const book of bookEntries) {
      const remapped = {
        ...book,
        // Normalize upstream "homebrew" group to the app's third-party bucket
        // so all three Grim Hollow books land under one labeled section.
        group: "supplement-alt",
        isOneEdition: true,
        cover: {
          type: "internal",
          path: `covers/${book.source ?? book.id}.webp`,
        },
      };
      newBooks.push(remapped);
    }
    if (Array.isArray(bookDataEntries)) {
      for (const bd of bookDataEntries) {
        const id = String(bd.id ?? "").toLowerCase();
        if (!id) continue;
        const outPath = join(BOOKS_DIR, `${id}.json`);
        await writeJson(outPath, bd.data ?? []);
        console.log(`  books/${id}.json: ${bd.data?.length ?? 0} sections`);
      }
    }
  }

  books.entities = [...kept, ...newBooks];
  books.generatedAt = NOW;
  await writeJson(booksPath, books);
  console.log(`  books.json: kept ${kept.length}, added ${newBooks.length} → ${books.entities.length}`);
}

main().catch((err) => {
  console.error("✗ Merge failed:", err);
  process.exit(1);
});
