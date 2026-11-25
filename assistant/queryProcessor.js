/**
 * queryProcessor.js - turns raw visitor text into a structured query
 * ---------------------------------------------------------------------------
 *   1. normalise   (lower-case, strip accents / punctuation, keep c++ and 2.0)
 *   2. tokenise + stem
 *   3. drop stop-words -> important keywords
 *   4. recognise concepts / synonyms (synonyms.js)
 *   5. extract entities: semester, year, MST/EndSem, unit, subject
 */
import { STOPWORDS, GENERIC_CONCEPTS, GENERIC_WORDS, stem, detectConcepts, tokenConcepts } from './synonyms.js';

const ORDINALS = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8 };

/** lower-case, remove accents/punctuation but keep things like c++, 2.0, c#. */
export function normalize(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFKD').replace(/[̀-ͯ]/g, '')
        .replace(/[’'`]/g, '')                       // teacher's -> teachers
        .replace(/[^a-z0-9ऀ-ॿ+#.&\s-]/g, ' ')   // drop other punctuation (keep Devanagari)
        .replace(/(\d)\.(\d)/g, '$1\u00a7$2')               // protect dots inside numbers (2.0)
        .replace(/\./g, ' ')
        .replace(/\u00a7/g, '.')
        .replace(/&/g, ' and ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractSemester(norm, allowBareNumber) {
    let m = norm.match(/\b(?:sems?|semesters?)\s*(?:no\s*)?([1-8])\b/);
    if (m) return +m[1];
    m = norm.match(/\b([1-8])\s*(?:st|nd|rd|th)?\s*(?:sems?|semesters?)\b/);
    if (m) return +m[1];
    m = norm.match(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth)\s*(?:sems?|semesters?)\b/);
    if (m) return ORDINALS[m[1]];
    if (allowBareNumber) {
        m = norm.match(/^(?:in\s+)?([1-8])\s*(?:st|nd|rd|th)?$/);
        if (m) return +m[1];
        m = norm.match(/^(first|second|third|fourth|fifth|sixth|seventh|eighth)$/);
        if (m) return ORDINALS[m[1]];
    }
    return null;
}

function extractPaperKinds(norm) {
    const kinds = new Set();
    if (/\bmst\s*(?:-|\s)?\s*(?:1|i|one)\b/.test(norm) || /\bmid\s*sem\w*\s*(?:1|i|one)\b/.test(norm)) kinds.add('MST-I');
    if (/\bmst\s*(?:-|\s)?\s*(?:2|ii|two)\b/.test(norm) || /\bmid\s*sem\w*\s*(?:2|ii|two)\b/.test(norm)) kinds.add('MST-II');
    if (!kinds.size && /\b(mst|mid\s*sem\w*|mid\s*term)\b/.test(norm)) { kinds.add('MST-I'); kinds.add('MST-II'); }
    if (/\b(end\s*sem\w*|end\s*term|final\s*(exam|paper))\b/.test(norm)) kinds.add('EndSem');
    return Array.from(kinds);
}

/** subject shorthand -> words that appear in the real subject names */
const SUBJECT_ALIASES = {
    maths: ['mathematic'], math: ['mathematic'], mathematics: ['mathematic'], chem: ['chemistry'], phy: ['physic'],
    comm: ['communication'], english: ['communication'], elec: ['electrical', 'electronic'], bee: ['basic', 'electrical'],
    cpp: ['c++'], 'c plus plus': ['c++'], genai: ['generative', 'ai'], 'gen ai': ['generative', 'ai'], dl: ['deep', 'learning'],
    'data structures': ['data', 'structure'], 'data structure': ['data', 'structure'], oops: ['c++'], networks: ['computer', 'network'],
    networking: ['computer', 'network'], compiler: ['compiler'], 'soft computing': ['soft', 'computing'],
};

/**
 * Build a lookup from the REAL subject names in studentzone.json.
 * Nothing is hard-coded: if a subject is added to the JSON it is searchable.
 */
export function buildSubjectIndex(subjectsBySemester) {
    const map = new Map(); // subject -> { name, semesters:Set, words:Set, abbr:string|null }
    Object.entries(subjectsBySemester || {}).forEach(([sem, list]) => {
        (list || []).forEach((name) => {
            if (!map.has(name)) {
                const abbrMatch = name.match(/\(([A-Za-z]{2,5})\)\s*$/);
                const base = name.replace(/\([^)]*\)/g, ' ');
                const words = new Set(normalize(base).replace(/-/g, ' ').split(' ')
                    .filter((w) => w && !['and', 'of', 'in', 'i', 'ii', 'iii'].includes(w)).map(stem));
                map.set(name, { name, semesters: new Set(), words, abbr: abbrMatch ? abbrMatch[1].toLowerCase() : (name.length <= 5 ? name.toLowerCase() : null) });
            }
            map.get(name).semesters.add(Number(sem));
        });
    });
    return Array.from(map.values());
}

function matchSubjects(norm, tokens, subjectIndex) {
    if (!subjectIndex || !subjectIndex.length) return [];
    const bag = new Set(tokens);
    // expand aliases
    Object.entries(SUBJECT_ALIASES).forEach(([alias, words]) => {
        if ((' ' + norm + ' ').includes(' ' + alias + ' ')) words.forEach((w) => bag.add(stem(w)));
    });
    const hits = [];
    subjectIndex.forEach((s) => {
        let score = 0;
        if (s.abbr && bag.has(s.abbr)) score += 3;
        let matched = 0;
        s.words.forEach((w) => { if (bag.has(w)) matched++; });
        if (matched && s.words.size) {
            const frac = matched / s.words.size;
            if (frac >= 0.6 || (matched >= 1 && s.words.size === 1)) score += 2 * frac + matched * 0.5;
        }
        if (score >= 1.5) hits.push({ subject: s, score });
    });
    if (!hits.length) return [];
    const best = Math.max(...hits.map((h) => h.score));
    return hits.filter((h) => h.score >= best - 0.9).map((h) => h.subject.name);
}

/**
 * @param {string} raw
 * @param {{subjectIndex?: Array, expectSemester?: boolean}} [opts]
 */
export function processQuery(raw, opts = {}) {
    const norm = normalize(raw);
    const hyphenless = norm.replace(/-/g, ' ');
    const allTokens = hyphenless.split(' ').filter(Boolean).map(stem);
    const { concepts, specific } = detectConcepts(allTokens);
    const tokens = allTokens.filter((t) => !STOPWORDS.has(t) && t.length > 1);

    const entities = {
        semester: extractSemester(hyphenless, !!opts.expectSemester),
        year: (hyphenless.match(/\b(20[12]\d)\b/) || [])[1] ? Number(hyphenless.match(/\b(20[12]\d)\b/)[1]) : null,
        paperKinds: extractPaperKinds(hyphenless),
        unit: (hyphenless.match(/\bunit\s*([1-9])\b/) || [])[1] ? Number(hyphenless.match(/\bunit\s*([1-9])\b/)[1]) : null,
        subjects: matchSubjects(hyphenless, allTokens, opts.subjectIndex),
    };

    // Tokens that explain *what* is wanted but are not topic words
    const topicTokens = tokens.filter((t) => !/^\d+(st|nd|rd|th)?$/.test(t));
    // Words worth matching literally against content: not stop-words, not pure "kind of thing" words
    const contentTokens = topicTokens.filter((t) => {
        if (GENERIC_WORDS.has(t)) return false;
        const c = tokenConcepts(t);
        return !(c && c.size && [...c].every((x) => GENERIC_CONCEPTS.has(x)));
    });

    return {
        raw: String(raw || ''),
        norm: hyphenless,
        allTokens,
        tokens,            // important keywords (stemmed)
        topicTokens,
        contentTokens,
        phrase: topicTokens.join(' '),
        concepts,
        specific,
        entities,
        flags: {
            latest: concepts.has('latest'),
            isShort: allTokens.length <= 3,
        },
    };
}

/** True when the query contains nothing but entity-like words ("sem 3", "3rd", "2024"). */
export function isEntityOnly(q) {
    const strong = [...q.concepts.keys()].some((c) => !['latest', 'yes', 'more', 'mst', 'endsem'].includes(c));
    const e = q.entities;
    const hasEntity = e.semester || e.year || e.paperKinds.length || e.unit || e.subjects.length;
    return !strong && !!hasEntity;
}
