/**
 * assistantEngine.js - question in, structured reply out (no DOM, no network of its own).
 *
 * reply = { text, items:[{title, meta, snippet, actions:[{label,target}]}],
 *           actions:[{label,target}], chips:[{label,query}] }
 *
 * Pipeline: processQuery -> detectIntent (+ follow-up context) -> handler -> search real records.
 * It never invents records: every item comes from contentSources.
 */
import { processQuery, isEntityOnly } from './queryProcessor.js';
import { detectIntent } from './intentRules.js';
import { rank, byNewest, anyMentions } from './searchEngine.js';
import { prepare } from './relevanceScoring.js';
import { tokenConcepts } from './synonyms.js';
import { PAGES, FACETS, LIMITS, SUGGESTIONS } from './assistantData.js';

const EVENT_CATEGORY = { technical_events: 'technical', cultural_events: 'cultural', sports_events: 'sports', academic_events: 'academic', events_general: null };
const CATEGORY_LABEL = { technical: 'technical', cultural: 'cultural', sports: 'sports', academic: 'academic' };
const pageAction = (key) => ({ label: `Open ${PAGES[key].label}`, target: { type: 'page', page: PAGES[key].page, hash: PAGES[key].hash } });
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const trunc = (s, n = 150) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s || '');

export function createEngine({ sources, context }) {
    /* ---------------- shared helpers ---------------- */
    const limitFor = (state) => (state.showAll ? LIMITS.all : LIMITS.default);

    function noResult(q, extra) {
        return {
            text: (extra ? extra + ' ' : '') + `I couldn't find anything about “${q.raw.trim()}” on the site, and I don't want to guess. Try one of these instead:`,
            items: [], actions: [pageAction('events'), pageAction('studentzone'), pageAction('contact')],
            chips: SUGGESTIONS.slice(0, 4).map((s) => ({ label: s, query: s })),
        };
    }

    function eventItem(r) {
        return { title: r.title, meta: r.subtitle, snippet: trunc(r.snippet), actions: [{ label: 'View Event', target: r.target }] };
    }

    /* ---------------- events ---------------- */
    async function handleEvents(intentId, q, state) {
        const { events } = await sources.load();
        const cat = EVENT_CATEGORY[intentId];
        let pool = cat ? events.filter((e) => e.categoryKey === cat) : events;
        const catName = cat ? CATEGORY_LABEL[cat] + ' ' : '';
        if (!events.length) return noResult(q, 'No events are listed right now.');

        // 1. narrow topics ("hackathon", "dance", "cricket") must literally exist, otherwise say so
        const missing = (q.specific || []).filter((t) => !anyMentions(events, t));
        if (missing.length) {
            const rel = pool.slice(0, limitFor(state));
            return {
                text: `I couldn't find anything about “${missing.join(', ')}” in the event details.` + (cat && rel.length ? ` The closest category is ${catName.trim()} events — here's what is listed (these are related, not exact matches):` : ' You can browse everything on the Events page.'),
                items: cat ? byNewest(rel.map((rec) => ({ rec }))).map((h) => eventItem(h.rec)) : [],
                actions: [pageAction('events')], chips: [{ label: 'Show all events', query: 'show all events' }],
            };
        }

        // 2. facets inside a category (workshops / coding competitions)
        let note = '';
        const facetConcepts = ['workshop'].filter((c) => q.concepts.has(c));
        if (q.concepts.has('workshop')) {
            const sub = pool.filter((e) => prepare(e).concepts.has('workshop'));
            if (!sub.length) {
                note = `I couldn't find any workshops listed in Events right now. Here are the ${catName}events that are listed:`;
            } else pool = sub;
        } else if (cat === 'technical' && (q.concepts.has('coding') || q.concepts.has('competition')) && !state.showAll) {
            const sub = pool.filter((e) => { const c = prepare(e).concepts; return c.has('coding') || c.has('competition'); });
            if (sub.length) pool = sub;
        }
        void facetConcepts;

        // 3. rank / sort
        const leftover = q.contentTokens.filter((t) => !tokenConcepts(t));
        let hits = rank(pool, q, { categoryKey: cat, keepAll: leftover.length === 0, minScore: leftover.length ? 12 : 0 });
        if (!hits.length && pool.length) hits = pool.map((rec) => ({ rec }));
        if (q.flags.latest || !leftover.length) hits = byNewest(hits);
        if (q.flags.latest && !state.showAll) hits = hits.slice(0, 1);
        if (!hits.length) return noResult(q);

        const shown = hits.slice(0, limitFor(state));
        const text = note || (q.flags.latest
            ? `Here's the most recent ${catName}event listed${shown[0].rec.date ? ' (' + shown[0].rec.subtitle.split(' · ')[0] + ')' : ''}:`
            : `I found ${plural(hits.length, catName + 'event')}${hits.length > shown.length ? ` — showing the ${shown.length} most recent` : ''}:`);
        const reply = { text, items: shown.map((h) => eventItem(h.rec)), actions: [pageAction('events')], chips: [] };

        // follow-up question for broad technical queries
        const broad = !q.concepts.has('workshop') && !q.concepts.has('coding') && !q.concepts.has('competition') && !state.showAll;
        if (intentId === 'technical_events' && broad && hits.length > 1) {
            reply.followUp = 'Are you looking for coding competitions or technical workshops?';
            reply.chips = FACETS.technical_events;
            context.setPending({ type: 'facet', intentId });
        } else if (hits.length > shown.length) {
            reply.chips = [{ label: 'Show all', query: 'show all' }];
        }
        return reply;
    }

    /* ---------------- Student Zone: papers + notes ---------------- */
    function mergeEntities(q, prev) {
        const e = q.entities;
        const p = prev || {};
        return {
            semester: e.semester || p.semester || null,
            subjects: e.subjects.length ? e.subjects : (p.subjects || []),
            kinds: e.paperKinds.length ? e.paperKinds : (p.kinds || []),
            year: e.year || p.year || null,
            unit: e.unit || p.unit || null,
        };
    }

    async function handleResources(intentId, q, state, prevEntities) {
        const data = await sources.load();
        const isPapers = intentId === 'previous_papers';
        const pool0 = data.resources.filter((r) => (isPapers ? (r.categoryKey === 'mst' || r.categoryKey === 'endsem') : (r.categoryKey === 'notes' || r.categoryKey === 'study')));
        const ent = mergeEntities(q, prevEntities);
        const label = isPapers ? 'previous year papers' : 'notes and study material';
        const sz = pageAction('studentzone');
        context.setPending(null);
        context.setLast({ intentId, entities: ent });

        if (!data.resources.length) return { text: 'The Student Zone resource index could not be loaded right now. You can still browse it directly:', items: [], actions: [sz], chips: [] };

        const typeKey = !isPapers ? 'notes' : (ent.kinds.length && ent.kinds.every((k) => k === 'EndSem') ? 'endsem' : ent.kinds.length && !ent.kinds.includes('EndSem') ? 'mst' : '');
        const deepLink = (extra = {}) => ({ label: 'Open in Student Zone', target: { type: 'papers', sem: ent.semester || '', subject: ent.subjects.length === 1 ? ent.subjects[0] : '', kind: typeKey, ...extra } });

        // nothing specific yet -> ask which semester (follow-up)
        if (!ent.semester && !ent.subjects.length && !ent.year && !ent.unit) {
            const sems = Object.keys(data.subjectsBySemester).sort();
            context.setPending({ type: 'semester', intentId });
            return {
                text: `I can look up ${label} for you.`, followUp: 'Which semester or subject do you need?',
                items: [], actions: [{ label: 'Browse everything in Student Zone', target: { type: 'page', page: 'studentzone.html' } }],
                chips: sems.map((s) => ({ label: `Semester ${s}`, query: `${isPapers ? 'papers' : 'notes'} semester ${s}` })),
            };
        }

        let pool = pool0;
        if (ent.semester) pool = pool.filter((r) => r.semester === ent.semester);
        if (ent.subjects.length) pool = pool.filter((r) => ent.subjects.includes(r.subject));
        const afterSubject = pool;
        if (isPapers && ent.kinds.length) pool = pool.filter((r) => ent.kinds.includes(r.paperType));
        if (ent.year) pool = pool.filter((r) => r.year === ent.year);
        if (ent.unit) pool = pool.filter((r) => r.unit && r.unit.replace(/\D/g, '') === String(ent.unit));

        const scope = [ent.subjects.join(' / '), ent.semester ? `semester ${ent.semester}` : '', ent.kinds.join(' / '), ent.year || '', ent.unit ? `unit ${ent.unit}` : ''].filter(Boolean).join(', ');

        if (!pool.length) {
            // say what DOES exist for that subject / semester instead of nothing
            if (afterSubject.length && (ent.kinds.length || ent.year || ent.unit)) {
                const types = [...new Set(afterSubject.map((r) => r.paperType + (r.year ? ' ' + r.year : '')))];
                return {
                    text: `There is no ${scope} entry in the Student Zone index. What is available for ${ent.subjects.join(' / ') || 'semester ' + ent.semester}: ${types.slice(0, 10).join(', ')}.`,
                    items: afterSubject.slice(0, limitFor(state)).map(resItem), actions: [deepLink()], chips: [],
                };
            }
            return {
                text: `I couldn't find ${label} for ${scope || 'that'} in the Student Zone index. It may not have been uploaded yet.`, items: [],
                actions: [sz, { label: 'Suggest it on the Student Zone', target: { type: 'page', page: 'studentzone.html', hash: 'suggestions' } }],
                chips: [{ label: label === 'notes and study material' ? 'Previous year papers' : 'Notes', query: label === 'notes and study material' ? 'previous year papers' : 'notes' }],
            };
        }

        // semester only -> summary + subject chips instead of a wall of results
        if (ent.semester && !ent.subjects.length && pool.length > LIMITS.default && !state.showAll && !ent.year) {
            const subs = [...new Set(pool.map((r) => r.subject))];
            return {
                text: `Semester ${ent.semester} has ${plural(pool.length, isPapers ? 'paper' : 'note file')} across ${plural(subs.length, 'subject')}.`,
                followUp: 'Pick a subject to see the files:',
                items: [], actions: [deepLink()],
                chips: subs.slice(0, 8).map((s) => ({ label: s.replace(/\s*\(.*\)$/, ''), query: `${isPapers ? 'papers' : 'notes'} ${s} semester ${ent.semester}` })),
            };
        }

        const sorted = pool.slice().sort((a, b) => (b.year || 0) - (a.year || 0) || String(a.paperType).localeCompare(String(b.paperType)));
        const shown = sorted.slice(0, limitFor(state));
        const reply = {
            text: `I found ${plural(pool.length, isPapers ? 'paper' : 'file')}${scope ? ' for ' + scope : ''}${pool.length > shown.length ? ` — showing the ${shown.length} newest` : ''}:`,
            items: shown.map(resItem), actions: [deepLink()], chips: [],
        };
        if (pool.length > shown.length) reply.chips = [{ label: 'Show more', query: 'show more' }];
        return reply;
    }
    function resItem(r) {
        return { title: r.title, meta: r.subtitle + (r.year ? ' · ' + r.year : ''), snippet: '', actions: [{ label: 'Open file', target: r.target }] };
    }

    /* ---------------- society, contact, others ---------------- */
    async function handleSociety(q, state) {
        const { people } = await sources.load();
        if (!people.length) return { text: 'You can read about the society, its faculty panel and student council on the About page.', items: [], actions: [pageAction('about')], chips: [] };
        const hits = rank(people, q, { minScore: 12 });
        if (hits.length && q.contentTokens.some((t) => !tokenConcepts(t) || ['president', 'secretary', 'treasurer', 'head', 'coordinator', 'chairperson'].includes(t))) {
            return {
                text: `Here's what I found in the society's team listing:`,
                items: hits.slice(0, limitFor(state)).map((h) => ({ title: h.rec.title, meta: h.rec.subtitle, snippet: trunc(h.rec.snippet), actions: [{ label: 'View on About', target: h.rec.target }] })),
                actions: [pageAction('about')], chips: [],
            };
        }
        const about = people.find((p) => p.kind === 'about');
        const depts = people.filter((p) => p.kind === 'department');
        return {
            text: about ? trunc(about.snippet, 260) : 'Learn about our team on the About page.',
            items: depts.map((d) => ({ title: d.title, meta: d.subtitle, snippet: trunc(d.snippet), actions: [{ label: 'View team', target: d.target }] })).slice(0, 4),
            actions: [{ label: 'Open About', target: { type: 'page', page: 'about.html' } }],
            chips: [{ label: 'Who is the president?', query: 'who is the president' }, { label: 'Technical team', query: 'technical department' }],
        };
    }

    async function handleContact() {
        const { contact } = await sources.load();
        const actions = [{ label: 'Open Contact form', target: { type: 'page', page: 'contact.html' } }];
        const lines = [];
        if (contact.email) { lines.push(`Email: ${contact.email}`); actions.push({ label: 'Send email', target: { type: 'external', href: 'mailto:' + contact.email } }); }
        if (contact.instagram) actions.push({ label: 'Instagram', target: { type: 'external', href: contact.instagram } });
        if (contact.linkedin) actions.push({ label: 'LinkedIn', target: { type: 'external', href: contact.linkedin } });
        return { text: lines.length ? `You can reach the team here. ${lines.join(' ')}` : 'You can reach the team through the Contact page.', items: [], actions, chips: [] };
    }

    async function handleOpportunities() {
        const { opportunities } = await sources.load();
        if (opportunities.length) {
            return { text: `There ${opportunities.length === 1 ? 'is 1 open opportunity' : 'are ' + opportunities.length + ' open opportunities'}:`,
                items: opportunities.map((o) => ({ title: o.title, meta: o.subtitle, snippet: trunc(o.snippet), actions: [{ label: 'View', target: o.target }] })),
                actions: [pageAction('contact')], chips: [] };
        }
        return { text: 'No roles are posted right now. New opportunities will appear in the Opportunities section — you can also ask the team directly.',
            items: [], actions: [pageAction('opportunities'), pageAction('contact')], chips: [] };
    }

    async function handleAnnouncements(q, state) {
        const { announcements } = await sources.load();
        if (!announcements.length) return { text: 'Announcements are shown on the home page.', items: [], actions: [pageAction('announcements')], chips: [] };
        let list = announcements.slice();
        const hits = q.contentTokens.some((t) => !tokenConcepts(t)) ? rank(list, q, { minScore: 12 }).map((h) => h.rec) : [];
        list = hits.length ? hits : byNewest(list.map((rec) => ({ rec }))).map((h) => h.rec);
        return { text: 'Latest announcements:',
            items: list.slice(0, limitFor(state)).map((a) => ({ title: a.title, meta: a.subtitle, snippet: trunc(a.snippet), actions: [{ label: a.linkLabel || 'Open', target: a.target }] })),
            actions: [pageAction('announcements')], chips: [] };
    }

    async function handleGallery() {
        return { text: 'Our campus photos are in the Gallery — you can filter by category and open any photo full-screen.', items: [], actions: [pageAction('gallery')], chips: [] };
    }

    /* ---------------- general search (no clear intent) ---------------- */
    async function handleGeneral(q, state) {
        const d = await sources.load();
        const records = [...d.events, ...d.people, ...d.announcements, ...d.opportunities];
        let hits = rank(records, q, { minScore: 12 });
        const resHits = q.contentTokens.length ? rank(d.resources, q, { minScore: 24 }) : [];
        if (!hits.length && !resHits.length) return noResult(q);
        const items = hits.slice(0, limitFor(state)).map((h) => {
            const r = h.rec;
            const label = r.kind === 'event' ? 'View Event' : r.kind === 'announcement' ? (r.linkLabel || 'Open') : 'View';
            return { title: r.title, meta: r.subtitle, snippet: trunc(r.snippet), actions: [{ label, target: r.target }] };
        });
        resHits.slice(0, 3).forEach((h) => items.push(resItem(h.rec)));
        return { text: 'Here is what I found:', items, actions: [], chips: [] };
    }

    /* ---------------- main entry ---------------- */
    async function respond(raw) {
        const data = await sources.load();
        const pending = context.pending;
        let q = processQuery(raw, { subjectIndex: data.subjectIndex, expectSemester: !!pending && pending.type === 'semester' });
        let intent = detectIntent(q);
        const last = context.last;
        const state = { showAll: false };

        // "show all", "yes", "more" -> repeat the last request, unlimited
        const onlyMore = ![...q.concepts.keys()].some((c) => !['yes', 'more', 'latest'].includes(c)) && (q.concepts.has('yes') || q.concepts.has('more')) && !q.entities.semester;
        if (onlyMore && last) { intent = { id: last.intentId, score: 9 }; state.showAll = true; q = last.q ? processQuery(last.q, { subjectIndex: data.subjectIndex }) : q; }

        // answers to the assistant's own question
        if (pending && pending.type === 'semester' && (isEntityOnly(q) || q.entities.semester) && !(intent && intent.id !== pending.intentId && intent.score >= 4)) {
            intent = { id: pending.intentId, score: 9 };
        } else if (pending && pending.type === 'facet' && (!intent || ['events_general', 'technical_events'].includes(intent.id))) {
            intent = { id: pending.intentId, score: 9 };
        } else if (!intent && last && (isEntityOnly(q) || q.entities.semester || q.entities.subjects.length)) {
            intent = { id: last.intentId, score: 5 }; // "and for sem 4?"
        }
        if (!(pending && pending.type === 'facet' && intent && intent.id === pending.intentId)) { /* keep pending until used */ }

        const prevEntities = last && (intent && last.intentId === intent.id) ? last.entities : null;
        let reply;
        const id = intent && intent.id;
        const keepQ = { intentId: id, q: raw };

        if (id === 'greeting') reply = { text: 'Hello! What would you like to find — events, papers, notes or the team?', items: [], actions: [], chips: SUGGESTIONS.slice(0, 4).map((s) => ({ label: s, query: s })) };
        else if (id === 'thanks') reply = { text: "You're welcome! Ask me anything else about CSES.", items: [], actions: [], chips: [] };
        else if (id === 'help') reply = { text: 'I search the real content of this site. Try asking about:', items: [], actions: [], chips: SUGGESTIONS.map((s) => ({ label: s, query: s })) };
        else if (EVENT_CATEGORY[id] !== undefined) { reply = await handleEvents(id, q, state); context.setLast({ ...keepQ }); if (!reply.followUp) context.setPending(null); }
        else if (id === 'previous_papers' || id === 'study_materials') { reply = await handleResources(id, q, state, prevEntities); context.setLast({ ...context.last, q: raw }); }
        else if (id === 'society_info') { reply = await handleSociety(q, state); context.setPending(null); context.setLast(keepQ); }
        else if (id === 'contact') { reply = await handleContact(); context.setPending(null); context.setLast(keepQ); }
        else if (id === 'opportunities') { reply = await handleOpportunities(); context.setPending(null); context.setLast(keepQ); }
        else if (id === 'announcements') { reply = await handleAnnouncements(q, state); context.setPending(null); context.setLast(keepQ); }
        else if (id === 'gallery') { reply = await handleGallery(); context.setPending(null); context.setLast(keepQ); }
        else { reply = await handleGeneral(q, state); context.setPending(null); }
        return reply;
    }

    return { respond };
}
