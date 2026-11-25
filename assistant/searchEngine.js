/**
 * searchEngine.js - ranks the website's ACTUAL records for a query
 * ---------------------------------------------------------------------------
 * It never stores content itself. Records come from contentSources.js, which
 * reads the site's existing data (event registry, studentzone.json, page
 * content). The engine only filters, scores and sorts them.
 */
import { scoreRecord, MIN_SCORE, mentions } from './relevanceScoring.js';

/** Give every dated record a 0..1 recency value (newest = 1) so "latest" can be honoured. */
export function applyRecency(records) {
    const dated = records.filter((r) => r.date instanceof Date && !isNaN(r.date));
    if (!dated.length) return records;
    const times = dated.map((r) => r.date.getTime());
    const min = Math.min(...times);
    const span = Math.max(...times) - min || 1;
    dated.forEach((r) => { r._recency = (r.date.getTime() - min) / span; });
    return records;
}

/**
 * @param {object[]} records
 * @param {object}   q          processed query
 * @param {object}   [o]
 * @param {(r:object)=>boolean} [o.filter]   hard filter applied before scoring
 * @param {number}   [o.minScore]
 * @param {string}   [o.categoryKey]
 * @param {boolean}  [o.keepAll]   keep unscored records (category browsing); ordered by date/recency
 * @returns {{rec:object, score:number, literal:boolean, conceptHits:number}[]}
 */
export function rank(records, q, o = {}) {
    const minScore = o.minScore == null ? MIN_SCORE : o.minScore;
    let pool = o.filter ? records.filter(o.filter) : records;
    applyRecency(pool);
    const scored = pool.map((rec) => ({ rec, ...scoreRecord(rec, q, { categoryKey: o.categoryKey }) }));
    let hits = o.keepAll ? scored : scored.filter((s) => s.score >= minScore);
    hits.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const da = a.rec.date ? a.rec.date.getTime() : 0;
        const db = b.rec.date ? b.rec.date.getTime() : 0;
        return db - da;
    });
    return hits;
}

/** Newest first. Records without dates keep their order at the end. */
export function byNewest(hits) {
    return hits.slice().sort((a, b) => {
        const da = a.rec.date ? a.rec.date.getTime() : -Infinity;
        const db = b.rec.date ? b.rec.date.getTime() : -Infinity;
        return db - da;
    });
}

/**
 * Honesty check for narrow topics: does ANY of these records literally mention the term?
 * (Used to say "I couldn't find anything about hackathons" instead of faking a match.)
 */
export function anyMentions(records, term) {
    return records.some((r) => mentions(r, term));
}
