import { describe, expect, it } from "vitest";
import { CODEC_PREFIX, decodeBooks, encodeBooks } from "@/state/spellBookCodec";
import type { SpellBook } from "@/state/spellBook";

/**
 * Round-trip + error-path tests for the spell-book codec.
 *
 * Pipeline: SpellBook[] -> JSON -> gzip -> base64url -> `SB1:` prefix.
 * Node 24 provides CompressionStream/DecompressionStream/Blob/btoa/atob
 * natively, so no polyfill is required.
 */

const BOOKS: SpellBook[] = [
  {
    id: "b1",
    name: "Arcane",
    createdAt: "2024-01-01T00:00:00.000Z",
    spells: { "Fireball|XPHB": true, "Shield|XPHB": false },
  },
  {
    id: "b2",
    name: "Divine",
    createdAt: "2024-01-02T00:00:00.000Z",
    spells: {},
  },
];

describe("encodeBooks / decodeBooks round-trip", () => {
  it("encodeBooks produces a string with the SB1: prefix", async () => {
    const code = await encodeBooks(BOOKS);
    expect(typeof code).toBe("string");
    expect(code.startsWith(CODEC_PREFIX)).toBe(true);
  });

  it("decodeBooks(encodeBooks(x)) recovers the original books", async () => {
    const code = await encodeBooks(BOOKS);
    const decoded = (await decodeBooks(code)) as SpellBook[];
    expect(decoded).toEqual(BOOKS);
  });

  it("round-trips an empty array", async () => {
    const code = await encodeBooks([]);
    expect(await decodeBooks(code)).toEqual([]);
  });

  it("round-trips unicode names and special characters in keys", async () => {
    const weird: SpellBook[] = [
      {
        id: "u1",
        name: "São João's \"Book\" — ☀",
        createdAt: "2024-06-30T12:00:00.000Z",
        spells: { "Haste|XPHB": true, "Cure Wounds|XPHB": false },
      },
    ];
    const code = await encodeBooks(weird);
    expect((await decodeBooks(code)) as SpellBook[]).toEqual(weird);
  });
});

describe("decodeBooks error paths", () => {
  it("throws on a missing SB1: prefix", async () => {
    await expect(decodeBooks("not-a-spellbook-code")).rejects.toThrow(/SB1:/);
    await expect(decodeBooks("SB0:abc")).rejects.toThrow(/SB1:/);
  });

  it("throws on a corrupt payload under the prefix", async () => {
    // Valid prefix, invalid base64url -> atob / gunzip path will throw.
    await expect(decodeBooks(`${CODEC_PREFIX}!!!notvalid!!!`)).rejects.toThrow();
  });

  it("throws when the decoded bytes are not valid gzip", async () => {
    // base64url of "garbage" plaintext bytes -> not a gzip stream.
    const bytes = new TextEncoder().encode("garbage");
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
    const b64url = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    await expect(decodeBooks(`${CODEC_PREFIX}${b64url}`)).rejects.toThrow();
  });

  it("trims surrounding whitespace before validating the prefix", async () => {
    const code = await encodeBooks(BOOKS);
    const padded = `  \n${code}\n  `;
    await expect(decodeBooks(padded)).resolves.toEqual(BOOKS);
  });
});

describe("base64url safety", () => {
  it("the encoded string contains no URL-unsafe characters", async () => {
    const code = await encodeBooks(BOOKS);
    const payload = code.slice(CODEC_PREFIX.length);
    // base64url alphabet only: A-Z a-z 0-9 - _ (no +, /, or = padding).
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(payload).not.toContain("+");
    expect(payload).not.toContain("/");
    expect(payload).not.toContain("=");
  });
});
