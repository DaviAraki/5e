import { useEffect, useMemo, useState } from "react";
import type { Spell } from "@/types/entities";
import { useSpells } from "@/data/DataLoader";
import { indexByRef, makeRef, refKey } from "@/data/entityRefs";
import SpellStatBlock from "@/components/StatBlock/SpellStatBlock";
import { parseBooks, useSpellBook } from "@/state/spellBook";
import { decodeBooks, encodeBooks } from "@/state/spellBookCodec";
import { spSchoolToAbv, spTimeToShort } from "@/lib/spellFormatters";

/**
 * Spell Book page: manage named spell books (e.g. one per character) and toggle
 * which spells are memorized. Mirrors the SpellsPage master-detail layout but
 * draws its list from the persisted spell-book store, resolving keys to full
 * Spell objects via the React Query spells cache.
 */
export default function SpellBookPage() {
  const { data, isLoading, error } = useSpells();
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isMobileDetail, setIsMobileDetail] = useState(false);

  // Spell-book store. Subscribe to the whole books map so list re-renders on
  // any membership / memorized change.
  const books = useSpellBook((s) => s.books);
  const activeBookId = useSpellBook((s) => s.activeBookId);
  const setActiveBook = useSpellBook((s) => s.setActiveBook);
  const createBook = useSpellBook((s) => s.createBook);
  const renameBook = useSpellBook((s) => s.renameBook);
  const deleteBook = useSpellBook((s) => s.deleteBook);
  const removeFromBook = useSpellBook((s) => s.removeFromBook);
  const toggleMemorized = useSpellBook((s) => s.toggleMemorized);
  const exportBooks = useSpellBook((s) => s.exportBooks);
  const importBooks = useSpellBook((s) => s.importBooks);

  // Export/import panel state.
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exportCode, setExportCode] = useState("");
  const [importCode, setImportCode] = useState("");
  const [exportError, setExportError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const allSpells = data?.entities ?? [];
  const spellsByRef = useMemo(() => indexByRef(allSpells), [allSpells]);

  const bookList = useMemo(
    () =>
      Object.values(books).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [books],
  );
  const activeBook = activeBookId ? books[activeBookId] ?? null : null;

  // Resolve the active book's stored keys into full Spell objects.
  const bookSpells = useMemo<Spell[]>(() => {
    if (!activeBook) return [];
    return Object.keys(activeBook.spells)
      .map((k) => spellsByRef.get(k))
      .filter((s): s is Spell => s != null);
  }, [activeBook, spellsByRef]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = q ? bookSpells.filter((s) => s.name.toLowerCase().includes(q)) : bookSpells;
    return [...out].sort((a, b) => a.name.localeCompare(b.name));
  }, [bookSpells, search]);

  const selected = useMemo(
    () => (selectedKey ? spellsByRef.get(selectedKey) ?? null : null),
    [spellsByRef, selectedKey],
  );

  const memorizedCount = activeBook
    ? Object.values(activeBook.spells).filter(Boolean).length
    : 0;

  useEffect(() => {
    if (!selectedKey) setIsMobileDetail(false);
  }, [selectedKey]);

  // If the active book changes, clear the selection (it may not be in the new book).
  useEffect(() => {
    setSelectedKey(null);
  }, [activeBookId]);

  if (isLoading) return <Centered>Loading spells…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">Failed to load: {String(error.message)}</div>
      </Centered>
    );

  // --- empty state: no books yet ---
  if (bookList.length === 0) {
    return (
      <Centered>
        <div className="max-w-sm text-center">
          <p className="text-fg-muted">You have no spell books yet.</p>
          <button
            type="button"
            onClick={() => {
              const name = window.prompt("Spell book name");
              if (name != null) createBook(name);
            }}
            className="mt-4 rounded-md border border-accent bg-accent-subtle px-3 py-1.5 text-sm text-accent hover:bg-accent"
          >
            + Create Spell Book
          </button>
        </div>
      </Centered>
    );
  }

  function selectSpell(key: string) {
    setSelectedKey(key);
    setIsMobileDetail(true);
  }

  function handleNew() {
    const name = window.prompt("New spell book name");
    if (name != null) createBook(name);
  }

  function handleRename() {
    if (!activeBook) return;
    const name = window.prompt("Rename spell book", activeBook.name);
    if (name != null) renameBook(activeBook.id, name);
  }

  function handleDelete() {
    if (!activeBook) return;
    if (window.confirm(`Delete “${activeBook.name}”? This cannot be undone.`)) {
      deleteBook(activeBook.id);
    }
  }

  async function openExport() {
    setShowImport(false);
    setImportCode("");
    setImportError(null);
    setExportError(null);
    setExportCode("");
    setShowExport(true);
    try {
      const code = await encodeBooks(exportBooks());
      setExportCode(code);
    } catch (e) {
      setExportError(String(e instanceof Error ? e.message : e));
    }
  }

  async function copyExport() {
    if (!exportCode) return;
    try {
      await navigator.clipboard.writeText(exportCode);
    } catch {
      // clipboard API can be unavailable (non-secure context); fail silently.
    }
  }

  async function doImport() {
    setImportError(null);
    try {
      const decoded = await decodeBooks(importCode);
      const parsed = parseBooks(decoded);
      if (!parsed) {
        setImportError("That code doesn't contain valid spell books.");
        return;
      }
      const n = importBooks(parsed);
      if (n === 0) {
        setImportError("No spell books found in that code.");
      } else {
        setImportCode("");
        setShowImport(false);
        window.alert(`Imported ${n} spell book${n === 1 ? "" : "s"}.`);
      }
    } catch (e) {
      setImportError(String(e instanceof Error ? e.message : e));
    }
  }

  return (
    <div className="flex h-full">
      {/* LIST PANE */}
      <aside
        className={`${
          isMobileDetail ? "hidden md:flex" : "flex"
        } w-full flex-col border-border bg-bg-subtle md:w-96 md:shrink-0 md:border-r`}
      >
        {/* Book management bar */}
        <div className="border-b border-border p-2">
          <div className="flex items-center gap-2">
            <select
              value={activeBookId ?? ""}
              onChange={(e) => setActiveBook(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-bg-raised px-2 py-1.5 text-sm outline-none focus:border-accent"
            >
              {bookList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({Object.keys(b.spells).length})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleNew}
              className="shrink-0 rounded-md border border-border px-2 py-1.5 text-sm text-fg-muted hover:text-fg"
              title="New spell book"
            >
              + New
            </button>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleRename}
              className="flex-1 rounded-md border border-border px-2 py-1 text-xs text-fg-muted hover:text-fg"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 rounded-md border border-border px-2 py-1 text-xs text-red-400 hover:bg-red-950/30"
            >
              Delete
            </button>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={openExport}
              disabled={bookList.length === 0}
              className="flex-1 rounded-md border border-border px-2 py-1 text-xs text-fg-muted hover:text-fg disabled:cursor-not-allowed disabled:text-fg-faint"
              title="Copy all spell books as a compact code"
            >
              Export code
            </button>
            <button
              type="button"
              onClick={() => {
                setShowExport(false);
                setExportCode("");
                setExportError(null);
                setImportError(null);
                setShowImport((s) => !s);
              }}
              className="flex-1 rounded-md border border-border px-2 py-1 text-xs text-fg-muted hover:text-fg"
              title="Import spell books from a compact code (merges)"
            >
              Import code
            </button>
          </div>

          {showExport && (
            <div className="mt-2">
              <textarea
                readOnly
                value={exportCode}
                placeholder={exportError ?? "Generating code…"}
                rows={3}
                className="min-w-0 w-full resize-none rounded-md border border-border bg-bg-raised px-2 py-1 font-mono text-[11px] text-fg-muted outline-none focus:border-accent"
              />
              {exportError && (
                <p className="mt-1 text-xs text-red-400">{exportError}</p>
              )}
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={copyExport}
                  disabled={!exportCode}
                  className="flex-1 rounded-md border border-border px-2 py-1 text-xs text-accent hover:bg-accent-subtle disabled:text-fg-faint"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExport(false);
                    setExportCode("");
                  }}
                  className="flex-1 rounded-md border border-border px-2 py-1 text-xs text-fg-muted hover:text-fg"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {showImport && (
            <div className="mt-2">
              <textarea
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder="Paste an SB1:… spell book code here"
                rows={3}
                className="min-w-0 w-full resize-none rounded-md border border-border bg-bg-raised px-2 py-1 font-mono text-[11px] text-fg outline-none placeholder:text-fg-faint focus:border-accent"
              />
              {importError && (
                <p className="mt-1 text-xs text-red-400">{importError}</p>
              )}
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={doImport}
                  disabled={!importCode.trim()}
                  className="flex-1 rounded-md border border-border px-2 py-1 text-xs text-accent hover:bg-accent-subtle disabled:text-fg-faint"
                >
                  Import
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImport(false);
                    setImportCode("");
                    setImportError(null);
                  }}
                  className="flex-1 rounded-md border border-border px-2 py-1 text-xs text-fg-muted hover:text-fg"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          <input
            type="search"
            placeholder={`Search ${activeBook ? Object.keys(activeBook.spells).length : 0} spells…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-2 min-w-0 w-full rounded-md border border-border bg-bg-raised px-3 py-1.5 text-sm outline-none placeholder:text-fg-faint focus:border-accent"
          />
        </div>

        {/* Column header */}
        <div className="flex items-center gap-3 border-b border-border bg-bg-raised px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
          <span className="w-6 shrink-0 text-center" title="Memorized">
            Mem
          </span>
          <span className="w-6 shrink-0 text-center" title="Spell level (C = cantrip)">
            Lvl
          </span>
          <span className="flex-1">Name</span>
          <span className="w-14 shrink-0 text-right" title="School of magic">
            School
          </span>
          <span className="w-12 shrink-0 text-right" title="Casting time">
            Cast
          </span>
          <span className="w-6 shrink-0 text-center" title="Remove from book" />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {visible.map((spell) => {
            const key = refKey(makeRef(spell.name, spell.source));
            const active = key === selectedKey;
            const memorized = activeBook ? Boolean(activeBook.spells[key]) : false;
            return (
              <div
                key={key}
                className={`flex items-center gap-3 border-b border-border-subtle px-3 py-1.5 text-sm transition-colors ${
                  active ? "bg-accent-subtle" : "hover:bg-bg-raised"
                }`}
              >
                <input
                  type="checkbox"
                  checked={memorized}
                  onChange={() => activeBookId && toggleMemorized(activeBookId, key)}
                  title={memorized ? "Memorized" : "Not memorized"}
                  aria-label={memorized ? "Mark as not memorized" : "Mark as memorized"}
                  className="h-4 w-4 shrink-0 accent-[var(--color-accent,#7c5cff)]"
                />
                <button
                  type="button"
                  onClick={() => selectSpell(key)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    className={`w-6 shrink-0 text-center text-xs font-semibold ${
                      spell.level === 0 ? "text-fg-muted" : "text-accent"
                    }`}
                  >
                    {spell.level === 0 ? "C" : spell.level}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{spell.name}</span>
                  <span className="w-14 shrink-0 text-right text-xs text-fg-muted">
                    {spSchoolToAbv(spell.school)}
                  </span>
                  <span className="w-12 shrink-0 text-right text-xs text-fg-muted">
                    {spell.time[0] ? spTimeToShort(spell.time[0]) : ""}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeBookId) removeFromBook(activeBookId, key);
                  }}
                  title="Remove from spell book"
                  aria-label="Remove from spell book"
                  className="w-6 shrink-0 text-center text-fg-faint hover:text-red-400"
                >
                  ×
                </button>
              </div>
            );
          })}
          {visible.length === 0 && (
            <div className="p-4 text-center text-sm text-fg-muted">
              {bookSpells.length === 0
                ? "This spell book is empty. Add spells from the Spells page."
                : "No spells match."}
            </div>
          )}
        </div>
        <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
          {bookSpells.length} spells · {memorizedCount} memorized
        </div>
      </aside>

      {/* DETAIL PANE */}
      <section
        className={`${
          isMobileDetail ? "flex" : "hidden md:flex"
        } absolute inset-0 top-0 z-10 flex-1 flex-col overflow-hidden bg-bg md:static md:z-auto`}
      >
        {/* Mobile back bar */}
        <div className="flex items-center border-b border-border bg-bg-subtle px-2 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileDetail(false)}
            className="flex items-center gap-1 rounded-md px-3 py-1 text-sm text-accent hover:bg-bg-raised"
          >
            <span aria-hidden>←</span> Spell Book
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <SpellStatBlock spell={selected} />
          ) : (
            <Centered>
              <div className="text-center">
                <p className="text-fg-muted">Select a spell to view details.</p>
                <p className="mt-1 text-xs text-fg-faint">
                  {bookSpells.length} spells in this book
                </p>
              </div>
            </Centered>
          )}
        </div>
      </section>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-fg-muted">{children}</div>
  );
}
