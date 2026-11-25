/**
 * relevanceScoring.js - basic relevance ranking for website content
 * ---------------------------------------------------------------------------
 * Priorities (highest first):
 *   exact title match  >  query words in the title  >  category / tag matches
 *   >  synonym (concept) matches  >  words in the body  (+ recency when the
 *   visitor asked for the "latest" item).
 * A record that only shares ONE common word with a multi-word query is dropped
 * instead of being shown as an unrelated result.
 */
import { GENERIC_CONCEPTS, stem, detectConcepts } from './synonyms.js';
import { normalize } from './queryProcessor.js';
import { STOPWORDS } from './synonyms.js';

export const MIN_SCORE = 12;

export function tokenize(text) {
    return normalize(text).replace(/-/g, ' ').split(' ').filter(Boolean).map(stem).filter((t) => !STOPWORDS.has(t));
}

/** Build (once) the searchable fingerprint of a record. */
export function prepare(rec) {
    if (rec._idx) return rec._idx;
    const title = tokenize(rec.title || '');
    const tags = tokenize([...(rec.tags || []), rec.category || '', rec.subtitle || ''].join(' '));
    const body = tokenize(rec.text || '');
    let concepts;
    if (rec.concepts) {
        concepts = new Set(rec.concepts);
    } else {
        const all = [...title, ...tags, ...body];
        concepts = new Set([...detectConcepts(all).concepts.entries()].filter(([, v]) => v >= 0.9).map(([k]) => k));
    }
    rec._idx = {
        titleTokens: new Set(title),
        tagTokens: new Set(tags),
        bodyTokens: new Set(body),
        titleNorm: title.join(' '),
        haystack: ' ' + [...title, ...tags, ...body].join(' ') + ' ',
        concepts,
    };
    return rec._idx;
}

/** Does the record literally mention this (stemmed) word anywhere? */
export function mentions(rec, token) {
    const idx = prepare(rec);
    if (idx.haystack.includes(' ' + token + ' ')) return true;
    if (token.length >= 5) return idx.haystack.includes(' ' + token) ; // prefix: "algo" ~ "algorithmic"
    return false;
}

function prefixMatch(set, t) {
    if (t.length < 4) return false;
    for (const w of set) {
        if (w.length >= 4 && (w.startsWith(t) || t.startsWith(w))) return true;
    }
    return false;
}

/**
 * @param {object} rec      indexed record
 * @param {object} q        processed query (queryProcessor.processQuery)
 * @param {{categoryKey?: string}} [opts]
 * @returns {{score:number, literal:boolean, conceptHits:number}}
 */
export function scoreRecord(rec, q, opts = {}) {
    const idx = prepare(rec);
    let score = 0;
    let literal = 0;
    let conceptHits = 0;

    // exact / phrase title match
    if (q.phrase && q.phrase.length >= 4) {
        if (idx.titleNorm === q.phrase) score += 100;
        else if (idx.titleNorm.includes(q.phrase)) score += 45;
    }

    for (const t of q.contentTokens) {
        if (idx.titleTokens.has(t)) { score += 18; literal++; }
        else if (prefixMatch(idx.titleTokens, t)) { score += 10; literal++; }
        else if (idx.tagTokens.has(t)) { score += 12; literal++; }
        else if (idx.bodyTokens.has(t) || prefixMatch(idx.bodyTokens, t)) { score += 5; literal++; }
    }

    // synonyms / concepts shared by the query and the record
    q.concepts.forEach((strength, c) => {
        if (GENERIC_CONCEPTS.has(c)) return;
        if (idx.concepts.has(c)) { score += 9 * Math.min(strength, 1.3); conceptHits++; }
    });

    if (opts.categoryKey && rec.categoryKey === opts.categoryKey) score += 20;

    // recency, only meaningful when asked ("latest ...")
    if (q.flags.latest && typeof rec._recency === 'number') score += 25 * rec._recency;

    if (!literal && !conceptHits) return { score: 0, literal: false, conceptHits: 0 };
    // one stray common word in a multi-word query is not a relevant match
    if (q.contentTokens.length >= 2 && literal < 2 && !conceptHits) score *= 0.4;

    return { score, literal: literal > 0, conceptHits };
}
