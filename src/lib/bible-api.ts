export const BOLLS_BOOK_MAP: Record<string, number> = {
    "Genesis": 1, "Exodus": 2, "Leviticus": 3, "Numbers": 4, "Deuteronomy": 5,
    "Joshua": 6, "Judges": 7, "Ruth": 8, "1 Samuel": 9, "2 Samuel": 10,
    "1 Kings": 11, "2 Kings": 12, "1 Chronicles": 13, "2 Chronicles": 14,
    "Ezra": 15, "Nehemiah": 16, "Esther": 17, "Job": 18, "Psalm": 19, "Proverbs": 20,
    "Ecclesiastes": 21, "Song of Solomon": 22, "Isaiah": 23, "Jeremiah": 24, "Lamentations": 25,
    "Ezekiel": 26, "Daniel": 27, "Hosea": 28, "Joel": 29, "Amos": 30, "Obadiah": 31,
    "Jonah": 32, "Micah": 33, "Nahum": 34, "Habakkuk": 35, "Zephaniah": 36, "Haggai": 37,
    "Zechariah": 38, "Malachi": 39, "Matthew": 40, "Mark": 41, "Luke": 42, "John": 43,
    "Acts": 44, "Romans": 45, "1 Corinthians": 46, "2 Corinthians": 47, "Galatians": 48,
    "Ephesians": 49, "Philippians": 50, "Colossians": 51, "1 Thessalonians": 52,
    "2 Thessalonians": 53, "1 Timothy": 54, "2 Timothy": 55, "Titus": 56, "Philemon": 57,
    "Hebrews": 58, "James": 59, "1 Peter": 60, "2 Peter": 61, "1 John": 62, "2 John": 63,
    "3 John": 64, "Jude": 65, "Revelation": 66
};

export type BibleVerse = {
    pk: number;
    verse: number;
    text: string;
    chapter?: number;
    bookName?: string;
};

export type BibleRef = {
    book: string;
    startChapter: number;
    startVerse: number;
    endChapter: number;
    endVerse?: number;
};

export class BibleApi {
    private static BASE_URL = "https://bolls.life";

    static async getPassage(translation: string, ref: BibleRef): Promise<BibleVerse[]> {
        const bookId = BOLLS_BOOK_MAP[ref.book];
        if (!bookId) throw new Error(`Invalid book name: ${ref.book}`);

        if (ref.startChapter === ref.endChapter) {
            const res = await fetch(`${this.BASE_URL}/get-chapter/${translation}/${bookId}/${ref.startChapter}/`);
            const data = await res.json() as BibleVerse[];
            let filtered = data;
            const endV = ref.endVerse;
            if (endV) {
                filtered = data.filter(v => v.verse >= ref.startVerse && v.verse <= endV);
            } else {
                filtered = data.filter(v => v.verse === ref.startVerse);
            }
            return filtered.map(v => ({ ...v, chapter: ref.startChapter, bookName: ref.book }));
        }

        // Multiple chapters
        const allVerses: BibleVerse[] = [];
        for (let c = ref.startChapter; c <= ref.endChapter; c++) {
            const res = await fetch(`${this.BASE_URL}/get-chapter/${translation}/${bookId}/${c}/`);
            let data = await res.json() as BibleVerse[];

            const endV = ref.endVerse;
            if (c === ref.startChapter) {
                data = data.filter(v => v.verse >= ref.startVerse);
            } else if (c === ref.endChapter && endV) {
                data = data.filter(v => v.verse <= endV);
            }

            allVerses.push(...data.map(v => ({ ...v, chapter: c, bookName: ref.book })));
        }
        return allVerses;
    }

    static parseReferences(refsStr: string): BibleRef[] {
        const parts = refsStr.split(/,\s*/);
        const results: BibleRef[] = [];

        for (const part of parts) {
            const complexMatch = part.match(/^(.+?)\s+(\d+):(\d+)[–-](\d+):(\d+)$/);
            if (complexMatch) {
                results.push({
                    book: complexMatch[1],
                    startChapter: parseInt(complexMatch[2]),
                    startVerse: parseInt(complexMatch[3]),
                    endChapter: parseInt(complexMatch[4]),
                    endVerse: parseInt(complexMatch[5])
                });
                continue;
            }

            const simpleMatch = part.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
            if (simpleMatch) {
                results.push({
                    book: simpleMatch[1],
                    startChapter: parseInt(simpleMatch[2]),
                    startVerse: parseInt(simpleMatch[3]),
                    endChapter: parseInt(simpleMatch[2]),
                    endVerse: simpleMatch[4] ? parseInt(simpleMatch[4]) : undefined
                });
            }
        }
        return results;
    }
}
