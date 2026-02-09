import { describe, it, expect } from "vitest";
import { mapToCanonicalGenres, getPrimaryGenre } from "./genreNormalizer";

describe("mapToCanonicalGenres", () => {
  it("splits 'Juvenile Fiction' into ficción + juvenil", () => {
    expect(mapToCanonicalGenres(["Juvenile Fiction"])).toEqual(["ficción", "juvenil"]);
  });

  it("filters stoplist and maps The Yellow Wallpaper genres", () => {
    const raw = [
      "Fiction",
      "Literature - Classics / Criticism",
      "Modern fiction",
      "Short Stories (single author)",
      "Classics",
    ];
    // "Fiction" → ficción
    // "Literature - Classics / Criticism" → contains "criticism" → discard
    // "Modern fiction" → ficción (dedup)
    // "Short Stories (single author)" → contains "short stories" → discard
    // "Classics" → contains "classics" → discard
    expect(mapToCanonicalGenres(raw)).toEqual(["ficción"]);
  });

  it("removes language prefixes", () => {
    expect(mapToCanonicalGenres(["Spanish: Ficción", "English: Fantasy"])).toEqual([
      "ficción",
      "fantasía",
    ]);
  });

  it("deduplicates after mapping", () => {
    expect(mapToCanonicalGenres(["Fantasy", "fantasy", "FANTASY"])).toEqual(["fantasía"]);
  });

  it("discards unrecognized genres entirely", () => {
    expect(mapToCanonicalGenres(["General", "Books", "Families"])).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(mapToCanonicalGenres([])).toEqual([]);
  });

  it("handles null-like input", () => {
    expect(mapToCanonicalGenres(undefined as unknown as string[])).toEqual([]);
  });

  it("maps mystery and thriller variants to single genre", () => {
    expect(mapToCanonicalGenres(["Mystery", "Thriller", "Suspense"])).toEqual([
      "misterio y thriller",
    ]);
  });

  it("maps juvenile nonfiction to juvenil + no ficción", () => {
    expect(mapToCanonicalGenres(["Juvenile Nonfiction"])).toEqual(["juvenil", "no ficción"]);
  });

  it("maps comics and manga to cómic y novela gráfica", () => {
    expect(mapToCanonicalGenres(["Comics & Graphic Novels", "Manga"])).toEqual([
      "cómic y novela gráfica",
    ]);
  });
});

describe("getPrimaryGenre", () => {
  it("returns first canonical genre", () => {
    expect(getPrimaryGenre(["Juvenile Fiction", "Fantasy"])).toBe("ficción");
  });

  it("returns null when no genres match", () => {
    expect(getPrimaryGenre(["General", "Books"])).toBeNull();
  });

  it("returns null for null input", () => {
    expect(getPrimaryGenre(null)).toBeNull();
  });

  it("skips stoplist and returns next valid genre", () => {
    expect(getPrimaryGenre(["Literature - Classics / Criticism", "Romance"])).toBe("romance");
  });
});
