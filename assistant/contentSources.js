/**
 * contentSources.js - reads the site's EXISTING content into searchable records.
 * Nothing is copied or hard-coded:
 *   events      <- data/events-data.js        (window.CSES_EVENTS, same file the Events page uses)
 *   resources   <- data/studentzone.json      (same file the Student Zone uses)
 *   people/depts, announcements, opportunities <- about.html / index.html markup
 *   contact     <- footer links of the current page
 * Add an event or a paper there and the assistant finds it automatically.
 */
import { buildSubjectIndex } from './queryProcessor.js';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function parseEventDate(meta) {
    const m = String(meta || '').match(/(\d{1,2})(?:\s*[-–]\s*\d{1,2})?\s+([A-Za-z]+)\s+(\d{4})/);
    if (!m) return null;
    const mi = MONTHS.indexOf(m[2].toLowerCase());
    return mi < 0 ? null : new Date(Number(m[3]), mi, Number(m[1]));
}
const stripTags = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const clean = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

function loadScript(src) {
    return new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = src; s.onload = () => resolve(true); s.onerror = () => resolve(false);
        document.head.appendChild(s);
    });
}

export function createSources(root) {
    let cache = null;
    const pageDocs = new Map();

    async function pageDoc(file) {
        if (pageDocs.has(file)) return pageDocs.get(file);
        let doc = null;
        const here = location.pathname.split('/').pop() || 'index.html';
        if (here === file) doc = document;
        else {
            try {
                const r = await fetch(new URL(file, root).href);
                if (r.ok) doc = new DOMParser().parseFromString(await r.text(), 'text/html');
            } catch (e) { /* offline / file:// -> that part is simply not searchable */ }
        }
        pageDocs.set(file, doc);
        return doc;
    }

    function eventRecords() {
        const db = window.CSES_EVENTS || {};
        return Object.entries(db).map(([key, e]) => {
            const parts = String(e.meta || '').split('|').map((s) => s.trim());
            const typeLabel = parts[parts.length - 1] || '';
            const categoryKey = (typeLabel.match(/^(\w+)\s+event/i) || [])[1];
            return {
                kind: 'event', id: key, title: e.title, subtitle: parts.join(' · '),
                category: typeLabel, categoryKey: categoryKey ? categoryKey.toLowerCase() : null,
                date: parseEventDate(e.meta), tags: [typeLabel],
                text: [e.desc, e.team, stripTags(e.winners)].join(' '),
                snippet: e.desc, target: { type: 'event', key },
            };
        });
    }

    function resourceRecords(sz) {
        const out = [];
        const mk = (r, paperType, categoryKey) => {
            const url = r.pdf_url || r.file_url || r.link;
            const label = paperType + (r.year ? ' ' + r.year : '') + (r.unit ? ' ' + r.unit : '');
            out.push({
                kind: 'resource', categoryKey, paperType, subject: r.subject, semester: Number(r.semester),
                year: r.year ? Number(r.year) : null, unit: r.unit || null, url,
                title: r.title || `${r.subject} — ${label}`,
                subtitle: `Semester ${r.semester}`,
                text: `${r.subject} semester ${r.semester} ${paperType} ${r.year || ''} ${r.unit || ''}`,
                target: { type: 'paper', url, title: r.title || `${r.subject} ${label}` },
            });
        };
        (sz.mst_papers || []).forEach((r) => mk(r, r.type || 'MST', 'mst'));
        (sz.end_sem_papers || []).forEach((r) => mk(r, 'EndSem', 'endsem'));
        (sz.subject_notes || []).forEach((r) => mk(r, 'Notes', 'notes'));
        (sz.study_material || []).forEach((r) => mk(r, 'Study material', 'study'));
        return out;
    }

    async function aboutRecords() {
        const doc = await pageDoc('about.html');
        if (!doc) return [];
        const out = [];
        doc.querySelectorAll('.lead-card, .team-card').forEach((c) => {
            const name = clean(c.querySelector('h3')); if (!name) return;
            const role = clean(c.querySelector('.team-role'));
            out.push({ kind: 'person', title: name, subtitle: role, tags: [role, 'faculty', 'core panel'], text: clean(c.querySelector('p')),
                snippet: clean(c.querySelector('p')), target: { type: 'page', page: 'about.html', hash: 'core-panels' } });
        });
        doc.querySelectorAll('.dept').forEach((d) => {
            const dept = clean(d.querySelector('.dept-title'));
            const hash = d.id || 'student-council';
            const desc = clean(d.querySelector('.dept-desc'));
            if (desc) out.push({ kind: 'department', title: dept, subtitle: 'Student Council', tags: ['department', 'team'], text: desc, snippet: desc,
                target: { type: 'page', page: 'about.html', hash } });
            d.querySelectorAll('.council-card').forEach((c) => {
                const name = clean(c.querySelector('.person')); if (!name) return;
                const role = clean(c.querySelector('.position'));
                out.push({ kind: 'person', title: name, subtitle: `${role} · ${dept}`, tags: [role, dept, 'council', 'student'], text: `${role} ${dept}`,
                    snippet: `${role}, ${dept}`, target: { type: 'page', page: 'about.html', hash } });
            });
        });
        const intro = clean(doc.querySelector('.about-intro-copy .section-sub'));
        if (intro) out.push({ kind: 'about', title: 'About the society', subtitle: 'About', tags: ['about', 'mission', 'society'], text: intro, snippet: intro,
            target: { type: 'page', page: 'about.html', hash: 'society-intro' } });
        return out;
    }

    async function homeRecords() {
        const doc = await pageDoc('index.html');
        const out = { announcements: [], opportunities: [], galleryCount: 0 };
        if (!doc) return out;
        doc.querySelectorAll('.notif-card').forEach((c) => {
            const title = clean(c.querySelector('h3')).replace(/^[^\p{L}\p{N}]+/u, '');
            const dateText = clean(c.querySelector('.notif-date'));
            const a = c.querySelector('a.read-more');
            const href = a ? a.getAttribute('href') : '';
            const ext = /^https?:/i.test(href || '');
            out.announcements.push({ kind: 'announcement', title, subtitle: dateText, tags: ['announcement', 'news'], text: clean(c.querySelector('p')),
                snippet: clean(c.querySelector('p')), date: new Date(dateText) instanceof Date && !isNaN(new Date(dateText)) ? new Date(dateText) : null,
                target: ext ? { type: 'external', href } : { type: 'page', page: href || 'index.html', hash: href ? '' : 'announcements' },
                linkLabel: a ? clean(a).replace(/\s*→\s*$/, '') : 'Open' });
        });
        doc.querySelectorAll('.opp-card').forEach((c) => {
            out.opportunities.push({ kind: 'opportunity', title: clean(c.querySelector('h3')), subtitle: clean(c.querySelector('.opp-tag')), tags: ['opportunity', 'role'],
                text: clean(c.querySelector('p')), snippet: clean(c.querySelector('p')), target: { type: 'page', page: 'index.html', hash: 'opportunities' } });
        });
        out.galleryCount = doc.querySelectorAll('.gallery-tile').length;
        return out;
    }

    function contactInfo() {
        const q = (sel) => document.querySelector('footer ' + sel);
        const mail = q('a[href^="mailto:"]'), ig = q('a[href*="instagram.com"]'), li = q('a[href*="linkedin.com"]');
        return {
            email: mail ? mail.getAttribute('href').replace(/^mailto:/, '') : null,
            instagram: ig ? ig.href : null, linkedin: li ? li.href : null,
        };
    }

    async function load() {
        if (cache) return cache;
        cache = (async () => {
            if (!window.CSES_EVENTS) await loadScript(new URL('data/events-data.js', root).href);
            let sz = {};
            try { const r = await fetch(new URL('data/studentzone.json', root).href); if (r.ok) sz = await r.json(); } catch (e) { /* none */ }
            const [people, home] = await Promise.all([aboutRecords(), homeRecords()]);
            return {
                events: eventRecords(),
                resources: resourceRecords(sz),
                subjectsBySemester: sz.subjects_by_semester || {},
                subjectIndex: buildSubjectIndex(sz.subjects_by_semester || {}),
                people, announcements: home.announcements, opportunities: home.opportunities, galleryCount: home.galleryCount,
                contact: contactInfo(),
            };
        })();
        return cache;
    }
    return { load };
}
