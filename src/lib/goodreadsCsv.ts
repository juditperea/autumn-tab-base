// Parsing and column detection for Goodreads CSV exports.
// The edge function receives the rows parsed here, so all CSV
// handling lives in one tested module.

export interface GoodreadsRow {
  title: string;
  author: string;
  isbn: string | null;
  isbn13: string | null;
  myRating: number; // raw Goodreads rating 0-5 (0 = unrated)
  dateRead: string | null; // ISO YYYY-MM-DD
  dateAdded: string | null; // ISO YYYY-MM-DD
  shelf: string;
  pages: number | null;
}

export interface ParsedGoodreadsCsv {
  rows: GoodreadsRow[];
  invalidRows: number; // rows skipped because they have no title
  hasTitleColumn: boolean; // false => not a Goodreads export
}

// Known Goodreads export columns, matched case-insensitively
const COLUMN_ALIASES: Record<keyof typeof RAW_COLUMNS, string[]> = {
  title: ["title"],
  author: ["author", "author l-f"],
  isbn: ["isbn"],
  isbn13: ["isbn13"],
  myRating: ["my rating"],
  dateRead: ["date read"],
  dateAdded: ["date added"],
  exclusiveShelf: ["exclusive shelf", "bookshelves"],
  pages: ["number of pages"],
};

const RAW_COLUMNS = {
  title: "",
  author: "",
  isbn: "",
  isbn13: "",
  myRating: "",
  dateRead: "",
  dateAdded: "",
  exclusiveShelf: "",
  pages: "",
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function cleanISBN(isbn: string | undefined): string | null {
  if (!isbn) return null;
  // Goodreads wraps ISBNs as ="978..."
  const cleaned = isbn.replace(/[="']/g, "").trim();
  return cleaned || null;
}

export function parseGoodreadsDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function findColumn(headers: string[], aliases: string[]): number {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

export function parseGoodreadsCsv(content: string): ParsedGoodreadsCsv {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const empty: ParsedGoodreadsCsv = { rows: [], invalidRows: 0, hasTitleColumn: false };
  if (lines.length < 2) return empty;

  const headers = parseCSVLine(lines[0]);
  const col: Record<string, number> = {};
  for (const key of Object.keys(COLUMN_ALIASES)) {
    col[key] = findColumn(headers, COLUMN_ALIASES[key as keyof typeof COLUMN_ALIASES]);
  }

  if (col.title === -1) return empty;

  const rows: GoodreadsRow[] = [];
  let invalidRows = 0;

  const get = (values: string[], idx: number): string =>
    idx === -1 ? "" : (values[idx] ?? "").trim();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const title = get(values, col.title);
    if (!title) {
      invalidRows++;
      continue;
    }

    const ratingRaw = parseInt(get(values, col.myRating) || "0", 10);
    const pagesRaw = parseInt(get(values, col.pages) || "", 10);

    rows.push({
      title,
      author: get(values, col.author),
      isbn: cleanISBN(get(values, col.isbn)),
      isbn13: cleanISBN(get(values, col.isbn13)),
      myRating: Number.isNaN(ratingRaw) ? 0 : Math.min(5, Math.max(0, ratingRaw)),
      dateRead: parseGoodreadsDate(get(values, col.dateRead)),
      dateAdded: parseGoodreadsDate(get(values, col.dateAdded)),
      shelf: get(values, col.exclusiveShelf) || "to-read",
      pages: Number.isNaN(pagesRaw) ? null : pagesRaw,
    });
  }

  return { rows, invalidRows, hasTitleColumn: true };
}
