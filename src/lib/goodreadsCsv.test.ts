import { describe, it, expect } from "vitest";
import { parseGoodreadsCsv, cleanISBN, parseGoodreadsDate } from "./goodreadsCsv";

const HEADER =
  "Book Id,Title,Author,Author l-f,Additional Authors,ISBN,ISBN13,My Rating,Average Rating,Publisher,Binding,Number of Pages,Year Published,Original Publication Year,Date Read,Date Added,Bookshelves,Bookshelves with positions,Exclusive Shelf,My Review,Spoiler,Private Notes,Read Count,Owned Copies";

describe("parseGoodreadsCsv", () => {
  it("parses a standard Goodreads export row", () => {
    const csv = `${HEADER}\n123,Cien años de soledad,Gabriel García Márquez,"García Márquez, Gabriel",="",="9780307474728",5,4.1,Penguin,Paperback,417,2003,1967,2024/03/15,2023/01/10,,,read,,,,1,0`;
    const { rows, invalidRows, hasTitleColumn } = parseGoodreadsCsv(csv);

    expect(hasTitleColumn).toBe(true);
    expect(invalidRows).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      title: "Cien años de soledad",
      author: "Gabriel García Márquez",
      isbn: null,
      isbn13: "9780307474728",
      myRating: 5,
      dateRead: "2024-03-15",
      dateAdded: "2023-01-10",
      shelf: "read",
      pages: 417,
    });
  });

  it("handles quoted fields containing commas and escaped quotes", () => {
    const csv = `${HEADER}\n1,"Un libro, con coma","Autor ""Citas""",,,,0,,,,,,,,,to-read,,,,,`;
    const { rows } = parseGoodreadsCsv(csv);
    expect(rows[0].title).toBe("Un libro, con coma");
    expect(rows[0].author).toBe('Autor "Citas"');
  });

  it("detects missing Title column as non-Goodreads file", () => {
    const csv = "Name,Year\nSomething,2020";
    expect(parseGoodreadsCsv(csv).hasTitleColumn).toBe(false);
  });

  it("counts rows without title as invalid", () => {
    const csv = `${HEADER}\n1,,Autor,,,,0,,,,,,,,,read,,,,,\n2,Con título,Autor,,,,0,,,,,,,,,read,,,,,`;
    const { rows, invalidRows } = parseGoodreadsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(invalidRows).toBe(1);
  });

  it("falls back to Bookshelves when Exclusive Shelf is empty", () => {
    const csv = `${HEADER}\n1,Libro,Autor,,,,0,,,,,,,,favorites,,,,,`;
    const { rows } = parseGoodreadsCsv(csv);
    expect(rows[0].shelf).toBe("favorites");
  });

  it("defaults shelf to to-read when empty", () => {
    const csv = `${HEADER}\n1,Libro,Autor,,,,0,,,,,,,,,,,,,`;
    const { rows } = parseGoodreadsCsv(csv);
    expect(rows[0].shelf).toBe("to-read");
  });

  it("clamps ratings to 0-5 and treats 0 as unrated", () => {
    const csv = `${HEADER}\n1,Libro,Autor,,,,9,,,,,,,,,read,,,,,`;
    expect(parseGoodreadsCsv(csv).rows[0].myRating).toBe(5);
  });

  it("handles CRLF line endings", () => {
    const csv = `${HEADER}\r\n1,Libro,Autor,,,,0,,,,,,,,,read,,,,,`;
    expect(parseGoodreadsCsv(csv).rows).toHaveLength(1);
  });
});

describe("cleanISBN", () => {
  it("strips Goodreads =\"...\" wrapping", () => {
    expect(cleanISBN('="9780307474728"')).toBe("9780307474728");
    expect(cleanISBN("=")).toBeNull();
    expect(cleanISBN("")).toBeNull();
  });
});

describe("parseGoodreadsDate", () => {
  it("converts YYYY/MM/DD to ISO", () => {
    expect(parseGoodreadsDate("2024/3/5")).toBe("2024-03-05");
  });

  it("returns null for invalid or empty dates", () => {
    expect(parseGoodreadsDate("")).toBeNull();
    expect(parseGoodreadsDate(undefined)).toBeNull();
    expect(parseGoodreadsDate("2024")).toBeNull();
  });
});
