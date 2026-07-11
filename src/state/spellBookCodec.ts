/**
 * Compact, URL-safe codec for spell-book exports.
 *
 * Pipeline: SpellBook[] → JSON → gzip (RFC 1952) → base64url → `SB1:` prefix.
 * - `CompressionStream("gzip")` is available in all modern browsers (Chrome 80+,
 *   Firefox 113+, Safari 16.4+), so no dependency is needed.
 * - base64url (no padding) keeps the code safe to paste into URLs, chat, etc.
 * - The `SB1:` prefix identifies the format + version at a glance, so we can
 *   migrate the codec later without ambiguity.
 */

import type { SpellBook } from "@/state/spellBook";

export const CODEC_PREFIX = "SB1:";

/** Serialize books to a compact `SB1:<base64url>` code. */
export async function encodeBooks(books: SpellBook[]): Promise<string> {
  const json = JSON.stringify(books);
  const gzipped = await gzip(new TextEncoder().encode(json));
  return CODEC_PREFIX + bytesToBase64Url(gzipped);
}

/**
 * Parse a `SB1:<base64url>` code back into the raw parsed JSON (unknown shape).
 * Throws on a missing prefix or a corrupt base64/gzip stream. The caller is
 * responsible for validating the JSON shape — see `parseBooks` in the store.
 */
export async function decodeBooks(code: string): Promise<unknown> {
  const trimmed = code.trim();
  if (!trimmed.startsWith(CODEC_PREFIX)) {
    throw new Error("Not a spell book code (missing SB1: prefix).");
  }
  const b64 = trimmed.slice(CODEC_PREFIX.length);
  const gzipped = base64UrlToBytes(b64);
  const json = new TextDecoder().decode(await gunzip(gzipped));
  return JSON.parse(json);
}

// --- gzip via CompressionStream ---
// Wrap in a fresh Uint8Array so the backing buffer is a plain ArrayBuffer
// (TS 5.7+ types Uint8Array over ArrayBufferLike, which Blob rejects).

async function gzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(data)]).stream().pipeThrough(
    new CompressionStream("gzip"),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(data)]).stream().pipeThrough(
    new DecompressionStream("gzip"),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// --- base64url (no padding) via FileReader / btoa ---

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
