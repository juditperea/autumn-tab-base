import { describe, it, expect } from "vitest";
import { normalizeGenres, getPrimaryGenre } from "./genreNormalizer";

describe("normalizeGenres", () => {
  it("Harry Potter: ['Juvenile Fiction'] => ['ficción juvenil']", () => {
    expect(normalizeGenres(["Juvenile Fiction"])).toEqual(["ficción juvenil"]);
  });

  it("filters stoplist and collapses synonyms for The Yellow Wallpaper", () => {
    const raw = [
      "Fiction",
      "Literature - Classics / Criticism",
      "Modern fiction",
      "Short Stories (single author)",
      "Classics",
    ];
    const result = normalizeGenres(raw);
    // "Fiction" → stoplist (exact "fiction")
    // "Literature - Classics / Criticism" → contains "criticism" → stoplist
    // "Modern fiction" → synonym → "ficción"
    // "Short Stories (single author)" → synonym → "relatos"
    // "Classics" → synonym → "clásicos"
    expect(result).toEqual(["ficción", "relatos", "clásicos"]);
  });

  it("removes language prefixes", () => {
    expect(normalizeGenres(["Spanish: Ficción", "English: Fantasy"])).toEqual([
      "ficción",
      "fantasía",
    ]);
  });

  it("deduplicates after normalization", () => {
    expect(normalizeGenres(["Fantasy", "fantasy", "FANTASY"])).toEqual([
      "fantasía",
    ]);
  });

  it("removes stoplist items", () => {
    const result = normalizeGenres(["General", "Books", "Fiction", "Romance"]);
    expect(result).toEqual(["romance"]);
  });

  it("returns empty array for empty input", () => {
    expect(normalizeGenres([])).toEqual([]);
  });

  it("handles null-like input", () => {
    expect(normalizeGenres(undefined as unknown as string[])).toEqual([]);
  });
});

describe("getPrimaryGenre", () => {
  it("returns first normalized genre", () => {
    expect(getPrimaryGenre(["Juvenile Fiction", "Fantasy"])).toBe(
      "ficción juvenil"
    );
  });

  it("returns 'Otros' when all genres are filtered out", () => {
    expect(getPrimaryGenre(["General", "Fiction", "Books"])).toBe("Otros");
  });

  it("returns 'Otros' for null input", () => {
    expect(getPrimaryGenre(null)).toBe("Otros");
  });

  it("skips stoplist and returns next valid genre", () => {
    expect(getPrimaryGenre(["Fiction", "Romance"])).toBe("romance");
  });
});
